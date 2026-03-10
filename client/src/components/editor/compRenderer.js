const SCOLS = {discord:'#5865F2',twitter:'#1DA1F2',youtube:'#FF0000',twitch:'#9146FF',tiktok:'#333'};
const SEMO  = {discord:'💬',twitter:'🐦',youtube:'▶️',twitch:'🟣',tiktok:'🎵'};

export function compHTML(type, p, w, h) {
  switch(type) {
    case 'progress_bar':
      return `<div style="width:100%;padding:2px 0">
        ${p.label?`<div style="font-size:10px;margin-bottom:3px;font-family:Space Grotesk,sans-serif;color:${p.color||'#fff'}">${p.label}${p.showPct?' — <span>-- %</span>':''}</div>`:''}
        <div style="height:6px;border-radius:${p.radius||12}px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:${p.bgColor||'rgba(0,0,0,.4)'}">
          <div style="height:100%;border-radius:${p.radius||12}px;background:${p.color||'#6c63ff'};animation:fcp 2s ease-in-out infinite"></div>
        </div></div>`;

    case 'spinner':
      return `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
        <div style="width:${p.size||48}px;height:${p.size||48}px;border:3px solid rgba(255,255,255,.1);border-top-color:${p.color||'#6c63ff'};border-radius:50%;animation:spin .8s linear infinite"></div></div>`;

    case 'loading_text':
      return `<div class="${p.anim==='pulse'?'anim-pulse':''}" style="color:${p.color||'#fff'};font-size:${p.fontSize||15}px;font-family:Space Grotesk,sans-serif;text-align:center">
        ${p.text||'Loading...'}<span class="anim-pulse">…</span></div>`;

    case 'server_logo': {
      const s = Math.min(w,h) < 90 ? 42 : 58;
      return `<div style="text-align:center;padding:10px">
        <div style="width:${s}px;height:${s}px;border-radius:10px;background:linear-gradient(135deg,#6c63ff,#ff6584);display:flex;align-items:center;justify-content:center;font-size:${Math.floor(s*.55)}px;margin:0 auto 6px">${p.emoji||'⚔️'}</div>
        ${p.showName?`<div style="color:#fff;font-size:11px;font-weight:600;font-family:Space Grotesk,sans-serif">${p.serverName||'My Server'}</div>`:''}</div>`;
    }

    case 'server_name':
      return `<div style="color:${p.gradient?'transparent':p.color||'#fff'};font-size:${p.fontSize||30}px;font-weight:${p.fontWeight||700};font-family:Syne,sans-serif;text-align:center;letter-spacing:-0.5px;line-height:1.1;width:100%;padding:2px 4px;${p.gradient?'background:linear-gradient(135deg,#6c63ff,#ff6584);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;':''}${p.glow?'text-shadow:0 0 18px '+(p.color||'#fff')+';':''}">
        ${p.text||'Server Name'}</div>`;

    case 'server_desc':
      return `<div style="color:${p.color||'#ccc'};font-size:${p.fontSize||13}px;text-align:${p.align||'center'};font-family:Space Grotesk,sans-serif;line-height:1.5;padding:4px;width:100%">${p.text||'Server description'}</div>`;

    case 'player_count':
      return `<div style="background:${p.bgColor||'rgba(0,0,0,.5)'};border:1px solid rgba(255,255,255,.13);border-radius:8px;padding:10px 14px;text-align:center">
        <div style="font-size:10px;color:#888;margin-bottom:3px;font-family:Space Grotesk,sans-serif;letter-spacing:.8px;text-transform:uppercase">Online Players</div>
        <div style="font-size:26px;font-weight:700;color:#fff;font-family:JetBrains Mono,monospace">${p.players||0}</div>
        <div style="font-size:10px;color:#666;font-family:Space Grotesk,sans-serif">/ ${p.maxPlayers||256} max</div></div>`;

    case 'server_status': {
      const on = p.status === 'online';
      return `<div style="display:flex;align-items:center;gap:7px">
        ${p.showDot?`<div style="width:8px;height:8px;border-radius:50%;background:${on?'#2dd4a3':'#ff4757'};box-shadow:0 0 6px ${on?'#2dd4a3':'#ff4757'}"></div>`:''}
        <span style="color:${on?'#2dd4a3':'#ff4757'};font-size:13px;font-weight:600;font-family:Space Grotesk,sans-serif">Server ${on?'Online':'Offline'}</span></div>`;
    }

    case 'discord_widget':
      return `<div style="background:rgba(88,101,242,.18);border:1px solid rgba(88,101,242,.35);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:9px">
        <span style="font-size:22px">💬</span>
        <div><div style="font-size:13px;font-weight:600;font-family:Space Grotesk,sans-serif">Join our Discord</div>
        <div style="font-size:11px;color:#7289da;font-family:Space Grotesk,sans-serif">${p.online||'0'} online · ${p.members||'0'} members</div></div></div>`;

    case 'social_buttons': {
      const pls = (p.platforms||'discord').split(',').map(x=>x.trim()).filter(Boolean).slice(0,5);
      return `<div style="display:flex;gap:5px;flex-wrap:wrap">${pls.map(pl=>`<div style="padding:5px 10px;border-radius:5px;background:${SCOLS[pl]||'#333'};color:#fff;font-size:11px;font-weight:600;font-family:Space Grotesk,sans-serif">${SEMO[pl]||'🔗'} ${pl.charAt(0).toUpperCase()+pl.slice(1)}</div>`).join('')}</div>`;
    }

    case 'rules_panel': {
      const rules = (p.rules||'').split('\n').filter(Boolean);
      return `<div style="background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:13px;width:100%;height:100%;overflow-y:auto">
        <div style="font-weight:700;margin-bottom:7px;color:#fff;font-family:Syne,sans-serif;font-size:13px">${p.title||'Server Rules'}</div>
        ${rules.map((r,i)=>`<div style="font-size:11px;color:#bbb;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);font-family:Space Grotesk,sans-serif"><span style="color:#6c63ff;margin-right:5px">${i+1}.</span>${r}</div>`).join('')}</div>`;
    }

    case 'staff_card': {
      const sz = Math.min(h, 40);
      return `<div style="background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:10px;display:flex;align-items:center;gap:9px;width:100%">
        <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:linear-gradient(135deg,#6c63ff,#ff6584);display:flex;align-items:center;justify-content:center;font-size:${Math.floor(sz*.5)}px;flex-shrink:0">${p.emoji||'👑'}</div>
        <div><div style="font-size:13px;font-weight:600;color:#fff;font-family:Space Grotesk,sans-serif">${p.name||'Staff Name'}</div>
        <div style="font-size:11px;color:#6c63ff;font-family:Space Grotesk,sans-serif">${p.role||'Admin'}</div></div></div>`;
    }

    case 'news_panel': {
      const items = (p.items||'').split('\n').filter(Boolean);
      return `<div style="background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:13px;width:100%;height:100%">
        <div style="font-weight:700;margin-bottom:7px;color:#fff;font-family:Syne,sans-serif;font-size:12px">📰 ${p.title||'Updates'}</div>
        ${items.map(i=>`<div style="font-size:11px;color:#aaa;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);font-family:Space Grotesk,sans-serif">• ${i}</div>`).join('')}</div>`;
    }

    case 'tip_system': {
      const tips = (p.tips||'Tip here').split('\n').filter(Boolean);
      const tip  = tips[Math.floor(Date.now()/3500) % tips.length] || tips[0];
      return `<div style="background:rgba(108,99,255,.18);border-left:3px solid #6c63ff;padding:9px 12px;border-radius:0 8px 8px 0;font-size:12px;width:100%">
        <span style="font-weight:700;color:#6c63ff">💡 TIP: </span>
        <span style="font-family:Space Grotesk,sans-serif">${tip}</span></div>`;
    }

    case 'features_list': {
      const feats = (p.items||'').split('\n').filter(Boolean);
      return `<div style="background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.09);border-radius:8px;padding:13px;width:100%;height:100%">
        <div style="font-weight:700;margin-bottom:7px;color:#fff;font-family:Syne,sans-serif;font-size:12px">✨ ${p.title||'Features'}</div>
        ${feats.map(f=>`<div style="font-size:11px;color:#ccc;padding:2px 0;font-family:Space Grotesk,sans-serif"><span style="color:#2dd4a3;margin-right:5px">▹</span>${f}</div>`).join('')}</div>`;
    }

    case 'countdown': {
      const sec=p.seconds||3600, hh=Math.floor(sec/3600), mm=Math.floor((sec%3600)/60), ss=sec%60;
      return `<div style="text-align:center">
        <div style="font-size:10px;color:#888;margin-bottom:3px;font-family:Space Grotesk,sans-serif;text-transform:uppercase;letter-spacing:.8px">${p.label||'Countdown'}</div>
        <div style="font-family:JetBrains Mono,monospace;font-size:30px;font-weight:700;letter-spacing:2px;color:#fff">${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}</div></div>`;
    }

    case 'image_gallery': {
      const imgs = (p.images||'🏎️,🏙️,🌅,🎮').split(',').map(x=>x.trim()).slice(0,4);
      const ih   = Math.floor(h/2) - 2;
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;border-radius:8px;overflow:hidden;width:100%;height:100%">
        ${imgs.map(img=>`<div style="display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.04);height:${ih}px">${img}</div>`).join('')}</div>`;
    }

    case 'text_block':
      return `<div style="color:${p.color||'#fff'};font-size:${p.fontSize||14}px;text-align:${p.align||'center'};font-family:Space Grotesk,sans-serif;line-height:1.5;width:100%;padding:4px">${p.text||'Text block'}</div>`;

    case 'divider':
      return `<div style="width:100%;height:1px;background:${p.color||'rgba(255,255,255,.18)'}"></div>`;

    default:
      return `<div style="background:rgba(108,99,255,.1);border:1px dashed #6c63ff;border-radius:7px;padding:8px;color:#6c63ff;font-size:12px;font-family:Space Grotesk,sans-serif">${type}</div>`;
  }
}
