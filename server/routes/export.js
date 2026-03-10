const router   = require('express').Router();
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const db             = require('../db');
const { requireAuth } = require('../middleware/auth');

// Export project as FiveM loading screen ZIP
router.post('/:id/export', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.name, pd.components, pd.settings
       FROM projects p LEFT JOIN project_data pd ON pd.project_id = p.id
       WHERE p.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    const { name, components: rawComps, settings: rawSettings } = rows[0];
    let components = [], settings = {};
    try { components = JSON.parse(rawComps || '[]'); } catch {}
    try { settings   = JSON.parse(rawSettings || '{}'); } catch {}

    // Log export
    await db.execute(
      'INSERT INTO exports (id, project_id, user_id) VALUES (?, ?, ?)',
      [uuidv4(), req.params.id, req.user.id]
    );

    const files = buildFiveMFiles(name, components, settings);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitize(name)}-loading-screen.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => console.error('Archive error:', err));
    archive.pipe(res);

    const f = 'loading-screen';
    archive.append(files.html,     { name: `${f}/index.html` });
    archive.append(files.css,      { name: `${f}/style.css` });
    archive.append(files.js,       { name: `${f}/script.js` });
    archive.append(files.manifest, { name: `${f}/fxmanifest.lua` });
    archive.append(files.readme,   { name: `${f}/README.txt` });
    archive.append('',             { name: `${f}/assets/.gitkeep` });
    archive.append('',             { name: `${f}/music/.gitkeep` });

    await archive.finalize();
  } catch (err) {
    console.error('Export error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Export failed' });
  }
});

// Build all FiveM files from project data
function buildFiveMFiles(projectName, components, settings) {
  const name    = esc(projectName || 'FiveM Server');
  const bg      = settings.bg            || 'linear-gradient(135deg,#080810,#0d0d1a)';
  const acc     = settings.acc           || '#6c63ff';
  const bgImage = settings.bgImage       || '';
  const ytId    = settings.youtubeId     || '';
  const music   = settings.music         || '';
  const vol     = settings.musicVolume   !== undefined ? settings.musicVolume : 0.5;
  const showMute= settings.showMuteButton !== false;

  const bgStyle = bgImage
    ? `background:${bg};background-image:url('${bgImage}');background-size:cover;background-position:center`
    : `background:${bg}`;

  const ytEmbed = ytId ? `
  <div id="yt-bg">
    <iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1"
      allow="autoplay;encrypted-media" allowfullscreen></iframe>
    <div class="yt-overlay"></div>
  </div>` : '';

  const musicEl = music ? `  <audio id="bg-music" src="${music}" loop preload="auto"></audio>` : '';
  const muteBtn = (music && showMute) ? `  <button id="mute-btn" onclick="toggleMute()" title="Toggle music">🔊</button>` : '';

  const compsHtml = (components || [])
    .slice().sort((a, b) => (a.z || 1) - (b.z || 1))
    .map(c => {
      const anim = c.anim && c.anim !== 'none'
        ? `animation:sf-${c.anim.replace('-', '_')} 0.6s ease forwards;animation-delay:${c.animDelay || 0}ms;`
        : '';
      return `    <div style="position:absolute;left:${Math.round(c.x)}px;top:${Math.round(c.y)}px;width:${Math.round(c.w)}px;height:${Math.round(c.h)}px;z-index:${c.z || 1};opacity:${c.op || 1};${anim}overflow:hidden;">
      <!-- ${c.type} -->
    </div>`;
    }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Loading</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Syne:wght@700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
</head>
<body>
  <div id="loading-screen">
${ytEmbed}
    <div id="components-layer">
${compsHtml}
    </div>
    <div id="progress-wrap">
      <div id="loading-msg">Connecting to server...</div>
      <div id="progress-row">
        <div id="progress-bar"><div id="progress-fill"></div></div>
        <div id="progress-pct">0%</div>
      </div>
    </div>
  </div>
${musicEl}
${muteBtn}
  <script src="script.js"></script>
</body>
</html>`;

  const css = `/* ${name} — Built with ScreenForge */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; font-family: 'Space Grotesk', sans-serif; ${bgStyle}; color: #fff; -webkit-font-smoothing: antialiased; }

/* Entrance animations */
@keyframes sf-fade_in    { from{opacity:0} to{opacity:1} }
@keyframes sf-slide_up   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
@keyframes sf-slide_down { from{opacity:0;transform:translateY(-32px)} to{opacity:1;transform:translateY(0)} }
@keyframes sf-slide_left { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
@keyframes sf-bounce      { 0%{opacity:0;transform:scale(.7)} 60%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
@keyframes sf-pulse       { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes sf-glow        { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.6)} }
@keyframes sf-float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

#loading-screen    { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
#components-layer  { position: absolute; inset: 0; z-index: 1; }

/* YouTube background */
#yt-bg             { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
#yt-bg iframe      { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 177.78vh; height: 100vh; min-width: 100%; min-height: 56.25vw; border: none; }
.yt-overlay        { position: absolute; inset: 0; background: rgba(0,0,0,0.35); }

/* Progress bar */
#progress-wrap  { position: fixed; bottom: 36px; left: 50%; transform: translateX(-50%); width: 600px; max-width: 90vw; z-index: 1000; }
#loading-msg    { font-size: 13px; color: rgba(255,255,255,.5); margin-bottom: 10px; text-align: center; transition: opacity .3s; }
#progress-row   { display: flex; align-items: center; gap: 10px; }
#progress-bar   { flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,.1); overflow: hidden; }
#progress-fill  { height: 100%; width: 0%; border-radius: 2px; background: linear-gradient(90deg,${acc},${acc}99); transition: width .25s ease; }
#progress-pct   { font-size: 11px; color: rgba(255,255,255,.4); font-family: 'JetBrains Mono', monospace; min-width: 34px; text-align: right; }

/* Mute button */
#mute-btn { position: fixed; top: 16px; right: 16px; z-index: 9999; width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,.5); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.15); color: white; font-size: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s, transform .15s; }
#mute-btn:hover { background: rgba(255,255,255,.15); transform: scale(1.08); }
`;

  const js = `// ${name} — Loading Screen
'use strict';

const MSGS = ['Connecting to server...','Loading resources...','Initializing game mode...','Fetching player data...','Loading world...','Almost ready...'];
let _pct = 0, _msgIdx = 0;
const fillEl = document.getElementById('progress-fill');
const pctEl  = document.getElementById('progress-pct');
const msgEl  = document.getElementById('loading-msg');

function setProgress(p) {
  _pct = Math.min(100, Math.max(0, p));
  if (fillEl) fillEl.style.width = _pct + '%';
  if (pctEl)  pctEl.textContent  = Math.round(_pct) + '%';
  const idx = Math.min(MSGS.length - 1, Math.floor(_pct / (100 / MSGS.length)));
  if (idx !== _msgIdx && msgEl) {
    _msgIdx = idx;
    msgEl.style.opacity = '0';
    setTimeout(() => { msgEl.textContent = MSGS[idx]; msgEl.style.opacity = '1'; }, 220);
  }
}

window.addEventListener('message', e => {
  if (e.data && typeof e.data.loadFraction === 'number') setProgress(e.data.loadFraction * 100);
});

// Music
const musicEl = document.getElementById('bg-music');
if (musicEl) {
  musicEl.volume = ${vol};
  musicEl.play().catch(() => document.addEventListener('click', () => musicEl.play().catch(() => {}), { once: true }));
}

function toggleMute() {
  if (!musicEl) return;
  musicEl.muted = !musicEl.muted;
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = musicEl.muted ? '🔇' : '🔊';
}

// Progress simulation (removes itself in production when FiveM sends real events)
if (typeof window.invokeNative === 'undefined') {
  let sim = 0;
  const si = setInterval(() => {
    sim += Math.random() * 1.5 + 0.3;
    if (sim >= 100) { sim = 100; clearInterval(si); }
    setProgress(sim);
  }, 80);
}`;

  const manifest = `fx_version 'cerulean'
game 'gta5'

name '${projectName} Loading Screen'
description 'Custom FiveM loading screen built with ScreenForge'
version '1.0.0'

loadscreen 'index.html'
${settings.manualShutdown ? "loadscreen_manual_shutdown 'yes'\n" : ''}
files {
  'index.html',
  'style.css',
  'script.js',
  'assets/**/*',
  'music/**/*',
}`;

  const readme = `ScreenForge — ${projectName}
${'='.repeat(50)}

INSTALLATION
  1. Copy the 'loading-screen' folder to your FiveM server's resources/ directory.
  2. Add to server.cfg:  ensure loading-screen
  3. Restart your server. Done!

FEATURES
  ${bgImage ? '✅' : '⬜'} Custom background image
  ${ytId    ? '✅' : '⬜'} YouTube video background (requires internet)
  ${music   ? '✅' : '⬜'} Background music
  ${settings.manualShutdown ? '✅' : '⬜'} Manual shutdown mode

NOTE: YouTube backgrounds require internet access and won't work on LAN servers.
`;

  return { html, css, js, manifest, readme };
}

function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sanitize(name) {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
}

module.exports = router;
