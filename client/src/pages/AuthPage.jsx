import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../utils/api';

export default function AuthPage() {
  const [mode, setMode]     = useState('login');
  const [email, setEmail]   = useState('');
  const [username, setUser] = useState('');
  const [password, setPass] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);
  useEffect(() => {
    if (params.get('expired')) toast.error('Session expired. Please log in again.');
    if (params.get('mode') === 'register') setMode('register');
  }, [params]);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data } = await auth.register({ username, email, password });
        login(data.token, data.user);
        toast.success(`Welcome to ScreenForge, ${data.user.username}! 🎬`);
        navigate('/dashboard');
      } else {
        const { data } = await auth.login({ email, password });
        login(data.token, data.user);
        toast.success(`Welcome back, ${data.user.username}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-acc opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-acc3 opacity-5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-acc to-acc3 flex items-center justify-center text-xl">🎬</div>
            <span className="font-display text-3xl font-black tracking-tight">
              <span className="text-acc2">Screen</span>Forge
            </span>
          </div>
          <p className="text-t2 text-sm">Visual FiveM Loading Screen Builder</p>
        </div>

        <div className="bg-bg2 border border-white/[0.07] rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-bg1 rounded-xl p-1 mb-7">
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all ${mode===m ? 'bg-acc text-white shadow-lg' : 'text-t2 hover:text-t1'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div key="username" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                  <label className="block text-xs font-semibold text-t2 uppercase tracking-wider mb-1.5">Username</label>
                  <input value={username} onChange={e=>setUser(e.target.value)} required
                    minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+"
                    placeholder="your_username"
                    className="w-full h-10 px-3 bg-bg1 border border-white/[0.08] rounded-lg text-sm text-t1 outline-none focus:border-acc transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-semibold text-t2 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full h-10 px-3 bg-bg1 border border-white/[0.08] rounded-lg text-sm text-t1 outline-none focus:border-acc transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-t2 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e=>setPass(e.target.value)} required
                  minLength={6} placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 bg-bg1 border border-white/[0.08] rounded-lg text-sm text-t1 outline-none focus:border-acc transition-colors" />
                <button type="button" onClick={() => setShowPw(v=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-t3 hover:text-t2">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 bg-acc hover:bg-acc2 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-acc/20 mt-2">
              {loading ? <Loader2 size={16} className="animate-spin"/> : mode==='login' ? <LogIn size={16}/> : <UserPlus size={16}/>}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-t3 mt-5">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode==='login'?'register':'login')} className="text-acc2 hover:underline font-medium">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
