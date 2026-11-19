// clock.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// Header clock, shared by the pages that do not have their own script
(function () {
    function tick() {
        var el = document.getElementById('clock');
        if (el) el.innerText = new Date().toTimeString().split(' ')[0];
    }
    tick();
    setInterval(tick, 1000);
})();
