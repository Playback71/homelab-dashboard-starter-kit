// fit-page.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// Automatically adjusts the page zoom so it fits in the window, without scrolling.
// Computer only (width > 900 px): the phone keeps the 90 % zoom set in each page.
// To turn it off temporarily: add ?fit=0 to the page address.
(function () {
    var MIN = 0.70;    // minimum zoom: below it, text gets too small and the page scrolls again
    var STEP = 0.02;   // reduction step
    var root = document.documentElement;
    var header = null;   // the header (logo, menu, time) always keeps its normal size

    if (/[?&]fit=0/.test(location.search)) return;

    // True if the page is taller than the window (it can scroll)
    function canScroll() {
        window.scrollTo({ top: 99999, behavior: 'instant' });
        var s = window.scrollY > 1;
        window.scrollTo({ top: 0, behavior: 'instant' });
        return s;
    }

    // Applies the page zoom; the header gets the inverse zoom to stay at 100 %
    function apply(z) {
        root.style.zoom = z;
        if (!header) header = document.querySelector('header');
        if (header) header.style.zoom = z < 1 ? (1 / z) : '';
    }

    function fit() {
        if (window.innerWidth <= 900) {
            root.style.zoom = '';
            if (header) header.style.zoom = '';
            return;
        }
        var y = window.scrollY;
        var z = 1;
        apply(z);
        while (z > MIN && canScroll()) {
            z = Math.round((z - STEP) * 100) / 100;
            apply(z);
        }
        if (z === 1) { root.style.zoom = ''; if (header) header.style.zoom = ''; }
        window.scrollTo({ top: y, behavior: 'instant' });
    }

    var timer;
    window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(fit, 200);
    });
    window.addEventListener('load', function () {
        fit();
        setTimeout(fit, 1500);   // after the first API data arrives
        setTimeout(fit, 4000);
    });
    setInterval(fit, 5000);      // the data changes (Kuma, Home Assistant, Proxmox...)
    fit();
})();
