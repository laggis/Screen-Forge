import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Trash2, Copy, Upload, Music, Youtube, Image, X } from 'lucide-react';
import { useEditorStore } from '../../hooks/useEditorStore';
import { uploads as uploadsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ANIMS = ['none','fade-in','slide-up','slide-down','slide-left','bounce','pulse','glow','float'];
const ANIM_LABELS = {
  'none':'None','fade-in':'Fade In','slide-up':'Slide Up','slide-down':'Slide Down',
  'slide-left':'Slide Left','bounce':'Bounce','pulse':'Pulse','glow':'Glow','float':'Float',
};

const BG_PRESETS = [
  {label:'Deep Space',   v:'linear-gradient(135deg,#080810,#0d0d1a)'},
  {label:'Cyberpunk',    v:'linear-gradient(135deg,#0d0d0d,#1a0033)'},
  {label:'Sunset',       v:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460,#e94560)'},
  {label:'Forest Night', v:'linear-gradient(135deg,#0d1b0d,#1a2e1a)'},
  {label:'Ocean Depth',  v:'linear-gradient(135deg,#001429,#002a52)'},
  {label:'Neon City',    v:'linear-gradient(135deg,#050510,#0f0f30)'},
  {label:'Pure Black',   v:'#080808'},
  {label:'Warm Night',   v:'linear-gradient(135deg,#1a0a00,#2e1400)'},
];

function ColorPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const safeVal = value && value.startsWith('#') ? value : '#6c63ff';
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {label && <span className="text-[11px] text-t2 w-16 flex-shrink-0">{label}</span>}
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => setOpen(v=>!v)}
            className="w-7 h-7 rounded-lg border border-white/[0.12] flex-shrink-0 transition-transform hover:scale-105"
            style={{ background: value || '#6c63ff' }}/>
          <input value={value||''} onChange={e=>onChange(e.target.value)}
            placeholder="#ffffff or rgba(...)"
            className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] font-mono text-t1 outline-none focus:border-acc"/>
        </div>
      </div>
      {open && (
        <div className="absolute z-50 top-9 left-0 bg-bg2 border border-white/[0.12] rounded-xl p-3 shadow-2xl">
          <HexColorPicker color={safeVal} onChange={onChange}/>
          <button onClick={() => setOpen(false)} className="mt-2 w-full text-[10px] text-t3 hover:text-t1 transition-colors">Close</button>
        </div>
      )}
    </div>
  );
}

function NumInput({ value, min, max, step, suffix, onChange }) {
  return (
    <div className="flex items-center bg-bg1 border border-white/[0.08] rounded-lg overflow-hidden flex-1">
      <button onClick={() => onChange(Math.max(min, (parseFloat(value)||0) - step))} className="w-6 h-7 text-t3 hover:text-t1 hover:bg-bg3 transition-colors text-sm flex-shrink-0">−</button>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value)||0)}
        className="flex-1 h-7 bg-transparent text-[11px] text-t1 text-center outline-none"/>
      {suffix && <span className="text-[10px] text-t3 pr-1.5 flex-shrink-0">{suffix}</span>}
      <button onClick={() => onChange(Math.min(max, (parseFloat(value)||0) + step))} className="w-6 h-7 text-t3 hover:text-t1 hover:bg-bg3 transition-colors text-sm flex-shrink-0">+</button>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[11px] text-t2 w-16 flex-shrink-0 font-medium">{label}</span>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-t3 uppercase tracking-widest pb-2 border-b border-white/[0.05] mb-3">{title}</div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className={`w-8 h-[18px] rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-acc' : 'bg-bg4'}`}>
      <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${value ? 'left-[17px]' : 'left-0.5'}`}/>
    </button>
  );
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return '';
}

export default function RightSidebar({ projectId }) {
  const [tab, setTab] = useState('props');
  const { components, selectedId, settings, setSettings, updateComponent,
          deleteComponent, duplicateComponent, pushHistory } = useEditorStore();
  const comp = components.find(c => c.id === selectedId);

  const uC = (k, v) => updateComponent(selectedId, { [k]: v });
  const uP = (k, v) => updateComponent(selectedId, { props: { [k]: v } });

  return (
    <div className="w-[272px] flex-shrink-0 bg-bg2 border-l border-white/[0.06] flex flex-col overflow-hidden mt-9">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] flex-shrink-0">
        {[['props','Properties'],['canvas','Canvas']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex-1 h-9 text-[10px] font-bold tracking-wide uppercase transition-all border-b-2 ${tab===id?'text-acc2 border-acc':'text-t3 border-transparent hover:text-t2'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.05] flex-shrink-0">
        <div className="text-[10px] font-bold text-t3 uppercase tracking-wider">
          {tab === 'canvas' ? 'Canvas Settings' : comp ? comp.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Properties'}
        </div>
        {comp && tab === 'props' && (
          <div className="flex gap-1.5 mt-2">
            <button onClick={() => duplicateComponent(selectedId)} className="flex items-center gap-1 h-6 px-2.5 bg-bg3 hover:bg-bg4 text-t2 hover:text-t1 text-[10px] rounded-lg transition-all"><Copy size={10}/> Copy</button>
            <button onClick={() => deleteComponent(selectedId)} className="flex items-center gap-1 h-6 px-2.5 bg-bg3 hover:bg-err/20 text-t2 hover:text-err text-[10px] rounded-lg transition-all"><Trash2 size={10}/> Delete</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3.5">
        {tab === 'canvas' && <CanvasSettings settings={settings} setSettings={setSettings} projectId={projectId}/>}

        {tab === 'props' && !comp && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-t3">
            <span className="text-4xl">🎯</span>
            <span className="text-xs font-semibold text-t2">Nothing selected</span>
            <span className="text-[10px] text-center">Click a component on the canvas to edit its properties</span>
          </div>
        )}

        {tab === 'props' && comp && (
          <div>
            {/* Transform */}
            <Section title="Transform">
              <Row label="X"><NumInput value={Math.round(comp.x)} min={0} max={1920} step={1} suffix="px" onChange={v=>uC('x',v)}/></Row>
              <Row label="Y"><NumInput value={Math.round(comp.y)} min={0} max={1080} step={1} suffix="px" onChange={v=>uC('y',v)}/></Row>
              <Row label="Width"><NumInput value={Math.round(comp.w)} min={20} max={1920} step={1} suffix="px" onChange={v=>uC('w',v)}/></Row>
              <Row label="Height"><NumInput value={Math.round(comp.h)} min={10} max={1080} step={1} suffix="px" onChange={v=>uC('h',v)}/></Row>
              <Row label="Z-Index"><NumInput value={comp.z||1} min={1} max={100} step={1} suffix="" onChange={v=>uC('z',v)}/></Row>
              <Row label="Opacity"><NumInput value={Math.round((comp.op||1)*100)} min={0} max={100} step={5} suffix="%" onChange={v=>uC('op',v/100)}/></Row>
            </Section>

            <CompProps comp={comp} uC={uC} uP={uP} />

            {/* Entrance Animation */}
            <Section title="Entrance Animation">
              <Row label="Effect">
                <select value={comp.anim||'none'} onChange={e=>{uC('anim',e.target.value);pushHistory();}}
                  className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc">
                  {ANIMS.map(a=><option key={a} value={a}>{ANIM_LABELS[a]||a}</option>)}
                </select>
              </Row>
              {comp.anim && comp.anim !== 'none' && (
                <Row label="Delay">
                  <NumInput value={comp.animDelay||0} min={0} max={5000} step={100} suffix="ms" onChange={v=>uC('animDelay',v)}/>
                </Row>
              )}
              {comp.anim && comp.anim !== 'none' && (
                <p className="text-[10px] text-t3 mt-1">Components animate in when the loading screen appears.</p>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPONENT SPECIFIC PROPS ─────────────────────────────────────────────────
function CompProps({ comp, uC, uP }) {
  const p = comp.props;
  return (
    <>
      {comp.type === 'progress_bar' && (
        <Section title="Progress Bar">
          <Row label="Label"><input value={p.label||''} onChange={e=>uP('label',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <div className="mb-2"><ColorPicker value={p.color} onChange={v=>uP('color',v)} label="Color"/></div>
          <div className="mb-2"><ColorPicker value={p.bgColor} onChange={v=>uP('bgColor',v)} label="BG Color"/></div>
          <Row label="Radius"><NumInput value={p.radius||12} min={0} max={50} step={1} suffix="px" onChange={v=>uP('radius',v)}/></Row>
          <Row label="Show %"><Toggle value={p.showPct} onChange={v=>uP('showPct',v)}/></Row>
        </Section>
      )}
      {comp.type === 'spinner' && (
        <Section title="Spinner">
          <div className="mb-2"><ColorPicker value={p.color} onChange={v=>uP('color',v)} label="Color"/></div>
          <Row label="Size"><NumInput value={p.size||48} min={16} max={128} step={4} suffix="px" onChange={v=>uP('size',v)}/></Row>
        </Section>
      )}
      {comp.type === 'loading_text' && (
        <Section title="Loading Text">
          <Row label="Text"><input value={p.text||''} onChange={e=>uP('text',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <div className="mb-2"><ColorPicker value={p.color} onChange={v=>uP('color',v)} label="Color"/></div>
          <Row label="Size"><NumInput value={p.fontSize||15} min={8} max={80} step={1} suffix="px" onChange={v=>uP('fontSize',v)}/></Row>
        </Section>
      )}
      {comp.type === 'server_logo' && (
        <Section title="Server Logo">
          <Row label="Emoji"><input value={p.emoji||''} onChange={e=>uP('emoji',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <Row label="Name"><input value={p.serverName||''} onChange={e=>uP('serverName',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <Row label="Show Name"><Toggle value={p.showName} onChange={v=>uP('showName',v)}/></Row>
        </Section>
      )}
      {(comp.type === 'server_name' || comp.type === 'server_desc' || comp.type === 'text_block') && (
        <Section title="Text">
          <textarea value={p.text||''} onChange={e=>uP('text',e.target.value)} rows={3}
            className="w-full px-2 py-1.5 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc resize-y mb-2"/>
          <Row label="Size"><NumInput value={p.fontSize||14} min={8} max={80} step={1} suffix="px" onChange={v=>uP('fontSize',v)}/></Row>
          <div className="mb-2"><ColorPicker value={p.color} onChange={v=>uP('color',v)} label="Color"/></div>
          <Row label="Align">
            <select value={p.align||'center'} onChange={e=>uP('align',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none">
              {['left','center','right'].map(a=><option key={a}>{a}</option>)}
            </select>
          </Row>
          {comp.type === 'server_name' && <>
            <Row label="Gradient"><Toggle value={p.gradient} onChange={v=>uP('gradient',v)}/></Row>
            <Row label="Glow"><Toggle value={p.glow} onChange={v=>uP('glow',v)}/></Row>
            <Row label="Weight">
              <select value={p.fontWeight||'700'} onChange={e=>uP('fontWeight',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none">
                {['400','600','700','800'].map(w=><option key={w}>{w}</option>)}
              </select>
            </Row>
          </>}
        </Section>
      )}
      {comp.type === 'player_count' && (
        <Section title="Player Count">
          <Row label="Players"><NumInput value={p.players||0} min={0} max={9999} step={1} suffix="" onChange={v=>uP('players',v)}/></Row>
          <Row label="Max"><NumInput value={p.maxPlayers||256} min={1} max={9999} step={1} suffix="" onChange={v=>uP('maxPlayers',v)}/></Row>
          <div className="mb-2"><ColorPicker value={p.bgColor} onChange={v=>uP('bgColor',v)} label="BG Color"/></div>
        </Section>
      )}
      {comp.type === 'server_status' && (
        <Section title="Status">
          <Row label="Status">
            <select value={p.status||'online'} onChange={e=>uP('status',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none">
              {['online','offline','maintenance'].map(s=><option key={s}>{s}</option>)}
            </select>
          </Row>
          <Row label="Show Dot"><Toggle value={p.showDot} onChange={v=>uP('showDot',v)}/></Row>
        </Section>
      )}
      {comp.type === 'discord_widget' && (
        <Section title="Discord">
          <Row label="Members"><input value={p.members||''} onChange={e=>uP('members',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <Row label="Online"><input value={p.online||''} onChange={e=>uP('online',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
        </Section>
      )}
      {comp.type === 'social_buttons' && (
        <Section title="Social Links">
          <p className="text-[10px] text-t3 mb-2">Comma-separated: discord, twitter, youtube, twitch, tiktok</p>
          <input value={p.platforms||''} onChange={e=>uP('platforms',e.target.value)} className="w-full h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/>
        </Section>
      )}
      {comp.type === 'rules_panel' && (
        <Section title="Rules Panel">
          <Row label="Title"><input value={p.title||''} onChange={e=>uP('title',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <p className="text-[10px] text-t3 mb-1.5">Rules (one per line):</p>
          <textarea value={p.rules||''} onChange={e=>uP('rules',e.target.value)} rows={5} className="w-full px-2 py-1.5 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc resize-y"/>
        </Section>
      )}
      {comp.type === 'staff_card' && (
        <Section title="Staff Card">
          <Row label="Emoji"><input value={p.emoji||''} onChange={e=>uP('emoji',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <Row label="Name"><input value={p.name||''} onChange={e=>uP('name',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <Row label="Role"><input value={p.role||''} onChange={e=>uP('role',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
        </Section>
      )}
      {comp.type === 'news_panel' && (
        <Section title="News Panel">
          <Row label="Title"><input value={p.title||''} onChange={e=>uP('title',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <p className="text-[10px] text-t3 mb-1.5">Items (one per line):</p>
          <textarea value={p.items||''} onChange={e=>uP('items',e.target.value)} rows={4} className="w-full px-2 py-1.5 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc resize-y"/>
        </Section>
      )}
      {comp.type === 'tip_system' && (
        <Section title="Tips">
          <p className="text-[10px] text-t3 mb-1.5">Tips (one per line):</p>
          <textarea value={p.tips||''} onChange={e=>uP('tips',e.target.value)} rows={5} className="w-full px-2 py-1.5 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc resize-y"/>
        </Section>
      )}
      {comp.type === 'features_list' && (
        <Section title="Features">
          <Row label="Title"><input value={p.title||''} onChange={e=>uP('title',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <p className="text-[10px] text-t3 mb-1.5">Features (one per line):</p>
          <textarea value={p.items||''} onChange={e=>uP('items',e.target.value)} rows={5} className="w-full px-2 py-1.5 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc resize-y"/>
        </Section>
      )}
      {comp.type === 'countdown' && (
        <Section title="Countdown">
          <Row label="Label"><input value={p.label||''} onChange={e=>uP('label',e.target.value)} className="flex-1 h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/></Row>
          <Row label="Seconds"><NumInput value={p.seconds||3600} min={0} max={86400} step={60} suffix="s" onChange={v=>uP('seconds',v)}/></Row>
        </Section>
      )}
      {comp.type === 'image_gallery' && (
        <Section title="Gallery">
          <p className="text-[10px] text-t3 mb-1.5">Emojis comma-separated (4 max):</p>
          <input value={p.images||''} onChange={e=>uP('images',e.target.value)} className="w-full h-7 px-2 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-acc"/>
        </Section>
      )}
      {comp.type === 'divider' && (
        <Section title="Divider">
          <div className="mb-2"><ColorPicker value={p.color} onChange={v=>uP('color',v)} label="Color"/></div>
        </Section>
      )}
    </>
  );
}

// ── CANVAS SETTINGS ──────────────────────────────────────────────────────────
function CanvasSettings({ settings, setSettings, projectId }) {
  const [uploading, setUploading] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [ytInput, setYtInput] = useState(settings.youtubeUrl || '');

  const handleBgUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadsAPI.upload(projectId, file);
      setSettings({ bg: `url('${data.url}') center/cover no-repeat`, bgImage: data.url });
      toast.success('Background image uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingMusic(true);
    try {
      const { data } = await uploadsAPI.upload(projectId, file);
      setSettings({ music: data.url, musicName: file.name });
      toast.success('Music uploaded! 🎵');
    } catch { toast.error('Music upload failed'); }
    finally { setUploadingMusic(false); }
  };

  const applyYoutube = () => {
    const id = extractYouTubeId(ytInput);
    if (!id) { toast.error('Invalid YouTube URL or ID'); return; }
    setSettings({ youtubeId: id, youtubeUrl: ytInput });
    toast.success('YouTube background set! 🎬');
  };

  const clearYoutube = () => {
    setSettings({ youtubeId: '', youtubeUrl: '' });
    setYtInput('');
    toast('YouTube background removed');
  };

  const clearMusic = () => {
    setSettings({ music: '', musicName: '' });
    toast('Music removed');
  };

  return (
    <div>
      {/* Server Info */}
      <Section title="Server Info">
        <p className="text-[11px] text-t2 mb-1">Server Name</p>
        <input value={settings.serverName||''} onChange={e=>setSettings({serverName:e.target.value})}
          placeholder="My FiveM Server" className="w-full h-8 px-2.5 bg-bg1 border border-white/[0.08] rounded-lg text-[12px] text-t1 outline-none focus:border-acc mb-2"/>
        <p className="text-[11px] text-t2 mb-1">Discord Invite</p>
        <input value={settings.discord||''} onChange={e=>setSettings({discord:e.target.value})}
          placeholder="https://discord.gg/..." className="w-full h-8 px-2.5 bg-bg1 border border-white/[0.08] rounded-lg text-[12px] text-t1 outline-none focus:border-acc"/>
      </Section>

      {/* Accent Color */}
      <Section title="Accent Color">
        <ColorPicker value={settings.acc||'#6c63ff'} onChange={v=>setSettings({acc:v})} label="Accent"/>
      </Section>

      {/* Background */}
      <Section title="Background">
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {BG_PRESETS.map(bp => (
            <button key={bp.label} onClick={() => setSettings({bg:bp.v, bgImage:'', youtubeId:'', youtubeUrl:''})}
              className={`flex items-center gap-2 px-2 h-8 rounded-lg text-[10px] font-medium transition-all border ${settings.bg===bp.v?'border-acc bg-acc/10 text-acc2':'border-white/[0.07] bg-bg3 text-t2 hover:border-acc/40'}`}>
              <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{background:bp.v}}/>
              <span className="truncate">{bp.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-t3 mb-1.5">Custom CSS gradient or color:</p>
        <input value={settings.bg||''} onChange={e=>setSettings({bg:e.target.value})}
          placeholder="linear-gradient(...) or #000" className="w-full h-8 px-2.5 bg-bg1 border border-white/[0.08] rounded-lg text-[11px] font-mono text-t1 outline-none focus:border-acc mb-2"/>

        {/* BG Image Upload */}
        <div className="border border-white/[0.08] rounded-xl p-3 bg-bg1 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Image size={12} className="text-acc2"/>
            <span className="text-[11px] font-semibold text-t1">Background Image</span>
          </div>
          {settings.bgImage ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-8 rounded-md overflow-hidden border border-white/[0.1] flex-shrink-0">
                <img src={settings.bgImage} className="w-full h-full object-cover"/>
              </div>
              <span className="text-[10px] text-t2 flex-1 truncate">Image set</span>
              <button onClick={() => setSettings({bgImage:'', bg:'linear-gradient(135deg,#080810,#0d0d1a)'})}
                className="w-5 h-5 flex items-center justify-center text-t3 hover:text-err transition-colors">
                <X size={11}/>
              </button>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed border-white/[0.15] hover:border-acc/50 text-[11px] text-t2 hover:text-t1 cursor-pointer transition-all ${uploading?'opacity-60':''}`}>
              <Upload size={11}/> {uploading ? 'Uploading...' : 'Upload image (JPG, PNG, WebP)'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleBgUpload} disabled={uploading}/>
            </label>
          )}
        </div>
      </Section>

      {/* Music */}
      <Section title="🎵 Background Music">
        <div className="border border-white/[0.08] rounded-xl p-3 bg-bg1 mb-2">
          {settings.music ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-acc/20 flex items-center justify-center flex-shrink-0">
                  <Music size={11} className="text-acc2"/>
                </div>
                <span className="text-[11px] text-t1 flex-1 truncate">{settings.musicName || 'Music file'}</span>
                <button onClick={clearMusic} className="w-5 h-5 flex items-center justify-center text-t3 hover:text-err transition-colors">
                  <X size={11}/>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-t3 w-12">Volume</span>
                <input type="range" min="0" max="1" step="0.05"
                  value={settings.musicVolume !== undefined ? settings.musicVolume : 0.5}
                  onChange={e => setSettings({ musicVolume: parseFloat(e.target.value) })}
                  className="flex-1 h-1 accent-acc"/>
                <span className="text-[10px] font-mono text-t2 w-6">{Math.round((settings.musicVolume||0.5)*100)}%</span>
              </div>
              <Row label="Mute btn">
                <Toggle value={settings.showMuteButton !== false} onChange={v=>setSettings({showMuteButton:v})}/>
              </Row>
            </div>
          ) : (
            <label className={`flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed border-white/[0.15] hover:border-acc/50 text-[11px] text-t2 hover:text-t1 cursor-pointer transition-all ${uploadingMusic?'opacity-60':''}`}>
              <Music size={11}/> {uploadingMusic ? 'Uploading...' : 'Upload MP3 / OGG'}
              <input type="file" accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4" className="hidden" onChange={handleMusicUpload} disabled={uploadingMusic}/>
            </label>
          )}
        </div>
        <p className="text-[10px] text-t3 leading-relaxed">Music plays automatically when players connect. A mute button appears in the corner.</p>
      </Section>

      {/* YouTube Video Background */}
      <Section title="🎬 YouTube Background">
        <div className="border border-white/[0.08] rounded-xl p-3 bg-bg1 mb-2">
          {settings.youtubeId ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Youtube size={11} className="text-red-400"/>
                </div>
                <span className="text-[11px] text-t1 flex-1">Video set</span>
                <a href={`https://youtube.com/watch?v=${settings.youtubeId}`} target="_blank" rel="noreferrer"
                  className="text-[10px] text-acc2 hover:underline">Preview ↗</a>
                <button onClick={clearYoutube} className="w-5 h-5 flex items-center justify-center text-t3 hover:text-err transition-colors ml-1">
                  <X size={11}/>
                </button>
              </div>
              <div className="w-full h-16 bg-black rounded-lg overflow-hidden border border-white/[0.08]">
                <img src={`https://img.youtube.com/vi/${settings.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-70"/>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input value={ytInput} onChange={e=>setYtInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&applyYoutube()}
                  placeholder="YouTube URL or video ID"
                  className="flex-1 h-8 px-2.5 bg-bg0 border border-white/[0.08] rounded-lg text-[11px] text-t1 outline-none focus:border-red-400"/>
                <button onClick={applyYoutube}
                  className="h-8 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-semibold rounded-lg transition-all border border-red-500/20">
                  Set
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-[10px] text-t3 leading-relaxed">Video plays muted and looping as a full-screen background. Paste any YouTube URL.</p>
        {settings.youtubeId && (
          <p className="text-[10px] text-warn mt-1">⚠️ YouTube backgrounds require internet. Works best for public servers.</p>
        )}
      </Section>

      {/* FiveM Options */}
      <Section title="FiveM Options">
        <Row label="Manual Shutdown">
          <Toggle value={!!settings.manualShutdown} onChange={v=>setSettings({manualShutdown:v})}/>
        </Row>
        <p className="text-[10px] text-t3 mt-1 leading-relaxed">Enable to use <code className="text-acc4 bg-bg0 px-1 rounded">ShutdownLoadingScreen()</code> in Lua.</p>
      </Section>
    </div>
  );
}

