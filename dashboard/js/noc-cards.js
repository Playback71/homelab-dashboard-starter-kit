// noc-cards.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// Bottom cards (index.html and reseau.html) fed with real data
//  - Network  : Kuma monitors of the "homelab" status page (via /kuma-api/)
//  - Traffic  : throughput of the pfSense WAN interface (via /pfs-api/, read only)
//  - Security : pfSense state (gateways, interfaces, services) + recent blocks
(function () {
    var KUMA_URL = '/kuma-api/api/status-page/heartbeat/homelab';
    var PFS = '/pfs-api/';
    var COLORS = { warn: '#ffc107', crit: '#ff4a4a' };

    function $(id) { return document.getElementById(id); }

    // Color of the big number: cyan by default (existing style), orange or red if there is a problem
    function paint(el, level) {
        var c = COLORS[level] || '';
        el.style.color = c;
        el.style.textShadow = c ? '0 0 15px ' + c : '';
    }

    function setText(id, txt) {
        var el = $(id);
        if (el) el.textContent = txt;
    }

    // ---------- pfSense ----------
    var pfsStopped = false; // becomes true if the key is refused (avoids getting blocked by pfSense)

    async function pfs(path) {
        var r = await fetch(PFS + path, { cache: 'no-store' });
        if (r.status === 401 || r.status === 403) pfsStopped = true;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return (await r.json()).data;
    }

    function fmtRate(bps) {
        if (bps >= 1e9) return (bps / 1e9).toFixed(2) + ' Gb/s';
        if (bps >= 1e6) return (bps / 1e6).toFixed(1) + ' Mb/s';
        if (bps >= 1e3) return Math.round(bps / 1e3) + ' kb/s';
        return Math.round(bps) + ' b/s';
    }

    // ---------- Network card (Kuma) ----------
    async function updateNetworkCard() {
        var val = $('noc-net-val');
        if (!val) return;
        try {
            var r = await fetch(KUMA_URL, { cache: 'no-store' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            var hb = (await r.json()).heartbeatList || {};
            var total = 0, down = 0;
            Object.keys(hb).forEach(function (id) {
                var list = hb[id];
                if (!list || !list.length) return;
                total++;
                if (list[list.length - 1].status === 0) down++;
            });
            if (total === 0) throw new Error('no monitor');
            var up = total - down;
            if (down === 0) { val.textContent = 'ONLINE'; paint(val, ''); }
            else if (up === 0) { val.textContent = 'OFFLINE'; paint(val, 'crit'); }
            else { val.textContent = 'DEGRADED'; paint(val, 'warn'); }
            setText('noc-net-detail', up + '/' + total + ' devices online');
        } catch (e) {
            console.error('Network card:', e);
            val.textContent = 'UNAVAILABLE';
            paint(val, 'crit');
            setText('noc-net-detail', 'Kuma unreachable');
        }
    }

    // ---------- WAN traffic card (pfSense) ----------
    var lastSample = null;

    function findWan(list) {
        var exact = list.find(function (i) {
            return i.name === 'wan' || /^wan$/i.test(i.descr || '');
        });
        return exact || list.find(function (i) { return /wan/i.test(i.descr || ''); });
    }

    async function updateTrafficCard() {
        var val = $('noc-traffic-val');
        if (!val || pfsStopped) return;
        try {
            var list = await pfs('interfaces');
            var wan = findWan(list || []);
            if (!wan) {
                console.warn('WAN interface not found, interfaces:', (list || []).map(function (i) { return i.name + '/' + i.descr; }));
                throw new Error('WAN not found');
            }
            var now = performance.now();
            var rx = Number(wan.inbytes), tx = Number(wan.outbytes);
            if (lastSample) {
                var dt = (now - lastSample.t) / 1000;
                var dRx = rx - lastSample.rx, dTx = tx - lastSample.tx;
                if (dt > 0 && dRx >= 0 && dTx >= 0) { // negative = counter reset, skip this cycle
                    var down = dRx * 8 / dt, up = dTx * 8 / dt;
                    val.textContent = fmtRate(down + up);
                    setText('noc-traffic-down', fmtRate(down));
                    setText('noc-traffic-up', fmtRate(up));
                }
            }
            lastSample = { t: now, rx: rx, tx: tx };
        } catch (e) {
            console.error('Traffic card:', e);
            lastSample = null;
            val.textContent = '--';
            setText('noc-traffic-down', '--');
            setText('noc-traffic-up', '--');
        }
    }

    // ---------- Security card (pfSense) ----------
    async function updateSecurityCard() {
        var val = $('noc-sec-val');
        if (!val || pfsStopped) return;
        var paths = { gateways: 'gateways', interfaces: 'interfaces', services: 'services', log: 'logs/firewall?limit=500&reverse=true' };
        var R = {};
        await Promise.all(Object.keys(paths).map(async function (k) {
            try { R[k] = await pfs(paths[k]); } catch (e) { R[k] = null; }
        }));

        if (pfsStopped) {
            val.textContent = 'KEY REFUSED';
            paint(val, 'crit');
            setText('noc-sec-detail', 'Refresh stopped');
            setText('noc-sec-blocks', '');
            return;
        }
        if (!R.gateways && !R.interfaces && !R.services) {
            val.textContent = 'UNAVAILABLE';
            paint(val, 'crit');
            setText('noc-sec-detail', 'pfSense unreachable');
            setText('noc-sec-blocks', '');
            return;
        }

        // Same logic as pfsense.html
        var issue = null;
        (R.gateways || []).forEach(function (g) {
            if (!issue && g.status !== 'online') issue = 'Gateway ' + g.name + ' offline';
        });
        (R.interfaces || []).forEach(function (i) {
            if (!issue && i.status !== 'up') issue = 'Interface ' + (i.descr || i.name) + ' down';
        });
        (R.services || []).forEach(function (s) {
            var ok = s.status === true || s.status === 'running' || !s.enabled;
            if (!issue && !ok) issue = 'Service ' + s.name + ' stopped';
        });

        if (issue) {
            val.textContent = 'WARNING';
            paint(val, 'warn');
            setText('noc-sec-detail', issue);
        } else {
            val.textContent = 'OK';
            paint(val, '');
            setText('noc-sec-detail', 'Gateways, interfaces and services OK');
        }

        if (R.log) {
            var blocks = 0, total = 0;
            R.log.forEach(function (e) {
                var t = String(e.text).split(']: ').pop().split(',');
                if (t.length < 7) return;
                total++;
                if (t[6] === 'block') blocks++;
            });
            setText('noc-sec-blocks', blocks + (blocks > 1 ? ' blocks' : ' block') + ' in ' + total + ' recent entries');
        } else {
            setText('noc-sec-blocks', 'Firewall log unavailable');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateNetworkCard();
        setInterval(updateNetworkCard, 15000);

        updateSecurityCard();
        setInterval(updateSecurityCard, 30000);

        updateTrafficCard();
        setInterval(updateTrafficCard, 5000);
    });
})();
