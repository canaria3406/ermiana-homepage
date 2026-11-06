/* ermiana page script. Theme, language menu, translations and [data-reveal] come from canaria.js. */
const platformDirectory = document.querySelector('.platform-directory');
const platformCount = document.querySelector('[data-platform-count]');

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
