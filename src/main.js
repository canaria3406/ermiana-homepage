const revealItems = document.querySelectorAll('.reveal');
const platformDirectory = document.querySelector('.platform-directory');
const platformCount = document.querySelector('[data-platform-count]');
const root = document.documentElement;

const storage = {
    get(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
    }
};

/* ---------- i18n ---------- */
const DEFAULT_LANG = 'zh-Hant';
const dictionaries = window.ERMIANA_I18N || {};
const supportedLangs = [DEFAULT_LANG, 'ja', 'en'];
const LANG_SHORT = { 'zh-Hant': '繁中', ja: '日本語', en: 'EN' };
const langSwitch = document.querySelector('[data-lang-switch]');
const langTrigger = langSwitch ? langSwitch.querySelector('.lang-trigger') : null;
const langCurrent = langSwitch ? langSwitch.querySelector('.lang-current') : null;
const langOptions = langSwitch ? Array.from(langSwitch.querySelectorAll('[data-lang]')) : [];

// zh-Hant copy lives in the HTML; remember it so switching back restores it.
const originals = new Map();
document.querySelectorAll('[data-i18n]').forEach((el) => originals.set(el, { text: el.textContent }));
document.querySelectorAll('[data-i18n-html]').forEach((el) => originals.set(el, { html: el.innerHTML }));
document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const entry = originals.get(el) || {};
    entry.aria = el.getAttribute('aria-label');
    originals.set(el, entry);
});

function detectLang() {
    const fromQuery = new URLSearchParams(window.location.search).get('lang');
    if (supportedLangs.includes(fromQuery)) return fromQuery;
    const stored = storage.get('lang');
    if (supportedLangs.includes(stored)) return stored;
    const preferred = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    if (/^ja/i.test(preferred)) return 'ja';
    if (/^zh/i.test(preferred)) return DEFAULT_LANG;
    return preferred ? 'en' : DEFAULT_LANG;
}

function t(lang, key) {
    const dict = dictionaries[lang] || {};
    return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined;
}

let currentLang = DEFAULT_LANG;

function applyLang(lang) {
    currentLang = supportedLangs.includes(lang) ? lang : DEFAULT_LANG;
    const isDefault = currentLang === DEFAULT_LANG;
    root.setAttribute('lang', currentLang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const value = isDefault ? undefined : t(currentLang, el.dataset.i18n);
        el.textContent = value !== undefined ? value : originals.get(el).text;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const value = isDefault ? undefined : t(currentLang, el.dataset.i18nHtml);
        el.innerHTML = value !== undefined ? value : originals.get(el).html;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        const value = isDefault ? undefined : t(currentLang, el.dataset.i18nAria);
        el.setAttribute('aria-label', value !== undefined ? value : originals.get(el).aria);
    });

    if (platformDirectory && platformCount) {
        const format = t(currentLang, 'platCount') || t(DEFAULT_LANG, 'platCount');
        if (format) platformCount.textContent = format(platformDirectory.childElementCount);
    }
    if (langCurrent) langCurrent.textContent = LANG_SHORT[currentLang];
    if (langTrigger) {
        const label = t(currentLang, 'langLabel') || t(DEFAULT_LANG, 'langLabel') || 'Language';
        langTrigger.setAttribute('aria-label', `${label}: ${LANG_SHORT[currentLang]}`);
    }
    langOptions.forEach((option) => {
        if (option.dataset.lang === currentLang) option.setAttribute('aria-current', 'true');
        else option.removeAttribute('aria-current');
    });
    updateThemeToggle();
}

/* Language popover: a disclosure button plus a short list of buttons. */
function isLangMenuOpen() {
    return langSwitch && langSwitch.classList.contains('is-open');
}

function openLangMenu(focusTarget) {
    if (!langSwitch) return;
    langSwitch.classList.add('is-open');
    langTrigger.setAttribute('aria-expanded', 'true');
    const current = langOptions.find((option) => option.dataset.lang === currentLang) || langOptions[0];
    const target = focusTarget === 'last' ? langOptions[langOptions.length - 1] : current;
    // Wait a frame so the menu is visible (focusable) before moving focus.
    window.requestAnimationFrame(() => target && target.focus());
}

function closeLangMenu(returnFocus) {
    if (!isLangMenuOpen()) return;
    langSwitch.classList.remove('is-open');
    langTrigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) langTrigger.focus();
}

if (langSwitch && langTrigger) {
    langTrigger.addEventListener('click', () => {
        if (isLangMenuOpen()) closeLangMenu(false);
        else openLangMenu();
    });
    langTrigger.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openLangMenu(event.key === 'ArrowUp' ? 'last' : undefined);
        }
    });
    langOptions.forEach((option, index) => {
        option.addEventListener('click', () => {
            storage.set('lang', option.dataset.lang);
            applyLang(option.dataset.lang);
            closeLangMenu(true);
        });
        option.addEventListener('keydown', (event) => {
            let next = null;
            if (event.key === 'ArrowDown') next = langOptions[(index + 1) % langOptions.length];
            else if (event.key === 'ArrowUp') next = langOptions[(index - 1 + langOptions.length) % langOptions.length];
            else if (event.key === 'Home') next = langOptions[0];
            else if (event.key === 'End') next = langOptions[langOptions.length - 1];
            if (next) {
                event.preventDefault();
                next.focus();
            }
        });
    });
    langSwitch.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isLangMenuOpen()) {
            event.preventDefault();
            closeLangMenu(true);
        }
    });
    // Close when keyboard focus moves elsewhere. Pointer clicks outside are handled below
    // (relatedTarget is null for those, e.g. Safari doesn't focus buttons on click).
    langSwitch.addEventListener('focusout', (event) => {
        if (event.relatedTarget && !langSwitch.contains(event.relatedTarget)) closeLangMenu(false);
    });
    document.addEventListener('click', (event) => {
        if (!langSwitch.contains(event.target)) closeLangMenu(false);
    });
}

/* ---------- theme ---------- */
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'dark' ? '#121315' : '#f5f8fa');
    updateThemeToggle();
}

function updateThemeToggle() {
    if (!themeToggle) return;
    const isDark = root.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    const key = isDark ? 'themeToLight' : 'themeToDark';
    const label = t(currentLang, key) || t(DEFAULT_LANG, key);
    if (label) themeToggle.setAttribute('aria-label', label);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        storage.set('theme', next);
        setTheme(next);
    });
}

if (systemDark) {
    const followSystem = (event) => {
        const stored = storage.get('theme');
        if (stored === 'light' || stored === 'dark') return;
        setTheme(event.matches ? 'dark' : 'light');
    };
    if (systemDark.addEventListener) systemDark.addEventListener('change', followSystem);
    else if (systemDark.addListener) systemDark.addListener(followSystem);
}

setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
applyLang(detectLang());

/* ---------- reveal on scroll ---------- */
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('js');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
}
