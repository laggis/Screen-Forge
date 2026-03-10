import { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../../hooks/useEditorStore';
import { compHTML } from './compRenderer';

const CW = 1920, CH = 1080;

// Entrance animation CSS injected into canvas preview
const ANIM_CSS = `
@keyframes sf-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes sf-slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes sf-slideDown{from{opacity:0;transform:translateY(-32px)}to{opacity:1;transform:translateY(0)}}
@keyframes sf-slideLeft{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
@keyframes sf-bounce{0%{opacity:0;transform:scale(.7)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
@keyframes sf-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes sf-glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.5)}}
@keyframes sf-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
`;
const ANIM_MAP = {
  'fade-in':   'sf-fadeIn   0.6s ease forwards',
  'slide-up':  'sf-slideUp  0.6s cubic-bezier(0.16,1,0.3,1) forwards',
  'slide-down':'sf-slideDown 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
  'slide-left':'sf-slideLeft 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
  'bounce':    'sf-bounce   0.7s cubic-bezier(0.36,0.07,0.19,0.97) forwards',
  'pulse':     'sf-pulse    2s ease infinite',
  'glow':      'sf-glow     2s ease infinite',
  'float':     'sf-float    3s ease-in-out infinite',
};

export default function CanvasArea() {
  const { components, settings, selectedId, scale, setSelectedId, updateComponent,
          addComponent, pushHistory } = useEditorStore();
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef();

  const DEFS = getCompDefs();

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const type = e.dataTransfer.getData('comp-type');
    if (!type || !DEFS[type]) return;
    const d = DEFS[type];
    const comp = {
      id: `c${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      type,
      x: Math.round(CW/2 - (d.defs.width||200)/2),
      y: Math.round(CH/2 - (d.defs.height||80)/2),
      w: d.defs.width || 200, h: d.defs.height || 80,
      z: components.length + 1, op: 1, anim: 'none', animDelay: 0,
      props: { ...d.defs },
    };
    addComponent(comp);
  };

  const startDrag = useCallback((e, comp) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    setSelectedId(comp.id);
    const startX = e.clientX - comp.x * scale;
    const startY = e.clientY - comp.y * scale;
    const onMove = mv => {
      updateComponent(comp.id, { x: Math.max(0,(mv.clientX-startX)/scale), y: Math.max(0,(mv.clientY-startY)/scale) });
    };
    const onUp = () => { pushHistory(); window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [scale, components]);

  const startResize = useCallback((e, comp, pos) => {
    e.stopPropagation(); e.preventDefault();
    const sx=e.clientX, sy=e.clientY, sw=comp.w, sh=comp.h, cx=comp.x, cy=comp.y;
    const onMove = mv => {
      const dx=(mv.clientX-sx)/scale, dy=(mv.clientY-sy)/scale;
      if(pos==='br') updateComponent(comp.id,{w:Math.max(40,sw+dx),h:Math.max(20,sh+dy)});
      else if(pos==='bl') updateComponent(comp.id,{w:Math.max(40,sw-dx),x:cx+dx,h:Math.max(20,sh+dy)});
      else if(pos==='tr') updateComponent(comp.id,{w:Math.max(40,sw+dx),h:Math.max(20,sh-dy),y:cy+dy});
      else updateComponent(comp.id,{w:Math.max(40,sw-dx),h:Math.max(20,sh-dy),x:cx+dx,y:cy+dy});
    };
    const onUp = () => { pushHistory(); window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [scale]);

  const sw = Math.round(CW * scale), sh = Math.round(CH * scale);

  // Background style — image overrides gradient, YouTube shown as thumbnail tint
  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: settings.bg || '#080810' };

  return (
    <div className="flex-1 overflow-auto flex items-start justify-center p-7 bg-bg0">
      {/* Canvas toolbar */}
      <div className="fixed top-[52px] left-[256px] right-[276px] h-9 bg-bg2 border-b border-white/[0.05] flex items-center px-4 z-40">
        <span className="text-[11px] text-t3">1920 × 1080 — FiveM Canvas</span>
        <span className="ml-auto text-[11px] text-t3">{components.length} component{components.length!==1?'s':''}</span>
      </div>

      {/* Inject animation keyframes */}
      <style>{ANIM_CSS}</style>

      <div className="mt-9 flex-shrink-0" style={{ paddingTop: 8 }}>
        <div
          ref={canvasRef}
          className={`relative rounded-xl overflow-hidden border transition-all ${dragOver ? 'border-acc shadow-lg shadow-acc/20 outline outline-2 outline-acc outline-offset-2' : 'border-white/[0.12]'}`}
          style={{ width: sw, height: sh, ...bgStyle, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onMouseDown={e => { if (e.target === canvasRef.current) setSelectedId(null); }}
        >
          {/* YouTube background preview */}
          {settings.youtubeId && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img
                src={`https://img.youtube.com/vi/${settings.youtubeId}/maxresdefault.jpg`}
                className="w-full h-full object-cover opacity-50"
                onError={e => { e.target.src = `https://img.youtube.com/vi/${settings.youtubeId}/mqdefault.jpg`; }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 text-white/70 text-[9px] font-bold px-2 py-1 rounded-full tracking-widest" style={{ transform: `scale(${1/scale})`, transformOrigin: 'center' }}>
                  ▶ YOUTUBE BACKGROUND
                </div>
              </div>
            </div>
          )}

          {components.length === 0 && !settings.youtubeId && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20 pointer-events-none">
              <span className="text-5xl">🎬</span>
              <span className="text-sm font-semibold">Drag components here</span>
              <span className="text-xs">or double-click in the left panel</span>
            </div>
          )}

          {components.map(comp => {
            const sel = comp.id === selectedId;
            const animStyle = comp.anim && comp.anim !== 'none' && ANIM_MAP[comp.anim]
              ? { animation: ANIM_MAP[comp.anim], animationDelay: `${(comp.animDelay || 0)}ms` }
              : {};
            return (
              <div key={comp.id}
                className={`absolute cursor-move select-none ${sel ? 'ring-2 ring-acc ring-offset-0' : ''}`}
                style={{
                  left: Math.round(comp.x * scale), top: Math.round(comp.y * scale),
                  width: Math.round(comp.w * scale), height: Math.round(comp.h * scale),
                  zIndex: comp.z || 1, opacity: comp.op || 1,
                  ...animStyle,
                }}
                onMouseDown={e => startDrag(e, comp)}
                onContextMenu={e => e.preventDefault()}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: comp.w, height: comp.h, overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{ __html: compHTML(comp.type, comp.props, comp.w, comp.h) }} />

                {sel && ['tl','tr','bl','br'].map(pos => (
                  <div key={pos} onMouseDown={e => startResize(e, comp, pos)}
                    className={`absolute w-2 h-2 bg-acc border-2 border-white rounded-[3px] z-10 cursor-${pos==='tl'?'nw':pos==='tr'?'ne':pos==='bl'?'sw':'se'}-resize`}
                    style={{ top: pos.startsWith('t')?-4:'auto', bottom: pos.startsWith('b')?-4:'auto', left: pos.endsWith('l')?-4:'auto', right: pos.endsWith('r')?-4:'auto' }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getCompDefs() {
  return {
    progress_bar:{label:'Progress Bar',icon:'⏳',cat:'Loading',defs:{width:300,height:22,color:'#6c63ff',bgColor:'rgba(0,0,0,0.4)',label:'Loading...',showPct:true,radius:12}},
    spinner:{label:'Spinner',icon:'🔄',cat:'Loading',defs:{width:70,height:70,color:'#6c63ff',size:48}},
    loading_text:{label:'Loading Text',icon:'📝',cat:'Loading',defs:{width:220,height:38,text:'Connecting to server...',fontSize:15,color:'#ffffff',anim:'pulse'}},
    server_logo:{label:'Server Logo',icon:'🏷️',cat:'Server',defs:{width:110,height:110,emoji:'⚔️',serverName:'My Server',showName:true}},
    server_name:{label:'Server Name',icon:'✏️',cat:'Server',defs:{width:260,height:52,text:'My FiveM Server',fontSize:30,color:'#ffffff',fontWeight:'700',gradient:true,glow:false}},
    server_desc:{label:'Description',icon:'📋',cat:'Server',defs:{width:280,height:76,text:'Welcome to our server!',fontSize:13,color:'#cccccc',align:'center'}},
    player_count:{label:'Player Count',icon:'👥',cat:'Server',defs:{width:160,height:82,players:142,maxPlayers:256,bgColor:'rgba(0,0,0,0.5)'}},
    server_status:{label:'Status',icon:'🟢',cat:'Server',defs:{width:130,height:30,status:'online',showDot:true}},
    discord_widget:{label:'Discord',icon:'💬',cat:'Social',defs:{width:220,height:62,link:'#',members:'4.2K',online:'321'}},
    social_buttons:{label:'Social Links',icon:'🔗',cat:'Social',defs:{width:210,height:38,platforms:'discord,twitter,youtube'}},
    rules_panel:{label:'Rules Panel',icon:'📜',cat:'Community',defs:{width:255,height:175,title:'Server Rules',rules:'No cheating\nRespect all players\nNo toxic behavior\nFollow staff instructions'}},
    staff_card:{label:'Staff Card',icon:'👤',cat:'Community',defs:{width:220,height:68,name:'Admin Name',role:'Senior Admin',emoji:'👑'}},
    news_panel:{label:'News Panel',icon:'📰',cat:'Community',defs:{width:255,height:145,title:'Latest Updates',items:'New DLC cars added\nEconomy rebalanced\nNew jobs available'}},
    tip_system:{label:'Tip System',icon:'💡',cat:'Content',defs:{width:280,height:48,tips:'Press F1 for help\nJoin our Discord!\nRead the server rules'}},
    features_list:{label:'Features List',icon:'✨',cat:'Content',defs:{width:220,height:155,title:'Server Features',items:'Custom Cars\nEconomy System\nHousing\nGangs'}},
    countdown:{label:'Countdown',icon:'⏰',cat:'Content',defs:{width:200,height:78,label:'Server Restart',seconds:3600}},
    image_gallery:{label:'Gallery',icon:'🖼️',cat:'Content',defs:{width:220,height:130,images:'🏎️,🏙️,🌅,🎮'}},
    text_block:{label:'Text Block',icon:'✍️',cat:'Layout',defs:{width:200,height:55,text:'Custom text block',fontSize:14,color:'#ffffff',align:'center'}},
    divider:{label:'Divider',icon:'➖',cat:'Layout',defs:{width:200,height:18,color:'rgba(255,255,255,0.18)'}},
  };
}
