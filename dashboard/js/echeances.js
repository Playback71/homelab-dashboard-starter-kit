// echeances.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// "Deadlines" and "Restore test" cards (NOC Monitoring section of index.html)
// Source: /echeances.json, edited by hand (domain and certificate expiry dates, dates of the restore tests).
// Same rules as the "Deadlines" line of the n8n report (node "Préparer systèmes").
(function () {
    const SOURCE = '/echeances.json';
    const COULEUR = { ok: '#00ff88', warn: '#ffc107', crit: '#ff4d4d' };
    const CRIT_JOURS = 7;   // a deadline 7 days away or less (or past) = CRIT
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pire = (a, b) => ({ ok: 0, warn: 1, crit: 2 }[b] > { ok: 0, warn: 1, crit: 2 }[a] ? b : a);

    // Number of days between today and a YYYY-MM-DD date (negative if past); null if missing or unreadable
    function jours(d) {
        if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return null;
        const [a, m, j] = d.slice(0, 10).split('-').map(Number);
        const cible = new Date(a, m - 1, j);
        const auj = new Date(); auj.setHours(0, 0, 0, 0);
        return Math.round((cible - auj) / 86400000);
    }
    const dateCourte = d => { const n = jours(d); if (n === null) return '?'; const [a, m, j] = d.slice(0, 10).split('-').map(Number); return new Date(a, m - 1, j).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' }); };

    function carte(id, niveau, valeur, lignes) {
        const v = document.getElementById(id + '-val');
        const d = document.getElementById(id + '-detail');
        if (!v || !d) return;
        v.textContent = valeur;
        v.style.color = COULEUR[niveau];
        v.style.textShadow = '0 0 15px ' + COULEUR[niveau];
        d.innerHTML = lignes.slice(0, 3).map(esc).join('<br>');
    }

    function echeances(liste) {
        let n = 'ok';
        const items = liste.map(e => {
            const r = jours(e.date);
            let niv = 'ok';
            if (r !== null && r <= CRIT_JOURS) niv = 'crit';
            else if (r !== null && r <= (e.alerte_jours || 30)) niv = 'warn';
            n = pire(n, niv);
            return { e, r, niv };
        }).filter(x => x.r !== null).sort((a, b) => a.r - b.r);
        if (!items.length) { carte('ech', 'warn', '--', ['No date in echeances.json']); return; }
        const proche = items[0];
        const valeur = proche.r < 0 ? 'EXPIRED' : proche.r + ' d';
        const lignes = items.slice(0, 3).map(x =>
            x.e.nom + ': ' + dateCourte(x.e.date) + (x.r < 0 ? ' (expired)' : ' (' + x.r + ' d)'));
        carte('ech', n, valeur, lignes);
    }

    function restaurations(liste) {
        let n = 'ok';
        const pb = [], okl = [];
        liste.forEach(t => {
            const r = jours(t.dernier_test);
            const age = r === null ? null : -r;
            if (age === null) { n = pire(n, 'warn'); pb.push(t.nom + ': never tested'); }
            else if (age > (t.max_jours || 90)) { n = pire(n, 'warn'); pb.push(t.nom + ': ' + age + ' days ago'); }
            else okl.push(t.nom + ': ' + age + ' days ago');
        });
        if (!liste.length) { carte('rest', 'warn', '--', ['No test in echeances.json']); return; }
        const valeur = n === 'ok' ? 'OK' : 'TO DO';
        carte('rest', n, valeur, pb.concat(okl));
    }

    async function charger() {
        try {
            const r = await fetch(SOURCE, { cache: 'no-store' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const j = await r.json();
            echeances(Array.isArray(j.echeances) ? j.echeances : []);
            restaurations(Array.isArray(j.restaurations) ? j.restaurations : []);
        } catch (e) {
            ['ech', 'rest'].forEach(id => carte(id, 'warn', '--', ['echeances.json unreadable (' + e.message + ')']));
        }
    }
    charger();
    setInterval(charger, 300000);   // every 5 minutes: the file rarely changes
})();
