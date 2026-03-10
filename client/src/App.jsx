import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage     from './pages/AuthPage';
import Dashboard    from './pages/Dashboard';
import Editor       from './pages/Editor';
import Gallery      from './pages/Gallery';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<AuthPage />} />
          <Route path="/gallery"         element={<Gallery />} />
          <Route path="/dashboard"       element={<Protected><Dashboard /></Protected>} />
          <Route path="/editor/:id"      element={<Protected><Editor /></Protected>} />
          <Route path="/"                element={<Navigate to="/dashboard" replace />} />
          <Route path="*"                element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#16162c', color: '#f0f0ff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' },
          success: { iconTheme: { primary: '#2dd4a3', secondary: '#16162c' } },
          error:   { iconTheme: { primary: '#ff4757', secondary: '#16162c' } },
        }}
      />
    </AuthProvider>
  );
}

export default App;
