import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Eye, Search, Globe, ArrowLeft, Loader2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { gallery, projects as projectsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Gallery() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState('updated');
  const [page, setPage]       = useState(1);
  const [totalPages, setTotal] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await gallery.list({ search, sort, page, limit: 12 });
      setItems(data.items);
      setTotal(data.pages);
    } catch { toast.error('Failed to load gallery'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, sort, page]);

  const dupToMine = async (id) => {
    if (!user) { navigate('/login'); return; }
    try {
      await projectsAPI.duplicate(id);
      toast.success('Added to your projects!');
    } catch { toast.error('Failed to copy'); }
  };

  const star = async (id) => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await projectsAPI.star(id);
      setItems(items.map(i => i.id === id ? { ...i, stars: i.stars + (data.starred ? 1 : -1) } : i));
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-bg0 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg2/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate(user ? '/dashboard' : '/')} className="flex items-center gap-1.5 text-t2 hover:text-t1 text-sm transition-colors">
            <ArrowLeft size={14}/> Back
          </button>
          <div className="flex items-center gap-2 mx-4">
            <Globe size={15} className="text-acc"/>
            <span className="font-display font-bold">Public Gallery</span>
          </div>
          <div className="flex-1 max-w-xs relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search loading screens..."
              className="w-full h-8 pl-8 pr-3 bg-bg3 border border-white/[0.07] rounded-lg text-xs text-t1 outline-none focus:border-acc transition-colors"/>
          </div>
          <div className="ml-auto flex gap-2">
            {['updated','stars'].map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${sort===s?'bg-acc text-white':'text-t2 hover:text-t1 bg-bg3'}`}>
                {s === 'stars' ? '⭐ Top Rated' : '🕐 Recent'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Community Gallery</h1>
          <p className="text-t2 text-sm mt-1">Discover and remix loading screens made by the community</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-acc"/></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-t3">
            <Globe size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="font-semibold text-t2">No public loading screens yet</p>
            <p className="text-sm mt-1">Be the first to publish one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
                className="group bg-bg2 border border-white/[0.07] hover:border-acc/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <div className="h-36 flex items-center justify-center relative overflow-hidden bg-bg1">
                  {item.thumbnail
                    ? <img src={item.thumbnail} className="w-full h-full object-cover"/>
                    : <span className="text-4xl opacity-40">🎬</span>}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg2/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2">
                    <button onClick={() => star(item.id)} className="w-7 h-7 bg-white/10 hover:bg-yellow-500/20 rounded-lg flex items-center justify-center transition-colors">
                      <Star size={12} className="text-yellow-400"/>
                    </button>
                    <button onClick={() => dupToMine(item.id)} className="w-7 h-7 bg-white/10 hover:bg-acc/40 rounded-lg flex items-center justify-center transition-colors">
                      <Copy size={12} className="text-acc2"/>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-sm mb-1 truncate">{item.name}</div>
                  <div className="flex items-center gap-2">
                    {item.owner_avatar
                      ? <img src={item.owner_avatar} className="w-4 h-4 rounded-full"/>
                      : <div className="w-4 h-4 rounded-full bg-acc/30 text-[8px] flex items-center justify-content font-bold text-acc">{item.owner?.[0]?.toUpperCase()}</div>}
                    <span className="text-xs text-t3">{item.owner}</span>
                    <div className="ml-auto flex items-center gap-2 text-[11px] text-t3">
                      {item.stars > 0 && <span className="flex items-center gap-0.5"><Star size={10}/>{item.stars}</span>}
                      {item.views > 0 && <span className="flex items-center gap-0.5"><Eye size={10}/>{item.views}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${page===p?'bg-acc text-white':'bg-bg3 text-t2 hover:bg-bg4'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
