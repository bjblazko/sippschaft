package parser

import (
	"fmt"
	"genealogy-app/model"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// LoadPeople walks the data directory for person folders and returns a map of folder name -> Person.
func LoadPeople(dataDir string) (map[string]*model.Person, error) {
	people := make(map[string]*model.Person)

	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read data directory: %w", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		folderName := entry.Name()
		folderPath := filepath.Join(dataDir, folderName)

		p, err := loadPerson(folderPath, folderName)
		if err != nil {
			return nil, fmt.Errorf("failed to load %s: %w", folderName, err)
		}

		people[folderName] = p
	}

	return people, nil
}

func loadPerson(folderPath, folderName string) (*model.Person, error) {
	// Parse person.yaml
	yamlPath := filepath.Join(folderPath, "person.yaml")
	yamlData, err := os.ReadFile(yamlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read person.yaml: %w", err)
	}

	var p model.Person
	if err := yaml.Unmarshal(yamlData, &p); err != nil {
		return nil, fmt.Errorf("YAML error: %w", err)
	}

	// Set derived ID from folder name
	p.ID = folderName

	// Read person.md (biography)
	mdPath := filepath.Join(folderPath, "person.md")
	if mdData, err := os.ReadFile(mdPath); err == nil {
		p.Content = string(mdData)
	}

	// Detect avatar file
	if avatarFile, found := findAvatar(folderPath); found {
		p.Photo = "/data/" + folderName + "/" + avatarFile
	}

	// Default empty slices to avoid null in JSON
	if p.Parents == nil {
		p.Parents = []string{}
	}
	if p.Spouses == nil {
		p.Spouses = []string{}
	}
	if p.Children == nil {
		p.Children = []string{}
	}

	return &p, nil
}

func findAvatar(folderPath string) (string, bool) {
	for _, ext := range []string{".png", ".jpg", ".jpeg", ".webp", ".gif"} {
		name := "avatar" + ext
		if _, err := os.Stat(filepath.Join(folderPath, name)); err == nil {
			return name, true
		}
	}
	return "", false
}
