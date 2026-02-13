(function () {
    const STYLE_KEY = 'sippschaft-style';
    const MODE_KEY = 'sippschaft-mode';
    const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

    function getStoredStyle() {
        return localStorage.getItem(STYLE_KEY) || 'classic';
    }

    function getStoredMode() {
        return localStorage.getItem(MODE_KEY) || 'auto';
    }

    function resolveMode(mode) {
        if (mode === 'auto') return darkMQ.matches ? 'dark' : 'light';
        return mode;
    }

    function apply() {
        const style = getStoredStyle();
        const mode = getStoredMode();
        const resolved = resolveMode(mode);
        document.documentElement.dataset.themeStyle = style;
        document.documentElement.dataset.themeMode = resolved;
        // Sync selector UI if present
        const styleSelect = document.getElementById('theme-style');
        const modeSelect = document.getElementById('theme-mode');
        if (styleSelect) styleSelect.value = style;
        if (modeSelect) modeSelect.value = mode;
        // Notify listeners (e.g. tree.js re-render)
        document.dispatchEvent(new CustomEvent('themechange'));
    }

    function setStyle(value) {
        localStorage.setItem(STYLE_KEY, value);
        apply();
    }

    function setMode(value) {
        localStorage.setItem(MODE_KEY, value);
        apply();
    }

    // Apply immediately (before body renders) to avoid flash
    apply();

    // Re-apply when OS dark mode changes (only matters if mode is "auto")
    darkMQ.addEventListener('change', function () {
        if (getStoredMode() === 'auto') apply();
    });

    // Wire up selectors and header menu once DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        var styleSelect = document.getElementById('theme-style');
        var modeSelect = document.getElementById('theme-mode');
        if (styleSelect) {
            styleSelect.value = getStoredStyle();
            styleSelect.addEventListener('change', function () { setStyle(this.value); });
        }
        if (modeSelect) {
            modeSelect.value = getStoredMode();
            modeSelect.addEventListener('change', function () { setMode(this.value); });
        }

        // Header menu toggle
        var menuToggle = document.querySelector('.header-menu-toggle');
        var menuDropdown = document.querySelector('.header-menu-dropdown');
        if (menuToggle && menuDropdown) {
            menuToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                menuDropdown.classList.toggle('open');
            });
            menuDropdown.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            document.addEventListener('click', function () {
                menuDropdown.classList.remove('open');
            });
        }
    });
})();
