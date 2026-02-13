package model

// NameEntry represents a name the person used during their life.
type NameEntry struct {
	Name  string `yaml:"name" json:"name"`
	Type  string `yaml:"type,omitempty" json:"type,omitempty"`   // birth, married, divorced, chosen, legal, religious
	Since string `yaml:"since,omitempty" json:"since,omitempty"` // Date or year when this name was adopted
}

// Person represents the data structure for a single individual in the family tree.
type Person struct {
	Name      string      `yaml:"name" json:"name"`
	Names     []NameEntry `yaml:"names,omitempty" json:"names,omitempty"`
	Nicknames []string    `yaml:"nicknames,omitempty" json:"nicknames,omitempty"`
	Sex       string      `yaml:"sex" json:"sex"`           // "male", "female", or "diverse"
	Birth     string      `yaml:"birth" json:"birth"`       // ISO 8601 Date
	Death     string      `yaml:"death" json:"death"`       // ISO 8601 Date or empty
	Parents   []string    `yaml:"parents" json:"parents"`   // Folder names of parents
	Spouses   []string    `yaml:"spouses" json:"spouses"`   // Folder names of spouses
	Children  []string    `yaml:"children" json:"children"` // Folder names of children

	// Derived at load time, not stored in YAML
	ID      string `yaml:"-" json:"id"`      // Folder name
	Photo   string `yaml:"-" json:"photo"`   // URL path to avatar
	Content string `yaml:"-" json:"content"` // Biography markdown
}
