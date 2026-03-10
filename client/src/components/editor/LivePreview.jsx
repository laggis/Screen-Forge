import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, RefreshCw } from 'lucide-react';
import { useEditorStore } from '../../hooks/useEditorStore';
import { compHTML } from './compRenderer';

// Generates a full standalone HTML string from current canvas state
function buildPreviewHTML(components, settings) {
  const bg      = settings.bg  || '#080810';
  const acc     = settings.acc || '#6c63ff';
  const music   = settings.music || '';
  const ytId    = settings.youtubeId || '';
  const vol     = settings.musicVolume !== undefined ? settings.musicVolume : 0.5;
  const muteBtn = settings.showMuteButton !== false;

  // Sort by z
  const sorted = [...components].sort((a, b) => (a.z||1) - (b.z||1));

  const compStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Syne:wght@700;800&family=JetBrains+Mono&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Space Grotesk',sans-serif;overflow:hidden;width:100vw;height:100vh;background:${bg};color:#fff;-webkit-font-smoothing:antialiased}
    #sf-screen{position:relative;width:100vw;height:100vh;overflow:hidden}
    #sf-bg{position:absolute;inset:0;z-index:0;background:${bg}}
    #sf-yt{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
    #sf-yt iframe{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(1.15);width:100vw;height:100vh;min-width:177.78vh;min-height:56.25vw}
    #sf-comps{position:absolute;inset:0;z-index:2}
    .sf-comp{position:absolute}
    #sf-mute{position:fixed;bottom:16px;right:16px;z-index:999;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background 0.2s}
    #sf-mute:hover{background:rgba(0,0,0,0.8)}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes bounceIn{0%{opacity:0;transform:scale(0.8)}60%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
    @keyframes fcp{0%{width:18%}50%{width:72%}100%{width:18%}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes glow{0%,100%{text-shadow:0 0 8px currentColor}50%{text-shadow:0 0 22px currentColor,0 0 40px currentColor}}
    .anim-pulse{animation:pulse 2s infinite}
    .anim-float{animation:float 3s ease infinite}
    .anim-glow{animation:glow 2s ease infinite}
    .anim-spin{animation:spin .8s linear infinite}
  `;

  const animCSS = (comp) => {
    if (!comp.animType || comp.animType === 'none') return '';
    const delay = (comp.animDelay || 0) + 'ms';
    const map = {
      'fade-in':  `animation:fadeIn 0.6s ease ${delay} both`,
      'slide-up': `animation:slideUp 0.6s ease ${delay} both`,
      'slide-down':`animation:slideDown 0.6s ease ${delay} both`,
      'slide-left':`animation:slideLeft 0.6s ease ${delay} both`,
      'bounce':   `animation:bounceIn 0.7s ease ${delay} both`,
      'pulse':    `animation:pulse 2s infinite`,
      'glow':     `animation:glow 2s ease infinite`,
      'float':    `animation:float 3s ease infinite`,
    };
    return map[comp.animType] || '';
  };

  const compsHTML = sorted.map(c => `
    <div class="sf-comp" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;z-index:${c.z||1};opacity:${c.op||1};${animCSS(c)}">
      ${compHTML(c.type, c.props, c.w, c.h)}
    </div>
  `).join('');

  const ytHTML = ytId ? `
    <div id="sf-yt">
      <iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1"
        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen id="sf-yt-iframe"></iframe>
    </div>` : '';

  const musicHTML = music ? `<audio id="sf-audio" src="${music}" loop autoplay style="display:none"></audio>` : '';

  const muteHTML = (music || ytId) && muteBtn ? `
    <button id="sf-mute" title="Toggle mute" onclick="toggleMute()">🔊</button>` : '';

  const script = `
    var vol = ${vol};
    var muted = false;
    var audio = document.getElementById('sf-audio');
    if (audio) { audio.volume = vol; audio.play().catch(()=>{}); }

    function toggleMute() {
      muted = !muted;
      var btn = document.getElementById('sf-mute');
      if (audio) audio.muted = muted;
      var yt = document.getElementById('sf-yt-iframe');
      if (yt) {
        try { yt.contentWindow.postMessage(JSON.stringify({event:'command',func:muted?'mute':'unMute',args:[]}), '*'); } catch(e){}
      }
      if (btn) btn.textContent = muted ? '🔇' : '🔊';
    }

    // Simulate loading progress
    var pct = 0;
    var fills = document.querySelectorAll('[id*="prog-fill"], [id*="progress-fill"]');
    var sim = setInterval(function() {
      pct += Math.random() * 1.5 + 0.3;
      if (pct >= 100) { pct = 100; clearInterval(sim); }
      fills.forEach(function(el) { el.style.width = pct + '%'; });
    }, 80);
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview</title>
<style>${compStyles}</style>
</head>
<body>
<div id="sf-screen">
  <div id="sf-bg"></div>
  ${ytHTML}
  ${musicHTML}
  <div id="sf-comps">${compsHTML}</div>
  ${muteHTML}
</div>
<script>${script}<\/script>
</body>
</html>`;
}

export default function LivePreview({ onClose }) {
  const { components, settings, projectName } = useEditorStore();
  const iframeRef = useRef();
  const [simPct, setSimPct] = useState(0);
  const [running, setRunning] = useState(true);
  const simRef = useRef(null);

  const html = buildPreviewHTML(components, settings);

  // Simulate loading progress messages into iframe
  useEffect(() => {
    if (running) {
      simRef.current = setInterval(() => {
        setSimPct(p => {
          const next = Math.min(100, p + Math.random() * 1.5 + 0.3);
          return next;
        });
      }, 80);
    }
    return () => clearInterval(simRef.current);
  }, [running]);

  // Send progress to iframe
  useEffect(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ loadFraction: simPct / 100 }, '*');
    } catch {}
  }, [simPct]);

  const reset = () => {
    setSimPct(0);
    setRunning(true);
    // Reload iframe
    if (iframeRef.current) {
      const blob = new Blob([html], { type: 'text/html' });
      iframeRef.current.src = URL.createObjectURL(blob);
    }
  };

  // Build blob URL for iframe
  const [blobUrl, setBlobUrl] = useState('');
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      {/* Preview topbar */}
      <div className="flex items-center gap-3 px-4 h-11 bg-bg2 border-b border-white/[0.08] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ok animate-pulse"/>
          <span className="text-xs font-semibold text-t1">Live Preview</span>
          <span className="text-xs text-t3">— {projectName}</span>
        </div>

        {/* Simulated progress bar */}
        <div className="flex-1 flex items-center gap-2 max-w-xs">
          <div className="flex-1 h-1.5 bg-bg4 rounded-full overflow-hidden">
            <div className="h-full bg-ok rounded-full transition-all duration-75" style={{ width: simPct + '%' }}/>
          </div>
          <span className="text-[10px] font-mono text-t3 w-7">{Math.round(simPct)}%</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setRunning(v => !v)}
            className="flex items-center gap-1.5 h-7 px-3 bg-bg3 hover:bg-bg4 text-t2 hover:text-t1 text-xs rounded-lg transition-all">
            {running ? <Pause size={11}/> : <Play size={11}/>}
            {running ? 'Pause' : 'Play'}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1.5 h-7 px-3 bg-bg3 hover:bg-bg4 text-t2 hover:text-t1 text-xs rounded-lg transition-all">
            <RefreshCw size={11}/> Restart
          </button>
          <div className="w-px h-4 bg-white/[0.08]"/>
          <button onClick={onClose}
            className="flex items-center gap-1.5 h-7 px-3 bg-bg3 hover:bg-err/20 text-t2 hover:text-err text-xs rounded-lg transition-all">
            <X size={11}/> Close
          </button>
        </div>
      </div>

      {/* The actual preview — 16:9 iframe centered */}
      <div className="flex-1 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          {blobUrl && (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              title="Loading Screen Preview"
              className="rounded-lg shadow-2xl"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: 'calc(100vh * 1.777)',
                maxHeight: 'calc(100vw * 0.5625)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>

      <div className="text-center text-[10px] text-t3 py-2">
        1920×1080 — exactly as players will see it
      </div>
    </div>
  );
}
