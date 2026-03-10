import { useState } from 'react';
import { useEditorStore } from '../../hooks/useEditorStore';

const DEFS = {
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
  rules_panel:{label:'Rules Panel',icon:'📜',cat:'Community',defs:{width:255,height:175,title:'Server Rules',rules:'No cheating\nRespect all players\nNo toxic behavior'}},
  staff_card:{label:'Staff Card',icon:'👤',cat:'Community',defs:{width:220,height:68,name:'Admin Name',role:'Senior Admin',emoji:'👑'}},
  news_panel:{label:'News Panel',icon:'📰',cat:'Community',defs:{width:255,height:145,title:'Latest Updates',items:'New DLC cars added\nEconomy rebalanced'}},
  tip_system:{label:'Tip System',icon:'💡',cat:'Content',defs:{width:280,height:48,tips:'Press F1 for help\nJoin our Discord!'}},
  features_list:{label:'Features List',icon:'✨',cat:'Content',defs:{width:220,height:155,title:'Server Features',items:'Custom Cars\nEconomy System\nHousing'}},
  countdown:{label:'Countdown',icon:'⏰',cat:'Content',defs:{width:200,height:78,label:'Server Restart',seconds:3600}},
  image_gallery:{label:'Gallery',icon:'🖼️',cat:'Content',defs:{width:220,height:130,images:'🏎️,🏙️,🌅,🎮'}},
  text_block:{label:'Text Block',icon:'✍️',cat:'Layout',defs:{width:200,height:55,text:'Custom text block',fontSize:14,color:'#ffffff',align:'center'}},
  divider:{label:'Divider',icon:'➖',cat:'Layout',defs:{width:200,height:18,color:'rgba(255,255,255,0.18)'}},
};

const TEMPLATES = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    desc: 'HUD-style with glitch fx',
    emoji: '🌆',
    preview: 'linear-gradient(135deg,#050510 0%,#0a0520 50%,#050510 100%)',
    acc: '#00fff7',
    bg: 'linear-gradient(160deg,#050510 0%,#0a0520 40%,#050510 100%)',
    comps: [
      { t:'server_name',  x:780,  y:380, ov:{ text:'NEON CITY RP', fontSize:52, color:'#00fff7', fontWeight:'900', gradient:false, glow:true }},
      { t:'server_desc',  x:810,  y:460, ov:{ text:'// WHERE THE FUTURE IS NOW //', fontSize:12, color:'rgba(0,255,247,0.5)', align:'center' }},
      { t:'player_count', x:860,  y:530, ov:{ players:247, maxPlayers:256, bgColor:'rgba(0,255,247,0.04)' }},
      { t:'progress_bar', x:660,  y:980, ov:{ color:'#00fff7', bgColor:'rgba(0,255,247,0.1)', label:'INITIALIZING SYSTEMS', radius:0, width:600 }},
      { t:'tip_system',   x:660,  y:920, ov:{ tips:'Press F1 to open the help menu\nJoin our Discord for events\nReport bugs using /report' }},
      { t:'social_buttons',x:820, y:1020,ov:{ platforms:'discord,twitter' }},
      { t:'server_status', x:870, y:340, ov:{ status:'online', showDot:true }},
    ],
  },
  {
    id: 'luxury-dark',
    name: 'Luxury Dark',
    desc: 'Gold & elegance',
    emoji: '🥂',
    preview: 'linear-gradient(160deg,#0f0e0c 0%,#080808 50%,#0a0907 100%)',
    acc: '#c9a84c',
    bg: 'linear-gradient(180deg,#0f0e0c 0%,#080808 50%,#0a0907 100%)',
    comps: [
      { t:'server_name',   x:730,  y:330, ov:{ text:'EMPIRE', fontSize:78, color:'#f5f0e8', fontWeight:'300', gradient:false, glow:false }},
      { t:'server_desc',   x:790,  y:435, ov:{ text:'The Premier Los Santos Experience', fontSize:11, color:'rgba(201,168,76,0.6)', align:'center' }},
      { t:'divider',       x:760,  y:480, ov:{ color:'rgba(201,168,76,0.25)', width:400 }},
      { t:'player_count',  x:775,  y:510, ov:{ players:312, maxPlayers:500, bgColor:'rgba(201,168,76,0.04)' }},
      { t:'rules_panel',   x:80,   y:280, ov:{ title:'Server Rules', rules:'Respect all players\nNo random deathmatch\nValue your life\nFollow staff instructions', width:260, height:200 }},
      { t:'news_panel',    x:1580, y:280, ov:{ title:'Latest Updates', items:'New housing system live\nEconomy rebalanced\nCustom vehicles added', width:260, height:200 }},
      { t:'progress_bar',  x:660,  y:980, ov:{ color:'#c9a84c', bgColor:'rgba(201,168,76,0.1)', label:'', radius:0, width:600 }},
      { t:'tip_system',    x:660,  y:930, ov:{ tips:'Welcome. Please read the server rules before playing.\nNew to RP? Check our beginner guide on Discord.\nEconomy resets every Sunday at midnight.' }},
    ],
  },
  {
    id: 'military-tactical',
    name: 'Military Tactical',
    desc: 'Radar & mission briefing',
    emoji: '🎖️',
    preview: 'linear-gradient(160deg,#0a0d08 0%,#111508 60%,#0a0d08 100%)',
    acc: '#4ade80',
    bg: 'linear-gradient(160deg,#0a0d08 0%,#111508 60%,#0a0d08 100%)',
    comps: [
      { t:'server_name',   x:760,  y:370, ov:{ text:'ALPHA CITY', fontSize:64, color:'rgba(255,255,255,0.9)', fontWeight:'700', gradient:false, glow:false }},
      { t:'server_desc',   x:820,  y:455, ov:{ text:'TACTICAL ROLEPLAY', fontSize:13, color:'#4ade80', align:'center' }},
      { t:'server_status', x:890,  y:330, ov:{ status:'online', showDot:true }},
      { t:'player_count',  x:870,  y:500, ov:{ players:189, maxPlayers:256, bgColor:'rgba(74,222,128,0.04)' }},
      { t:'rules_panel',   x:60,   y:220, ov:{ title:'// RULES OF ENGAGEMENT', rules:'01 — No random deathmatch\n02 — Value your life always\n03 — Respect all units\n04 — Follow staff orders', width:280, height:220 }},
      { t:'features_list', x:1580, y:220, ov:{ title:'// MISSION ASSETS', items:'Custom Weapons\nVehicle Spawner\nJob System\nGang Territories\nSafe Zones', width:280, height:220 }},
      { t:'progress_bar',  x:60,   y:1000,ov:{ color:'#4ade80', bgColor:'rgba(74,222,128,0.1)', label:'LOADING RESOURCES', radius:0, width:1800 }},
      { t:'tip_system',    x:60,   y:940, ov:{ tips:'Press F1 to open the help menu\nUse /report to alert staff of issues\nNew? Start at the spawn point' }},
    ],
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    desc: 'Light, modern & fresh',
    emoji: '⬜',
    preview: 'linear-gradient(135deg,#f8f8f6 0%,#eeeee8 100%)',
    acc: '#2563eb',
    bg: 'linear-gradient(135deg,#f0f0ec 0%,#e8e8e2 100%)',
    comps: [
      { t:'server_name',   x:80,   y:240, ov:{ text:'Velocity Streets', fontSize:64, color:'#111110', fontWeight:'600', gradient:false, glow:false, width:560, height:75 }},
      { t:'server_desc',   x:80,   y:335, ov:{ text:'A modern immersive roleplay experience set in the heart of Los Santos.', fontSize:14, color:'#666660', align:'left', width:520, height:55 }},
      { t:'features_list', x:80,   y:410, ov:{ title:'Server Features', items:'🏎️  Custom Cars\n🏠  Housing System\n💼  Economy\n👮  Police & EMS', width:300, height:175 }},
      { t:'social_buttons',x:80,   y:605, ov:{ platforms:'discord,twitter,youtube', width:280, height:38 }},
      { t:'player_count',  x:1300, y:240, ov:{ players:274, maxPlayers:500, bgColor:'rgba(0,0,0,0.04)', width:175, height:85 }},
      { t:'server_status', x:1355, y:345, ov:{ status:'online', width:130, height:30 }},
      { t:'tip_system',    x:1270, y:400, ov:{ tips:'Use /help for a list of all commands.\nVisit the job center to find work.\nJoin Discord to stay updated.', width:360, height:75 }},
      { t:'progress_bar',  x:60,   y:1020,ov:{ color:'#2563eb', bgColor:'rgba(37,99,235,0.12)', label:'Loading resources...', radius:100, width:1800, height:16 }},
    ],
  },
];

const CATS = ['Loading','Server','Social','Community','Content','Layout'];

export default function LeftSidebar() {
  const [tab, setTab] = useState('comps');
  const { components, selectedId, setSelectedId, addComponent, deleteComponent, duplicateComponent, applyTemplate, setLsTab } = useEditorStore();

  const doAdd = (type) => {
    const d = DEFS[type]; if (!d) return;
    addComponent({
      id: `c${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      type, x: 860, y: 500,
      w: d.defs.width||200, h: d.defs.height||80,
      z: components.length+1, op: 1, props: { ...d.defs },
    });
  };

  const doTemplate = (t) => {
    const comps = t.comps.map((c, i) => {
      const d = DEFS[c.t]; if (!d) return null;
      const props = { ...d.defs, ...(c.ov||{}) };
      return { id: `c${Date.now()}_${i}_${Math.random().toString(36).slice(2,5)}`, type: c.t, x: c.x||100, y: c.y||100, w: props.width||200, h: props.height||80, z: i+1, op: 1, props };
    }).filter(Boolean);
    applyTemplate(comps, { bg: t.bg, acc: t.acc, serverName: t.name });
  };

  return (
    <div className="w-64 flex-shrink-0 bg-bg2 border-r border-white/[0.06] flex flex-col overflow-hidden mt-9">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] flex-shrink-0">
        {[['comps','🧩','Comps'],['tmpls','📐','Templates'],['layers','🗂','Layers']].map(([id,ico,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex-1 h-9 text-[10px] font-bold tracking-wide uppercase transition-all border-b-2 ${tab===id?'text-acc2 border-acc':'text-t3 border-transparent hover:text-t2'}`}>
            {ico} {lbl}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {/* COMPONENTS */}
        {tab === 'comps' && (
          <div>
            {CATS.map(cat => {
              const items = Object.entries(DEFS).filter(([,v]) => v.cat === cat);
              return (
                <div key={cat}>
                  <div className="text-[10px] font-bold text-t3 uppercase tracking-widest px-1 pt-2.5 pb-1.5 first:pt-0">{cat}</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-1">
                    {items.map(([k,v]) => (
                      <div key={k} draggable
                        onDragStart={e => e.dataTransfer.setData('comp-type', k)}
                        onDoubleClick={() => doAdd(k)}
                        className="bg-bg3 border border-white/[0.06] hover:border-acc/50 hover:bg-bg4 rounded-lg p-2 cursor-grab active:cursor-grabbing transition-all hover:-translate-y-px hover:shadow-md flex flex-col items-center gap-1.5 text-center select-none"
                        title="Drag to canvas or double-click">
                        <span className="text-lg leading-none">{v.icon}</span>
                        <span className="text-[10px] font-medium text-t2 leading-tight">{v.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="text-[10px] text-t3 text-center py-2 mt-1">Drag to canvas or double-click</div>
          </div>
        )}

        {/* TEMPLATES */}
        {tab === 'tmpls' && (
          <div>
            <p className="text-[10px] text-t3 px-1 pb-3 leading-relaxed">Click a template to apply it. This replaces all current components.</p>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => doTemplate(t)}
                className="border border-white/[0.06] hover:border-acc/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-2xl mb-3 group"
                style={{ background: t.preview }}>

                {/* Rich preview area */}
                <div className="h-36 relative overflow-hidden flex items-center justify-center px-4">
                  {/* Background effect */}
                  <div className="absolute inset-0" style={{ background: t.preview }}/>

                  {/* Accent glow blob */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: t.acc }}/>

                  {/* Mock layout elements */}
                  <div className="relative z-10 w-full space-y-2">
                    {/* Server name mock */}
                    <div className="h-5 rounded-sm mx-auto opacity-90" style={{ background: t.acc, width: '60%', boxShadow: `0 0 12px ${t.acc}60` }}/>
                    <div className="h-2 rounded-sm mx-auto opacity-50" style={{ background: t.acc, width: '35%' }}/>
                    {/* Two side panels mock */}
                    <div className="flex gap-2 mt-3">
                      <div className="h-10 rounded flex-1 opacity-20" style={{ background: t.acc }}/>
                      <div className="h-10 rounded flex-1 opacity-20" style={{ background: t.acc }}/>
                    </div>
                    {/* Progress bar mock */}
                    <div className="h-1 rounded-full w-full opacity-30 mt-1" style={{ background: t.acc }}/>
                  </div>

                  {/* Big emoji centered */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl drop-shadow-2xl opacity-20 group-hover:opacity-30 transition-opacity">{t.emoji}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: `${t.acc}15` }}>
                    <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border" style={{ color: t.acc, borderColor: `${t.acc}50`, background: 'rgba(0,0,0,0.6)' }}>Apply Template</span>
                  </div>
                </div>

                {/* Info row */}
                <div className="px-3 py-2.5 border-t" style={{ borderColor: `${t.acc}20`, background: 'rgba(0,0,0,0.4)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white/90">{t.name}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{t.desc}</div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-black/40" style={{ background: t.acc, boxShadow: `0 0 6px ${t.acc}` }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LAYERS */}
        {tab === 'layers' && (
          <div>
            {components.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-t3">
                <span className="text-3xl">🗂️</span>
                <span className="text-xs font-semibold text-t2">No layers yet</span>
                <span className="text-[10px] text-center">Add components to see them here</span>
              </div>
            ) : (
              [...components].reverse().map(c => {
                const def = DEFS[c.type];
                const sel = c.id === selectedId;
                return (
                  <div key={c.id} onClick={() => setSelectedId(c.id)}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all mb-0.5 ${sel ? 'bg-acc/15 border border-acc/20' : 'hover:bg-bg3 border border-transparent'}`}>
                    <span className="text-sm">{def?.icon || '◾'}</span>
                    <span className="flex-1 text-xs font-medium truncate">{def?.label || c.type}</span>
                    <div className="hidden group-hover:flex gap-1">
                      <button onClick={e=>{e.stopPropagation();duplicateComponent(c.id);}} className="w-5 h-5 rounded flex items-center justify-center text-t3 hover:text-t1 hover:bg-bg4 transition-colors text-[10px]">⧉</button>
                      <button onClick={e=>{e.stopPropagation();deleteComponent(c.id);}} className="w-5 h-5 rounded flex items-center justify-center text-t3 hover:text-err hover:bg-err/10 transition-colors text-[10px]">✕</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
