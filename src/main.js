/* ermiana page script. Theme, language menu and translations come from canaria.js. */
const revealItems = document.querySelectorAll('.reveal');
const platformDirectory = document.querySelector('.platform-directory');
const platformCount = document.querySelector('[data-platform-count]');
const root = document.documentElement;

/* ---------- i18n ---------- */
// zh-Hant copy lives in the HTML; src/i18n.js holds the other languages.
function updatePlatformCount() {
    if (!platformDirectory || !platformCount || !window.Canaria) return;
    const format = window.Canaria.i18n.t('platCount');
    if (typeof format === 'function') platformCount.textContent = format(platformDirectory.childElementCount);
}

document.addEventListener('canaria:langchange', updatePlatformCount);
if (window.Canaria) {
    window.Canaria.i18n.define(window.ERMIANA_I18N || {}, { defaultLang: 'zh-Hant' });
    updatePlatformCount();
}

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
