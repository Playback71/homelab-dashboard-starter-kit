// acces-externe.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// "Remote access" card (NOC Monitoring section of index.html)
// Source: /n8n-tunnels/ (Nginx relay to the n8n workflow "Statut tunnels et VPN"),
// which returns the state of the Cloudflare tunnels and of the firewall gateways (WAN, VPN). Refreshed every minute.
// Same rules as the "Tunnels and VPN" line of the morning report (node "Préparer systèmes").
(function () {
    const SOURCE = '/n8n-tunnels/';
    const COULEUR = { ok: '#00ff88', warn: '#ffc107', crit: '#ff4d4d' };
    const RANG = { ok: 0, warn: 1, crit: 2 };
    const PERTE_MAX_PCT = 10;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pire = (a, b) => (RANG[b] > RANG[a] ? b : a);
    const pastille = n => '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;background:' +
        COULEUR[n] + ';box-shadow:0 0 6px ' + COULEUR[n] + '"></span>';

    function afficher(niveau, valeur, lignes) {
        const v = document.getElementById('acces-val');
        const d = document.getElementById('acces-detail');
        if (!v || !d) return;
        v.textContent = valeur;
        v.style.color = COULEUR[niveau];
        v.style.textShadow = '0 0 15px ' + COULEUR[niveau];
        d.innerHTML = lignes.join('<br>');
    }

    async function charger() {
        try {
            const r = await fetch(SOURCE, { cache: 'no-store' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const j = await r.json();
            let n = 'ok';
            const lignes = [];

            if (j.tunnels_erreur) { n = pire(n, 'warn'); lignes.push(pastille('warn') + 'Tunnels: ' + esc(j.tunnels_erreur)); }
            (j.tunnels || []).forEach(t => {
                const et = String(t.etat || '').toLowerCase();
                let tn = 'ok';
                if (et === 'down' || et === 'inactive') tn = 'crit';
                else if (et !== 'healthy' || !t.connexions) tn = 'warn';
                n = pire(n, tn);
                lignes.push(pastille(tn) + 'Tunnel ' + esc(t.nom) + ': ' + esc(et) + ' (' + (t.connexions || 0) + ' conn.)');
            });

            if (j.passerelles_erreur) { n = pire(n, 'warn'); lignes.push(pastille('warn') + 'Gateways: ' + esc(j.passerelles_erreur)); }
            (j.passerelles || []).forEach(g => {
                let gn = 'ok';
                if (!/^(online|up|ok)$/i.test(g.etat || '')) gn = 'crit';
                else if ((g.perte_pct || 0) >= PERTE_MAX_PCT || (g.sous_etat && !/^(none|)$/i.test(g.sous_etat))) gn = 'warn';
                n = pire(n, gn);
                const nom = g.vpn ? 'NordVPN' : (/wan/i.test(g.nom) ? 'Internet (WAN)' : g.nom);
                lignes.push(pastille(gn) + esc(nom) + ': ' + esc(g.etat || '?') + (g.perte_pct ? ' (' + g.perte_pct + ' % loss)' : ''));
            });

            const total = (j.tunnels || []).length + (j.passerelles || []).length;
            const bons = lignes.filter(l => l.includes(COULEUR.ok)).length;
            afficher(n, n === 'ok' ? 'OK' : (n === 'crit' ? 'DOWN' : bons + '/' + total), lignes);
        } catch (e) {
            afficher('warn', '--', ['Status unavailable (' + esc(e.message) + ')']);
        }
    }
    charger();
    setInterval(charger, 60000);
})();
