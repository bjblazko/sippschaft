package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"flag"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sippschaft/model"
	"sippschaft/parser"
	"strings"
	"sync"
	"time"

	"github.com/yuin/goldmark"
)

var reLeadingH1 = regexp.MustCompile(`(?s)^\s*<h1>.*?</h1>\s*`)

var (
	dataDir   string
	people    map[string]*model.Person
	peopleMux sync.RWMutex
	templates *template.Template
)

func main() {
	var err error

	// Parse flags, fall back to env vars, then defaults
	var port string
	flag.StringVar(&dataDir, "data", "", "path to the data directory (default: ./data)")
	flag.StringVar(&port, "port", "", "port to listen on (default: 8080)")
	flag.Parse()
	if dataDir == "" {
		dataDir = os.Getenv("SIPPSCHAFT_DATA")
	}
	if dataDir == "" {
		dataDir = "data"
	}
	if port == "" {
		port = os.Getenv("SIPPSCHAFT_PORT")
	}
	if port == "" {
		port = "8080"
	}

	// Load data initially
	reload()

	// Watch data directory for changes and reload automatically
	go watchData(dataDir, 2*time.Second)

	// Parse templates
	templates, err = template.ParseGlob("templates/*.html")
	if err != nil {
		log.Fatalf("Failed to parse templates: %v", err)
	}

	mux := http.NewServeMux()

	// Static files
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Person data assets (photos, documents)
	mux.Handle("/data/", http.StripPrefix("/data/", http.FileServer(http.Dir(dataDir))))

	// API
	mux.HandleFunc("/api/tree", handleTreeAPI)
	mux.HandleFunc("/export", handleExport)

	// Pages
	mux.HandleFunc("/", handleIndex)
	mux.HandleFunc("/person/", handlePerson)

	log.Printf("Data directory: %s", dataDir)
	log.Printf("Server starting on :%s...", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// watchData polls the data directory for file changes and triggers a reload.
func watchData(dir string, interval time.Duration) {
	var lastFingerprint string
	for {
		time.Sleep(interval)
		fp := dataFingerprint(dir)
		if fp != lastFingerprint {
			if lastFingerprint != "" {
				log.Println("Data directory changed, reloading...")
				reload()
			}
			lastFingerprint = fp
		}
	}
}

// dataFingerprint walks the data directory and builds a string from all file paths
// and their modification times. Any change to this string means something changed.
func dataFingerprint(dir string) string {
	var buf bytes.Buffer
	filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		buf.WriteString(path)
		buf.WriteString(info.ModTime().String())
		buf.WriteString("|")
		return nil
	})
	return buf.String()
}

func reload() {
	peopleMux.Lock()
	defer peopleMux.Unlock()

	p, err := parser.LoadPeople(dataDir)
	if err != nil {
		log.Printf("Error loading people: %v", err)
		return
	}
	people = p
	log.Printf("Loaded %d people", len(people))
}

func handleTreeAPI(w http.ResponseWriter, r *http.Request) {
	peopleMux.RLock()
	defer peopleMux.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(people); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	if err := templates.ExecuteTemplate(w, "index.html", nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handlePerson(w http.ResponseWriter, r *http.Request) {
	// Expected path: /person/{id}
	id := r.URL.Path[len("/person/"):]

	peopleMux.RLock()
	p, ok := people[id]
	names := buildNameMap()
	peopleMux.RUnlock()

	if !ok {
		http.NotFound(w, r)
		return
	}

	// Convert markdown to HTML
	var buf bytes.Buffer
	if err := goldmark.Convert([]byte(p.Content), &buf); err != nil {
		http.Error(w, "Error rendering markdown", http.StatusInternalServerError)
		return
	}

	// Strip leading <h1> to avoid duplicating the name already shown from YAML metadata
	html := reLeadingH1.ReplaceAll(buf.Bytes(), nil)

	data := struct {
		Person  *model.Person
		Content template.HTML
		Names   map[string]string
	}{
		Person:  p,
		Content: template.HTML(html),
		Names:   names,
	}

	if err := templates.ExecuteTemplate(w, "person.html", data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// buildNameMap returns a map from person ID to display name.
// Must be called while holding peopleMux (at least RLock).
func buildNameMap() map[string]string {
	m := make(map[string]string, len(people))
	for id, p := range people {
		m[id] = p.Name
	}
	return m
}

func handleExport(w http.ResponseWriter, r *http.Request) {
	peopleMux.RLock()
	defer peopleMux.RUnlock()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", `attachment; filename="sippschaft-export.zip"`)

	zw := zip.NewWriter(w)
	defer zw.Close()

	// 1. Build JSON data with relative photo paths (for the tree page)
	exportData := make(map[string]*model.Person)
	for id, p := range people {
		ep := *p
		if ep.Photo != "" {
			ep.Photo = strings.TrimPrefix(ep.Photo, "/")
		}
		ep.Content = "" // not needed in tree JSON
		exportData[id] = &ep
	}
	dataJSON, err := json.Marshal(exportData)
	if err != nil {
		http.Error(w, "Failed to marshal data", http.StatusInternalServerError)
		return
	}

	// 2. Render and add index.html with embedded JSON data
	indexData := struct {
		DataJSON template.JS
	}{
		DataJSON: template.JS(dataJSON),
	}
	var indexBuf bytes.Buffer
	if err := templates.ExecuteTemplate(&indexBuf, "export-index.html", indexData); err != nil {
		http.Error(w, "Failed to render index: "+err.Error(), http.StatusInternalServerError)
		return
	}
	f, _ := zw.Create("index.html")
	f.Write(indexBuf.Bytes())

	// 3. Render and add person pages
	names := buildNameMap()
	for id, p := range people {
		var mdBuf bytes.Buffer
		if err := goldmark.Convert([]byte(p.Content), &mdBuf); err != nil {
			continue
		}
		htmlBytes := reLeadingH1.ReplaceAll(mdBuf.Bytes(), nil)

		// Adjust absolute /data/ paths in biography HTML to relative ../data/
		htmlStr := strings.ReplaceAll(string(htmlBytes), `"/data/`, `"../data/`)
		htmlStr = strings.ReplaceAll(htmlStr, `'/data/`, `'../data/`)

		// Create person copy with photo path relative to person/ directory
		ep := *p
		if ep.Photo != "" {
			ep.Photo = "../" + strings.TrimPrefix(ep.Photo, "/")
		}

		personData := struct {
			Person  *model.Person
			Content template.HTML
			Names   map[string]string
		}{
			Person:  &ep,
			Content: template.HTML(htmlStr),
			Names:   names,
		}

		var personBuf bytes.Buffer
		if err := templates.ExecuteTemplate(&personBuf, "export-person.html", personData); err != nil {
			continue
		}
		f, _ := zw.Create("person/" + id + ".html")
		f.Write(personBuf.Bytes())
	}

	// 4. Copy static assets
	for _, sf := range []string{"static/css/style.css", "static/js/theme.js", "static/js/i18n.js", "static/js/tree.js", "static/js/d3.v7.min.js"} {
		content, err := os.ReadFile(sf)
		if err != nil {
			continue
		}
		f, _ := zw.Create(sf)
		f.Write(content)
	}

	// 5. Copy data assets (photos and other media, skip YAML and Markdown source files)
	for id := range people {
		personDir := filepath.Join(dataDir, id)
		entries, err := os.ReadDir(personDir)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			ext := strings.ToLower(filepath.Ext(entry.Name()))
			if ext == ".yaml" || ext == ".yml" || ext == ".md" {
				continue
			}
			content, err := os.ReadFile(filepath.Join(personDir, entry.Name()))
			if err != nil {
				continue
			}
			f, _ := zw.Create("data/" + id + "/" + entry.Name())
			f.Write(content)
		}
	}

	log.Printf("Export ZIP generated with %d people", len(people))
}
