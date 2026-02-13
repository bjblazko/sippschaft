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
            'menu.language': 'Language',
            'person.born': 'Born:',
            'person.died': 'Died:',
            'person.sex': 'Sex:',
            'person.names': 'Names',
            'person.aka': 'Also known as',
            'person.since': 'since',
            'person.parents': 'Parents',
            'person.spouses': 'Spouses',
            'person.children': 'Children'
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
            'menu.language': 'Sprache',
            'person.born': 'Geboren:',
            'person.died': 'Gestorben:',
            'person.sex': 'Geschlecht:',
            'person.names': 'Namen',
            'person.aka': 'Auch bekannt als',
            'person.since': 'seit',
            'person.parents': 'Eltern',
            'person.spouses': 'Ehepartner',
            'person.children': 'Kinder'
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
