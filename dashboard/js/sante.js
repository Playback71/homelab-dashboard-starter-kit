// sante.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// "Disks" and "Backups" cards of the TrueNAS and Synology sections of index.html
// Sources: /sante-truenas.json (script truenas-sante.py) and /syno-status/synology-sante.json
// (Nginx relay to the Synology, script synology-sante.py). Refreshed every minute.
// The field names of the JSON files are in French (etat = state, nom = name, disques = disks, taches = tasks...).
(function () {
    const SOURCES = {
        tn: '/sante-truenas.json',
        syno: '/syno-status/synology-sante.json'
    };
    const COULEUR = { ok: '#00ff88', warn: '#ffc107', crit: '#ff4d4d', na: '#00eaff' };
    const SAUVEGARDE_MAX_JOURS = 8, SCRUB_MAX_JOURS = 45, TEMP_MAX = 55, USURE_MAX = 80;
    const DONNEES_MAX_HEURES = 2;   // the script runs every 30 min

    // Synology: number of days without a backup before showing OLD, depending on how often each task runs.
    // The task name is compared to the patterns in order (the first match wins).
    // A task that matches nothing keeps SAUVEGARDE_MAX_JOURS (8 days).
    // SAME TABLE in the n8n node "Préparer systèmes": change both together. Adapt the names to YOUR tasks.
    const SEUILS_SYNOLOGY = [
        { motif: /music/i,    jours: 35 },  // once a month
        { motif: /software/i, jours: 35 },  // once a month
        { motif: /docker/i,   jours: 3 },   // 4 times a week
        { motif: /ollama/i,   jours: 3 },   // 4 times a week
        { motif: /share/i,    jours: 4 },   // 3 times a week
        { motif: /dashboard|active backup|serveur de fichier/i, jours: 8 },  // Active Backup, once a week
        { motif: /nas/i,      jours: 3 }    // 4 times a week (last: "nas" is a short pattern)
    ];
    const seuilSynology = t => {
        if (typeof t.max_jours === 'number') return t.max_jours;   // if the script ever provides its own threshold
        const s = SEUILS_SYNOLOGY.find(x => x.motif.test(String(t.nom || '')));
        return s ? s.jours : SAUVEGARDE_MAX_JOURS;
    };

    const echec = v => /fail|error|erreur|partial|cancel|abort|suspend|interrupt/i.test(String(v || ''));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // The scripts write local time without a time zone: Date.parse reads it as local time
    const ms = s => { const t = s ? Date.parse(String(s).slice(0, 19)) : NaN; return isNaN(t) ? null : t; };
    const ageJours = s => { const t = ms(s); return t === null ? null : Math.floor((Date.now() - t) / 86400000); };
    const ageHeures = s => { const t = ms(s); return t === null ? null : (Date.now() - t) / 3600000; };
    const quand = s => { const t = ms(s); return t === null ? '?' : new Date(t).toLocaleString('en-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
    const jour = s => { const t = ms(s); return t === null ? '?' : new Date(t).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' }); };
    const pire = (a, b) => ({ ok: 0, na: 0, warn: 1, crit: 2 }[b] > { ok: 0, na: 0, warn: 1, crit: 2 }[a] ? b : a);

    function carte(id, niveau, valeur, lignes) {
        const v = document.getElementById(id + '-val');
        const d = document.getElementById(id + '-detail');
        if (!v || !d) return;
        v.textContent = valeur;
        v.style.color = COULEUR[niveau];
        v.style.textShadow = '0 0 15px ' + COULEUR[niveau];
        d.innerHTML = lignes.slice(0, 3).map(esc).join('<br>');
    }

    function vieilles(j) {
        const h = ageHeures(j.checked);
        return h !== null && h > DONNEES_MAX_HEURES ? 'Data from ' + quand(j.checked) + ' (script stopped?)' : null;
    }

    // ---------- TrueNAS ----------
    function truenas(j) {
        const vieux = vieilles(j);

        // Disks and pools
        let n = 'ok';
        const pb = [];
        const pools = j.pools || [];
        pools.forEach(p => {
            if ((p.etat && p.etat !== 'ONLINE') || p.sain === false) { n = 'crit'; pb.push('Pool ' + p.nom + ': ' + (p.etat || 'unhealthy')); }
            if (p.scrub_erreurs > 0) { n = pire(n, 'warn'); pb.push('Scrub ' + p.nom + ': ' + p.scrub_erreurs + ' error(s)'); }
            const a = ageJours(p.scrub_fin);
            if (p.nom !== 'boot-pool' && a !== null && a > SCRUB_MAX_JOURS) { n = pire(n, 'warn'); pb.push('No scrub of ' + p.nom + ' for ' + a + ' days'); }
        });
        const disques = j.disques || [];
        let sains = 0;
        disques.forEach(d => {
            let ok = true;
            if (d.smart_ok === false) { n = 'crit'; ok = false; pb.push(d.disque + ': SMART failed'); }
            const sect = (d.secteurs_realloues || 0) + (d.secteurs_en_attente || 0) + (d.secteurs_illisibles || 0);
            if (sect > 0) { n = pire(n, 'warn'); ok = false; pb.push(d.disque + ': ' + sect + ' sector(s) to watch'); }
            if (d.erreurs_media > 0) { n = pire(n, 'warn'); ok = false; pb.push(d.disque + ': ' + d.erreurs_media + ' media error(s)'); }
            if (d.usure_pct >= USURE_MAX) { n = pire(n, 'warn'); ok = false; pb.push(d.disque + ': wear ' + d.usure_pct + ' %'); }
            if (d.temperature_c >= TEMP_MAX) { n = pire(n, 'warn'); ok = false; pb.push(d.disque + ': ' + d.temperature_c + ' °C'); }
            if (ok) sains++;
        });
        const principal = pools.find(p => p.nom !== 'boot-pool') || pools[0];
        const temps = disques.map(d => d.temperature_c).filter(t => typeof t === 'number');
        let lignes = pb.length ? pb : [
            principal ? 'Pool ' + principal.nom + ': ' + principal.etat : 'No pool',
            principal && principal.scrub_fin ? 'Last scrub: ' + jour(principal.scrub_fin) : 'Scrub: never',
            temps.length ? 'Max temp: ' + Math.max.apply(null, temps) + ' °C' : ''
        ].filter(Boolean);
        if (vieux) { n = pire(n, 'warn'); lignes = [vieux].concat(lignes); }
        carte('tn-disk', n, disques.length ? sains + '/' + disques.length : '--', lignes);

        // Backups: snapshots, replications, Cloud Sync, Rsync
        let s = 'ok';
        const sp = [];
        const taches = (j.taches || []).filter(t => t.active !== false);
        taches.forEach(t => {
            if (echec(t.etat) || t.erreur) { s = 'crit'; sp.push(t.type + ' ' + t.nom + ': failed'); }
            const a = ageJours(t.derniere_execution);
            if (t.type !== 'Instantané' && a !== null && a > SAUVEGARDE_MAX_JOURS) { s = pire(s, 'warn'); sp.push(t.type + ' ' + t.nom + ': ' + a + ' days without a run'); }
        });
        let valeur = s === 'crit' ? 'FAILED' : s === 'warn' ? 'OLD' : 'OK';
        if (!taches.length) { s = 'warn'; valeur = 'NONE'; sp.push('No active protection task'); }
        const recente = taches.map(t => t.derniere_execution).filter(Boolean).sort().pop();
        let sl = sp.length ? sp : [
            taches.length + ' active task(s)',
            recente ? 'Last: ' + quand(recente) : ''
        ].filter(Boolean);
        if (vieux) { s = pire(s, 'warn'); sl = [vieux].concat(sl); }
        carte('tn-bkp', s, valeur, sl);
    }

    // ---------- Synology ----------
    function synology(j) {
        const vieux = vieilles(j);

        let n = 'ok';
        const pb = [];
        (j.stockage || []).forEach(p => { if (!p.normal) { n = 'crit'; pb.push(p.nom + ': ' + p.etat); } });
        const disques = j.disques || [];
        let sains = 0;
        disques.forEach(d => {
            let ok = true;
            if (!d.normal) { n = pire(n, /fail|crash|critical/i.test(String(d.etat) + String(d.smart)) ? 'crit' : 'warn'); ok = false; pb.push(d.disque + ': ' + d.etat + (d.smart ? ', SMART ' + d.smart : '')); }
            if (d.temperature_c >= TEMP_MAX) { n = pire(n, 'warn'); ok = false; pb.push(d.disque + ': ' + d.temperature_c + ' °C'); }
            if (ok) sains++;
        });
        const vol = (j.stockage || []).find(p => /volume/i.test(String(p.nom))) || (j.stockage || [])[0];
        const temps = disques.map(d => d.temperature_c).filter(t => typeof t === 'number');
        let lignes = pb.length ? pb : [
            vol ? 'Volume: ' + vol.etat : 'No volume',
            temps.length ? 'Max temp: ' + Math.max.apply(null, temps) + ' °C' : ''
        ].filter(Boolean);
        if (vieux) { n = pire(n, 'warn'); lignes = [vieux].concat(lignes); }
        carte('syno-disk', n, disques.length ? sains + '/' + disques.length : '--', lignes);

        // Hyper Backup
        let s = 'ok';
        const sp = [];
        const taches = j.taches || [];
        taches.forEach(t => {
            if (echec(t.resultat) || echec(t.etat)) { s = 'crit'; sp.push(t.nom + ': ' + (t.resultat || t.etat)); }
            const a = ageJours(t.derniere_execution);
            const max = seuilSynology(t);
            if (a !== null && a > max) { s = pire(s, 'warn'); sp.push(t.nom + ': ' + a + ' days without a backup (max ' + max + ' days)'); }
        });
        let valeur = s === 'crit' ? 'FAILED' : s === 'warn' ? 'OLD' : 'OK';
        if (!taches.length) { s = 'warn'; valeur = 'NONE'; sp.push('No Hyper Backup task'); }
        const recente = taches.map(t => t.derniere_execution).filter(Boolean).sort().pop();
        let sl = sp.length ? sp : [
            'Hyper Backup: ' + taches.length + ' task(s)',
            recente ? 'Last: ' + quand(recente) : ''
        ].filter(Boolean);
        if (vieux) { s = pire(s, 'warn'); sl = [vieux].concat(sl); }
        carte('syno-bkp', s, valeur, sl);
    }

    async function charger(cle, fn, ids) {
        try {
            const r = await fetch(SOURCES[cle], { cache: 'no-store' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            fn(await r.json());
        } catch (e) {
            ids.forEach(id => carte(id, 'warn', '--', ['Data unavailable (' + e.message + ')']));
        }
    }

    function tout() {
        charger('tn', truenas, ['tn-disk', 'tn-bkp']);
        charger('syno', synology, ['syno-disk', 'syno-bkp']);
    }
    tout();
    setInterval(tout, 60000);
})();
