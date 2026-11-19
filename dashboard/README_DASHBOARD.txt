MY HOMELAB - DASHBOARD EXAMPLE (web pages)
==========================================
Version: v2026.11.17-10

These are the real dashboard pages of the MY HOMELAB project, translated to English.
Use them as a BASE or as an EXAMPLE of the look (dark theme, neon cyan, cards).
They were written for one specific homelab: some cards will show "unavailable" until you
point them to your own devices, and some cards you will simply delete.
The easiest way to adapt them: give the files to Claude, one page at a time, with your device list.


WHAT IS IN THIS FOLDER
----------------------
  index.html           Home: TrueNAS and Synology (CPU, RAM, temperature, network, storage,
                       disks, backups), NOC summary, deadlines, restore tests, external access
  supervision.html     NOC: UniFi CloudKey and UNVR, Home Assistant, Nextcloud, rack temperature
                       (tap the card for a 1, 3 or 7 day history in bars), ping Google and LAN,
                       Ollama PC (GPU, loaded and installed models)
  reseau.html          Network: Internet diagnosis chain (switches, firewall, modem, ISP, VPN),
                       30-day outage log, network map with the Uptime Kuma history of each device;
                       tap a device card to see its history over 1, 3, 7 or 30 days (one bar per hour,
                       read from the outage log)
  journal.html         Morning report written by the local AI (n8n), "Run the Workflow" button,
                       recent activity (Kuma + Proxmox), Synology containers
  pfsense.html         pfSense: system, NVMe disk, gateways, interfaces, services,
                       firewall and Snort statistics read from Loki, attacks to watch
  proxmox.html         Proxmox: nodes, disks health, backups, VMs and containers, latest operations
  documentation.html   Documents list (/documents/ folder) and the version log (VERSIONS.txt)

  css/style.css, css/monitoring.css     the theme
  js/                                   shared scripts (clock, auto zoom, cards of the home page)
  images/background.jpg                 background image (replace it with yours if you like)
  echeances.json                        deadlines and restore tests, EDITED BY HAND (example)
  sante-truenas.json, apps-updates.json example data files (normally written by scripts)
  nginx-example/default.conf            example Nginx config with all the relays


HOW IT WORKS
------------
The pages are plain HTML + JavaScript: no framework, no build step, no database.
Every few seconds, each page asks NGINX for data, on paths like /kuma-api/ or /pfs-api/.
Nginx RELAYS each path to the right device and adds the API key itself.
So the browser never sees a key, and the pages work the same on the local network
and through WireGuard from a phone.

  Browser  --->  Nginx (dashboard web server)  --->  Kuma, pfSense, Proxmox, Glances, n8n, Ollama...
                 keys live HERE, in default.conf

The relays used by the pages (see nginx-example/default.conf):
  /kuma-api/          Uptime Kuma public status page "homelab"   (every page)
  /glances-truenas/   Glances on the TrueNAS                      (index)
  /glances-syno/      Glances on the Synology                     (index, journal)
  /syno-status/       Synology health JSON file                   (index)
  /pfs-api/           pfSense REST API, status only               (pfsense, NOC cards)
  /pve/<node>/        Proxmox API, one per node                   (proxmox, journal)
  /unvr-api/          UniFi Protect cameras and alarm             (supervision)
  /gpu-api/           nvidia-smi as JSON on the Ollama PC         (supervision)
  /ollama-api/        Ollama, 3 read-only routes                  (supervision)
  /loki-api/          Loki, 2 read-only routes                    (pfsense)
  /rapport-matin/     n8n: latest morning report                  (journal)
  /lancer-scan        n8n: run the report now                     (journal)
  /n8n-tunnels/       n8n: tunnels and VPN status                 (index)
  /journal-pannes/    n8n: 30-day outage log                      (reseau)
Home Assistant and Nextcloud are set on the Supervision page itself (Configuration box at the
bottom): URL and token stay in YOUR browser only (localStorage).


INSTALL
-------
1. Copy this folder to the web server folder, for example ~/dashboard/site
   (see INSTALL_EN.txt, step 5).
2. Copy nginx-example/default.conf to ~/dashboard/nginx/default.conf, change the addresses,
   put your keys where you see A_REMPLIR ("to fill in"), delete the blocks you do not need.
   Do not leave the nginx-example folder inside the site folder (the site is public on your network).
3. Restart:  docker restart dashboard-web
4. Open http://IP-OF-THE-MACHINE:8085 and look at each page. A card that says "unavailable"
   tells you which relay to check.
5. Create a folder "documents" in the site folder and put VERSIONS.txt in it
   (the Documentation page reads it).

After each change on a phone app (WebView), clear the app cache, or you will see the old page.


WHAT TO CHANGE FIRST
--------------------
- Uptime Kuma monitor IDs: in journal.html, reseau.html and supervision.html the cards use the
  monitor numbers of the original homelab (look for "ID" in the comments). Some monitors are
  found by NAME (pfSense, "Server VPN", "ISP Provider"...). Rename them, or change the names in the code.
- The Internet diagnosis chain (reseau.html, const CHAINE): one entry per link, from the bottom
  (your switch) to the top (the Internet or your VPN). Keep only the links you have.
- The network map (reseau.html, rows 1 to 5): your own devices.
- Thresholds: rack temperature 30 / 35 °C (supervision.html), disks and backups (js/sante.js),
  attacks to watch (pfsense.html, SURV). They must match the fixed rules of your n8n report.
- echeances.json: your own deadlines (domain, certificates) and restore tests.
- The navigation menu is the same block at the top of every page: change it once, copy it everywhere.

Good to know:
- The JSON field names stay in French (etat = state, nom = name, disques = disks, taches = tasks,
  echeances = deadlines, restaurations = restore tests...), because the scripts and n8n
  workflows of the original homelab write them that way. The visible texts are in English.
- The morning report and the cause text of the outage log come from the n8n workflows, in the
  language of those workflows (French in the original). Change the texts in n8n if you want them in English.
- fit-page.js zooms the page out a little on a computer so it fits the screen without scrolling.
  Add ?fit=0 to the address to turn it off.


SECURITY
--------
- Never put a key or a password in the HTML or JS files. Keys go in the Nginx config only.
- Do not expose the dashboard to the internet. Use WireGuard (VPN) for phone access.
- Relays to device APIs: GET only (limit_except GET) unless a button really needs POST.
- Never relay the whole Ollama API: it has no password. Only tags, ps and version.

----------------------------------------------------------------------
Built by Playback71 (MY HOMELAB project), with the help of Claude (Anthropic) - November 2026
