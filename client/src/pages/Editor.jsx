import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Download, Undo, Redo, ZoomIn, ZoomOut, Loader2, Globe, Lock, Eye, X } from 'lucide-react';
import { useEditorStore } from '../hooks/useEditorStore';
import { projects as projectsAPI, exportProject } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CanvasArea from '../components/editor/CanvasArea';
import LeftSidebar from '../components/editor/LeftSidebar';
import RightSidebar from '../components/editor/RightSidebar';
import { compHTML } from '../components/editor/compRenderer';

// ── LIVE PREVIEW GENERATOR ────────────────────────────────────────────────────
function buildPreviewHTML(components, settings, projectName) {
  const bg      = settings.bg      || '#080810';
  const acc     = settings.acc     || '#6c63ff';
  const bgImage = settings.bgImage || '';
  const ytId    = settings.youtubeId || '';
  const music   = settings.music   || '';
  const musicVol= settings.musicVolume !== undefined ? settings.musicVolume : 0.5;
  const showMute= settings.showMuteButton !== false;
  const manualSD= settings.manualShutdown || false;

  const ANIM_CSS = `
@keyframes sf-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes sf-slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes sf-slideDown{from{opacity:0;transform:translateY(-32px)}to{opacity:1;transform:translateY(0)}}
@keyframes sf-slideLeft{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
@keyframes sf-bounce{0%{opacity:0;transform:scale(.7)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
@keyframes sf-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes sf-glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.6)}}
@keyframes sf-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
`;
  const ANIM_MAP = {
    'fade-in':   'sf-fadeIn 0.6s ease forwards',
    'slide-up':  'sf-slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
    'slide-down':'sf-slideDown 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
    'slide-left':'sf-slideLeft 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
    'bounce':    'sf-bounce 0.7s cubic-bezier(0.36,0.07,0.19,0.97) forwards',
    'pulse':     'sf-pulse 2s ease infinite',
    'glow':      'sf-glow 2s ease infinite',
    'float':     'sf-float 3s ease-in-out infinite',
  };

  const bgStyle = bgImage
    ? `background:${bg};background-image:url('${bgImage}');background-size:cover;background-position:center`
    : `background:${bg}`;

  const compsHTML = components
    .slice().sort((a,b)=>(a.z||1)-(b.z||1))
    .map(c => {
      const animStr = c.anim && c.anim !== 'none' && ANIM_MAP[c.anim]
        ? `animation:${ANIM_MAP[c.anim]};animation-delay:${c.animDelay||0}ms;`
        : '';
      return `<div style="position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;z-index:${c.z||1};opacity:${c.op||1};${animStr}overflow:hidden;">${compHTML(c.type, c.props, c.w, c.h)}</div>`;
    }).join('\n');

  const ytHTML = ytId ? `
  <div style="position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;">
    <iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3"
      style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:177.78vh;height:100vh;min-width:100%;min-height:56.25vw;border:none;pointer-events:none;"
      allow="autoplay;encrypted-media" allowfullscreen></iframe>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);"></div>
  </div>` : '';

  const musicJS = music ? `
// ── MUSIC
const _aud = new Audio('${music}');
_aud.loop = true; _aud.volume = ${musicVol};
_aud.play().catch(()=>{});
` : '';

  const muteBtn = (music && showMute) ? `
  <button id="sf-mute" onclick="(function(){var a=document.querySelector('audio')||window._sfAud;if(!a)return;a.muted=!a.muted;document.getElementById('sf-mute').textContent=a.muted?'🔇':'🔊';})()"
    style="position:fixed;top:16px;right:16px;z-index:9999;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.15);color:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">🔊</button>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${projectName || 'Loading Screen'} — Preview</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;${bgStyle}}
#sf-screen{position:relative;width:100vw;height:100vh;overflow:hidden;}
${ANIM_CSS}
/* Progress bar */
#sf-pb-track{position:fixed;bottom:36px;left:50%;transform:translateX(-50%);width:600px;max-width:90vw;z-index:1000;}
#sf-pb-label{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:8px;text-align:center;font-family:sans-serif;transition:opacity .3s;}
#sf-pb-row{display:flex;align-items:center;gap:10px;}
#sf-pb-bar{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;}
#sf-pb-fill{height:100%;width:0%;border-radius:2px;background:linear-gradient(90deg,${acc},${acc}99);transition:width .25s ease;}
#sf-pb-pct{font-size:11px;color:rgba(255,255,255,.45);font-family:monospace;min-width:34px;text-align:right;}
</style>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Syne:wght@700;800&family=JetBrains+Mono&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
<div id="sf-screen">
  ${ytHTML}
  <div style="position:absolute;inset:0;z-index:1;">${compsHTML}</div>
</div>
${muteBtn}
<div id="sf-pb-track">
  <div id="sf-pb-label">Connecting to server...</div>
  <div id="sf-pb-row">
    <div id="sf-pb-bar"><div id="sf-pb-fill"></div></div>
    <div id="sf-pb-pct">0%</div>
  </div>
</div>
<script>
${musicJS}
var _sfMsgs=['Connecting to server...','Loading resources...','Initializing world...','Fetching player data...','Almost ready...'];
var _sfPct=0,_sfMsgIdx=0;
var _sfFill=document.getElementById('sf-pb-fill');
var _sfPctEl=document.getElementById('sf-pb-pct');
var _sfLbl=document.getElementById('sf-pb-label');
function _sfSetProg(p){
  _sfPct=Math.min(100,Math.max(0,p));
  if(_sfFill)_sfFill.style.width=_sfPct+'%';
  if(_sfPctEl)_sfPctEl.textContent=Math.round(_sfPct)+'%';
  var idx=Math.min(_sfMsgs.length-1,Math.floor(_sfPct/25));
  if(idx!==_sfMsgIdx&&_sfLbl){_sfMsgIdx=idx;_sfLbl.style.opacity='0';setTimeout(function(){_sfLbl.textContent=_sfMsgs[idx];_sfLbl.style.opacity='1';},220);}
}
window.addEventListener('message',function(e){if(e.data&&typeof e.data.loadFraction==='number')_sfSetProg(e.data.loadFraction*100);});
// Simulate progress for preview
var _sfSim=0;
var _sfSi=setInterval(function(){_sfSim+=Math.random()*1.5+0.3;if(_sfSim>=100){_sfSim=100;clearInterval(_sfSi);}  _sfSetProg(_sfSim);},80);
</script>
</body>
</html>`;
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { projectId, projectName, isDirty, scale, setProject, setProjectName,
          loadData, setScale, undo, redo, history, histIdx,
          components, settings, selectedId } = useEditorStore();

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [isPublic,   setIsPublic]   = useState(false);
  const [saveTime,   setSaveTime]   = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const previewRef  = useRef(null);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await projectsAPI.get(id);
        setProject(data.id, data.name);
        setIsPublic(data.is_public);
        loadData({ components: data.components || [], settings: data.settings || {}, name: data.name });
      } catch (err) {
        toast.error('Failed to load project');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    if (isDirty && !loading) {
      autoSaveRef.current = setTimeout(() => handleSave(true), 30000);
    }
    return () => clearTimeout(autoSaveRef.current);
  }, [isDirty, components, settings]);

  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey||e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape' && previewing) setPreviewing(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [components, settings, projectName, previewing]);

  const handleSave = useCallback(async (auto = false) => {
    if (saving) return;
    setSaving(true);
    try {
      await projectsAPI.save(id, { components, settings, name: projectName });
      setSaveTime(new Date());
      if (!auto) toast.success('Project saved!');
    } catch (err) {
      if (!auto) toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [id, components, settings, projectName, saving]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await projectsAPI.save(id, { components, settings, name: projectName });
      await exportProject(id, projectName);
      toast.success('Download started! 📦');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await projectsAPI.patch(id, { is_public: !isPublic });
      setIsPublic(v => !v);
      toast.success(isPublic ? 'Project set to private' : 'Published to gallery!');
    } catch { toast.error('Failed'); }
  };

  const handlePreview = () => {
    const html = buildPreviewHTML(components, settings, projectName);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    previewRef.current = url;
    setPreviewing(true);
  };

  const closePreview = () => {
    setPreviewing(false);
    if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-acc mx-auto mb-3"/>
        <p className="text-t2 text-sm">Loading project...</p>
      </div>
    </div>
  );

  const canUndo = histIdx > 0;
  const canRedo = histIdx < history.length - 1;

  return (
    <div className="flex flex-col h-screen bg-bg0 overflow-hidden">
      {/* Topbar */}
      <div className="h-[52px] flex-shrink-0 bg-bg2 border-b border-white/[0.06] flex items-center px-3.5 gap-2.5 z-50">
        <button onClick={() => { if (isDirty && !confirm('You have unsaved changes. Leave anyway?')) return; navigate('/dashboard'); }}
          className="flex items-center gap-2 text-t2 hover:text-t1 transition-colors mr-1">
          <ArrowLeft size={14}/>
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-acc to-acc3 flex items-center justify-center text-xs">🎬</div>
        </button>
        <div className="w-px h-5 bg-white/[0.06]"/>

        <input value={projectName} onChange={e => setProjectName(e.target.value)}
          className="bg-transparent border border-transparent hover:border-white/[0.08] focus:border-acc focus:bg-bg1 text-sm font-semibold text-t1 px-2 py-1 rounded-lg outline-none min-w-[140px] transition-all"/>

        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isDirty ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-warn' : 'bg-ok'} ${isDirty ? 'animate-pulse' : ''}`}/>
          {saving ? 'Saving…' : isDirty ? 'Unsaved' : `Saved ${saveTime ? saveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}
        </div>

        <div className="w-px h-5 bg-white/[0.06]"/>

        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="topbar-btn disabled:opacity-30">↩</button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="topbar-btn disabled:opacity-30">↪</button>

        <div className="w-px h-5 bg-white/[0.06]"/>

        <button onClick={() => setScale(Math.max(0.2, +(scale-0.1).toFixed(2)))} className="topbar-btn"><ZoomOut size={13}/></button>
        <span className="text-[11px] text-t2 w-9 text-center font-mono">{Math.round(scale*100)}%</span>
        <button onClick={() => setScale(Math.min(1.5, +(scale+0.1).toFixed(2)))} className="topbar-btn"><ZoomIn size={13}/></button>
        <button onClick={() => setScale(0.65)} className="topbar-btn text-[11px]">Fit</button>

        <div className="ml-auto flex items-center gap-2">
          {/* Live Preview */}
          <button onClick={handlePreview} title="Live Preview — see exactly what players will see"
            className="flex items-center gap-1.5 h-8 px-3 bg-acc3/20 hover:bg-acc3/30 text-acc3 border border-acc3/20 text-xs font-semibold rounded-lg transition-all">
            <Eye size={12}/> Preview
          </button>

          <button onClick={handleTogglePublic} title={isPublic ? 'Make Private' : 'Publish to Gallery'}
            className={`topbar-btn ${isPublic ? 'text-ok border-ok/30 bg-ok/10' : ''}`}>
            {isPublic ? <><Globe size={13}/> Public</> : <><Lock size={13}/> Private</>}
          </button>
          <button onClick={() => handleSave()} disabled={saving}
            className="topbar-btn flex items-center gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Save
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 h-8 px-4 bg-ok hover:opacity-90 disabled:opacity-60 text-black text-xs font-bold rounded-lg transition-all">
            {exporting ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
            Export ZIP
          </button>
        </div>
      </div>

      {/* Main editor layout */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <CanvasArea />
        <RightSidebar projectId={id} />
      </div>

      {/* Live Preview Modal */}
      <AnimatePresence>
        {previewing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col">
            {/* Preview topbar */}
            <div className="h-10 flex-shrink-0 bg-black/80 backdrop-blur border-b border-white/10 flex items-center px-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-ok animate-pulse"/>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Live Preview</span>
              </div>
              <span className="text-[11px] text-white/40 ml-2">This is exactly what players will see · Press Esc to close</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-white/30">1920×1080</span>
                <button onClick={closePreview}
                  className="flex items-center gap-1.5 h-7 px-3 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-lg transition-all">
                  <X size={11}/> Close
                </button>
              </div>
            </div>
            {/* Iframe fills screen */}
            <iframe
              src={previewRef.current}
              className="flex-1 w-full border-0"
              title="Loading Screen Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
