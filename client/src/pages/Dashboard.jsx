import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Trash2, Copy, Globe, Lock, Star, Eye, Loader2, LogOut, User, Settings, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projects as projectsAPI } from '../utils/api';

const TEMPLATES = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    desc: 'HUD-style with glitch effects',
    emoji: '🌆',
    preview: 'linear-gradient(160deg,#050510 0%,#0a0520 50%,#050510 100%)',
    acc: '#00fff7',
  },
  {
    id: 'luxury-dark',
    name: 'Luxury Dark',
    desc: 'Gold accents & elegance',
    emoji: '🥂',
    preview: 'linear-gradient(160deg,#0f0e0c 0%,#080808 50%,#0a0907 100%)',
    acc: '#c9a84c',
  },
  {
    id: 'military-tactical',
    name: 'Military Tactical',
    desc: 'Radar sweep & mission HUD',
    emoji: '🎖️',
    preview: 'linear-gradient(160deg,#0a0d08 0%,#111508 60%,#0a0d08 100%)',
    acc: '#4ade80',
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    desc: 'Light, modern & fresh',
    emoji: '⬜',
    preview: 'linear-gradient(135deg,#e8e8e2 0%,#d8d8d0 100%)',
    acc: '#2563eb',
  },
];

function timeAgo(dateStr) {
  const d = new Date(dateStr), now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pList, setPList]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [userMenu, setUserMenu] = useState(false);

  const load = async () => {
    try {
      const { data } = await projectsAPI.list();
      setPList(data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createFromTemplate = async (tmpl) => {
    setCreating(true);
    try {
      const { data } = await projectsAPI.create({ name: tmpl.name, templateId: tmpl.id });
      toast.success('Project created!');
      navigate(`/editor/${data.id}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create project'); }
    finally { setCreating(false); }
  };

  const createBlank = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await projectsAPI.create({ name: newName.trim() });
      toast.success('Project created!');
      navigate(`/editor/${data.id}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create'); }
    finally { setCreating(false); setShowNew(false); }
  };

  const deleteProject = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await projectsAPI.delete(id);
      setPList(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Delete failed'); }
  };

  const dupProject = async (id) => {
    try {
      const { data } = await projectsAPI.duplicate(id);
      toast.success('Project duplicated!');
      await load();
    } catch { toast.error('Duplicate failed'); }
  };

  const togglePublic = async (id, current) => {
    try {
      await projectsAPI.patch(id, { is_public: !current });
      setPList(p => p.map(x => x.id === id ? { ...x, is_public: !current } : x));
      toast.success(current ? 'Project set to private' : 'Project published to gallery!');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="min-h-screen bg-bg0 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg2/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-acc to-acc3 flex items-center justify-center text-sm">🎬</div>
            <span className="font-display text-lg font-black tracking-tight">
              <span className="text-acc2">Screen</span>Forge
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a href="/gallery" className="text-t2 hover:text-t1 text-sm flex items-center gap-1.5 transition-colors">
              <Globe size={14}/> Gallery
            </a>
            <div className="relative">
              <button onClick={() => setUserMenu(v=>!v)}
                className="flex items-center gap-2 h-8 px-3 rounded-lg bg-bg3 border border-white/[0.07] hover:border-white/[0.14] text-sm text-t1 transition-all">
                {user?.avatar
                  ? <img src={user.avatar} className="w-5 h-5 rounded-full" />
                  : <div className="w-5 h-5 rounded-full bg-acc flex items-center justify-content text-[10px] font-bold">{user?.username?.[0]?.toUpperCase()}</div>}
                {user?.username}
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-bg2 border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-50">
                  <div className="px-3 py-2 text-xs text-t3 border-b border-white/[0.06] mb-1">{user?.email}</div>
                  <button onClick={() => { setUserMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-t2 hover:bg-bg3 hover:text-t1 transition-colors">
                    <User size={13}/> Profile
                  </button>
                  <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-t2 hover:bg-red-500/10 hover:text-err transition-colors">
                    <LogOut size={13}/> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Projects */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Your Projects</h1>
            <p className="text-t2 text-sm mt-0.5">{pList.length} project{pList.length!==1?'s':''} · {50-pList.length} slots remaining</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 h-9 px-4 bg-acc hover:bg-acc2 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-acc/20">
            <Plus size={15}/> New Project
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-acc"/></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
            {pList.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
                className="group bg-bg2 border border-white/[0.07] hover:border-acc/40 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-acc/5 hover:-translate-y-0.5"
                onClick={() => navigate(`/editor/${p.id}`)}>
                <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{ background: '#0d0d1a' }}>
                  {p.thumbnail
                    ? <img src={p.thumbnail} className="w-full h-full object-cover" />
                    : <span className="text-5xl">🎬</span>}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg2/60 to-transparent"/>
                  {/* Badges */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    {p.is_public && <span className="px-2 py-0.5 bg-ok/20 text-ok text-[10px] font-bold rounded-full border border-ok/20">PUBLIC</span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-sm text-t1 mb-0.5 truncate">{p.name}</div>
                  <div className="flex items-center gap-3 text-[11px] text-t3">
                    <span>{timeAgo(p.updated_at)}</span>
                    {p.stars > 0 && <span className="flex items-center gap-1"><Star size={10}/>{p.stars}</span>}
                    {p.views > 0 && <span className="flex items-center gap-1"><Eye size={10}/>{p.views}</span>}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                    <button onClick={() => dupProject(p.id)} title="Duplicate" className="flex-1 flex items-center justify-center gap-1 h-7 text-[11px] text-t2 hover:text-t1 bg-bg3 hover:bg-bg4 rounded-lg transition-all">
                      <Copy size={11}/> Copy
                    </button>
                    <button onClick={() => togglePublic(p.id, p.is_public)} title={p.is_public ? 'Make Private' : 'Publish'} className="flex-1 flex items-center justify-center gap-1 h-7 text-[11px] text-t2 hover:text-t1 bg-bg3 hover:bg-bg4 rounded-lg transition-all">
                      {p.is_public ? <Lock size={11}/> : <Globe size={11}/>}
                      {p.is_public ? 'Private' : 'Publish'}
                    </button>
                    <button onClick={() => deleteProject(p.id, p.name)} title="Delete" className="flex items-center justify-center w-7 h-7 text-t3 hover:text-err bg-bg3 hover:bg-err/10 rounded-lg transition-all">
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* New project card */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              onClick={() => setShowNew(true)}
              className="bg-bg2 border border-dashed border-white/[0.12] hover:border-acc/50 rounded-2xl cursor-pointer transition-all hover:bg-acc/5 min-h-[200px] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-bg3 group-hover:bg-acc flex items-center justify-center text-2xl transition-all">➕</div>
              <span className="text-sm font-semibold text-t2">New Project</span>
            </motion.div>
          </div>
        )}

        {/* Templates */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold mb-1">Start from a Template</h2>
          <p className="text-t2 text-sm mb-5">Professional templates — copy to your server and go live instantly</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 + i*0.06 }}
                onClick={() => createFromTemplate(t)}
                className="bg-bg2 border border-white/[0.07] hover:border-acc/40 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl group">
                <div className="h-28 flex items-center justify-center relative overflow-hidden" style={{ background: t.preview }}>
                  <span className="relative z-10 text-5xl drop-shadow-lg">{t.emoji}</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                  <div className="absolute top-2.5 right-2.5">
                    <div className="w-3 h-3 rounded-full border-2 border-white/20" style={{ background: t.acc, boxShadow: `0 0 8px ${t.acc}` }}/>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
                <div className="p-3.5">
                  <div className="text-sm font-semibold text-t1 mb-0.5">{t.name}</div>
                  <div className="text-[11px] text-t3">{t.desc}</div>
                  <div className="mt-2 text-[10px] font-bold text-acc2 opacity-0 group-hover:opacity-100 transition-opacity">Use template →</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <motion.div initial={{ scale:.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
            onClick={e=>e.stopPropagation()}
            className="bg-bg2 border border-white/[0.1] rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl font-bold mb-1">New Project</h2>
            <p className="text-t2 text-sm mb-5">Give your loading screen a name</p>
            <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createBlank()}
              placeholder="e.g. City Roleplay Server" autoFocus
              className="w-full h-11 px-4 bg-bg1 border border-white/[0.08] rounded-xl text-t1 outline-none focus:border-acc mb-4 text-sm transition-colors" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNew(false)} className="h-9 px-5 bg-bg3 hover:bg-bg4 text-t2 text-sm rounded-xl transition-all">Cancel</button>
              <button onClick={createBlank} disabled={!newName.trim() || creating}
                className="h-9 px-5 bg-acc hover:bg-acc2 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                {creating && <Loader2 size={13} className="animate-spin"/>} Create →
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-bg2 rounded-2xl p-6 flex items-center gap-3">
            <Loader2 className="animate-spin text-acc" size={20}/>
            <span className="text-sm">Creating project...</span>
          </div>
        </div>
      )}
    </div>
  );
}
