package main

import (
	"bytes"
	"encoding/json"
	"genealogy-app/model"
	"genealogy-app/parser"
	"html/template"
	"log"
	"net/http"
	"sync"

	"github.com/yuin/goldmark"
)

var (
	people    map[string]*model.Person
	peopleMux sync.RWMutex
	templates *template.Template
)

func main() {
	var err error
	// Load data initially
	reload()

	// Parse templates
	templates, err = template.ParseGlob("templates/*.html")
	if err != nil {
		log.Fatalf("Failed to parse templates: %v", err)
	}

	mux := http.NewServeMux()

	// Static files
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Person data assets (photos, documents)
	mux.Handle("/data/", http.StripPrefix("/data/", http.FileServer(http.Dir("data"))))

	// API
	mux.HandleFunc("/api/tree", handleTreeAPI)

	// Pages
	mux.HandleFunc("/", handleIndex)
	mux.HandleFunc("/person/", handlePerson)

	log.Println("Server starting on :8080...")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func reload() {
	peopleMux.Lock()
	defer peopleMux.Unlock()

	p, err := parser.LoadPeople("data")
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

	data := struct {
		Person  *model.Person
		Content template.HTML
	}{
		Person:  p,
		Content: template.HTML(buf.String()),
	}

	if err := templates.ExecuteTemplate(w, "person.html", data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
