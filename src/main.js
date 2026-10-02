const revealItems = document.querySelectorAll('.reveal');
const platformDirectory = document.querySelector('.platform-directory');
const platformCount = document.querySelector('[data-platform-count]');

if (platformDirectory && platformCount) {
    platformCount.textContent = `目前支援 ${platformDirectory.childElementCount} 個平台`;
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
}
