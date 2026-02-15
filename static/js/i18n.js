(function () {
    var LANG_KEY = 'sippschaft-lang';

    var translations = {
        en: {
            'nav.back': '\u2190 Back to Tree',
            'view.tree': 'Tree View',
            'view.node': 'Node View',
            'theme.classic': 'Classic',
            'theme.modern': 'Modern',
            'theme.neon': 'Neon',
            'theme.homeComputer': 'Home Computer',
            'mode.auto': 'Auto',
            'mode.light': 'Light',
            'mode.dark': 'Dark',
            'menu.export': 'Export as static site',
            'menu.theme': 'Theme',
            'menu.mode': 'Mode',
            'menu.language': 'Language',
            'person.born': 'Born:',
            'person.died': 'Died:',
            'person.sex': 'Sex:',
            'person.names': 'Names',
            'person.aka': 'Also known as',
            'person.since': 'since',
            'person.parents': 'Parents',
            'person.spouses': 'Spouses',
            'person.children': 'Children',
            'bloodline.focus': 'Focus bloodline',
            'bloodline.showAll': 'Show all',
            'help.pan': 'Pan',
            'help.zoom': 'Zoom',
            'help.ancestors': 'Ancestors'
        },
        de: {
            'nav.back': '\u2190 Zur\u00fcck zum Stammbaum',
            'view.tree': 'Baumansicht',
            'view.node': 'Netzansicht',
            'theme.classic': 'Klassisch',
            'theme.modern': 'Modern',
            'theme.neon': 'Neon',
            'theme.homeComputer': 'Heimcomputer',
            'mode.auto': 'Auto',
            'mode.light': 'Hell',
            'mode.dark': 'Dunkel',
            'menu.export': 'Als statische Seite exportieren',
            'menu.theme': 'Thema',
            'menu.mode': 'Modus',
            'menu.language': 'Sprache',
            'person.born': 'Geboren:',
            'person.died': 'Gestorben:',
            'person.sex': 'Geschlecht:',
            'person.names': 'Namen',
            'person.aka': 'Auch bekannt als',
            'person.since': 'seit',
            'person.parents': 'Eltern',
            'person.spouses': 'Ehepartner',
            'person.children': 'Kinder',
            'bloodline.focus': 'Blutlinie anzeigen',
            'bloodline.showAll': 'Alle anzeigen',
            'help.pan': 'Bewegen',
            'help.zoom': 'Zoom',
            'help.ancestors': 'Vorfahren'
        },
        fr: {
            'nav.back': '\u2190 Retour \u00e0 l\u2019arbre',
            'view.tree': 'Vue arbre',
            'view.node': 'Vue r\u00e9seau',
            'theme.classic': 'Classique',
            'theme.modern': 'Moderne',
            'theme.neon': 'N\u00e9on',
            'theme.homeComputer': 'Micro-ordinateur',
            'mode.auto': 'Auto',
            'mode.light': 'Clair',
            'mode.dark': 'Sombre',
            'menu.export': 'Exporter en site statique',
            'menu.theme': 'Th\u00e8me',
            'menu.mode': 'Mode',
            'menu.language': 'Langue',
            'person.born': 'N\u00e9(e) :',
            'person.died': 'D\u00e9c\u00e9d\u00e9(e) :',
            'person.sex': 'Sexe :',
            'person.names': 'Noms',
            'person.aka': '\u00c9galement connu(e) sous',
            'person.since': 'depuis',
            'person.parents': 'Parents',
            'person.spouses': 'Conjoints',
            'person.children': 'Enfants',
            'bloodline.focus': 'Afficher la lign\u00e9e',
            'bloodline.showAll': 'Afficher tout',
            'help.pan': 'D\u00e9placer',
            'help.zoom': 'Zoom',
            'help.ancestors': 'Anc\u00eatres'
        },
        es: {
            'nav.back': '\u2190 Volver al \u00e1rbol',
            'view.tree': 'Vista \u00e1rbol',
            'view.node': 'Vista red',
            'theme.classic': 'Cl\u00e1sico',
            'theme.modern': 'Moderno',
            'theme.neon': 'Ne\u00f3n',
            'theme.homeComputer': 'Microordenador',
            'mode.auto': 'Auto',
            'mode.light': 'Claro',
            'mode.dark': 'Oscuro',
            'menu.export': 'Exportar como sitio est\u00e1tico',
            'menu.theme': 'Tema',
            'menu.mode': 'Modo',
            'menu.language': 'Idioma',
            'person.born': 'Nacimiento:',
            'person.died': 'Fallecimiento:',
            'person.sex': 'Sexo:',
            'person.names': 'Nombres',
            'person.aka': 'Tambi\u00e9n conocido/a como',
            'person.since': 'desde',
            'person.parents': 'Padres',
            'person.spouses': 'C\u00f3nyuges',
            'person.children': 'Hijos',
            'bloodline.focus': 'Mostrar linaje',
            'bloodline.showAll': 'Mostrar todos',
            'help.pan': 'Mover',
            'help.zoom': 'Zoom',
            'help.ancestors': 'Ancestros'
        },
        it: {
            'nav.back': '\u2190 Torna all\u2019albero',
            'view.tree': 'Vista albero',
            'view.node': 'Vista rete',
            'theme.classic': 'Classico',
            'theme.modern': 'Moderno',
            'theme.neon': 'Neon',
            'theme.homeComputer': 'Home computer',
            'mode.auto': 'Auto',
            'mode.light': 'Chiaro',
            'mode.dark': 'Scuro',
            'menu.export': 'Esporta come sito statico',
            'menu.theme': 'Tema',
            'menu.mode': 'Modalit\u00e0',
            'menu.language': 'Lingua',
            'person.born': 'Nascita:',
            'person.died': 'Decesso:',
            'person.sex': 'Sesso:',
            'person.names': 'Nomi',
            'person.aka': 'Conosciuto/a anche come',
            'person.since': 'dal',
            'person.parents': 'Genitori',
            'person.spouses': 'Coniugi',
            'person.children': 'Figli',
            'bloodline.focus': 'Mostra lignaggio',
            'bloodline.showAll': 'Mostra tutti',
            'help.pan': 'Spostare',
            'help.zoom': 'Zoom',
            'help.ancestors': 'Antenati'
        }
    };

    function getLang() {
        return localStorage.getItem(LANG_KEY) || 'en';
    }

    function setLang(lang) {
        localStorage.setItem(LANG_KEY, lang);
        applyTranslations();
        document.dispatchEvent(new CustomEvent('langchange'));
    }

    function applyTranslations() {
        var lang = getLang();
        var map = translations[lang] || translations.en;
        document.documentElement.lang = lang;

        // Expose translations for dynamic elements (e.g. bloodline bar)
        window.__sippschaft_i18n = map;

        var els = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < els.length; i++) {
            var key = els[i].getAttribute('data-i18n');
            if (map[key] !== undefined) {
                els[i].textContent = map[key];
            }
        }

        // Sync language selector if present
        var langSelect = document.getElementById('lang-select');
        if (langSelect) langSelect.value = lang;
    }

    // Set lang attribute immediately to avoid flash
    document.documentElement.lang = getLang();

    // Apply translations and wire up selector once DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        applyTranslations();

        var langSelect = document.getElementById('lang-select');
        if (langSelect) {
            langSelect.value = getLang();
            langSelect.addEventListener('change', function () {
                setLang(this.value);
            });
        }
    });
})();
