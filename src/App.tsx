import React, { useState, useEffect, ReactNode, FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, setDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, User, Hash, Send, Shield, Loader2, AlertCircle } from 'lucide-react';

// --- Components ---

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <div className="scanline" />
    <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-10">
      <Link to="/" className="font-mono text-cyber-orange text-xl font-bold tracking-tighter flex items-center gap-2">
        <div className="w-8 h-8 border-2 border-cyber-orange flex items-center justify-center">C</div>
        CYBER_SHOWCASE
      </Link>
      <div className="flex gap-6">
        <Link to="/" className="font-mono text-sm hover:text-cyber-orange transition-colors">SUBMIT</Link>
        <Link to="/winner-list" className="font-mono text-sm hover:text-cyber-orange transition-colors flex items-center gap-1">
          <Trophy size={14} /> WINNER LIST
        </Link>
      </div>
    </nav>
    <main className="w-full max-w-2xl z-0">
      {children}
    </main>
    <footer className="fixed bottom-0 left-0 w-full p-6 text-center font-mono text-[10px] text-cyber-orange/30 uppercase tracking-[0.3em]">
      System Status: Operational // Secure Connection Established
    </footer>
  </div>
);

// --- Pages ---

const MainPage = () => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !userId) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await addDoc(collection(db, 'submissions'), {
        name,
        userId,
        timestamp: new Date().toISOString(),
      });
      setMessage({ type: 'success', text: 'SUBMISSION_RECEIVED // DATA_ENCRYPTED' });
      setName('');
      setUserId('');
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'error', text: 'SUBMISSION_FAILED // PROTOCOL_ERROR' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cyber-border bg-cyber-gray/50 backdrop-blur-xl p-8 md:p-12"
    >
      <h1 className="text-3xl mb-8 flex items-center gap-4">
        <User className="text-cyber-orange" />
        Identity Registration
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="block font-mono text-xs text-cyber-orange/70 uppercase tracking-widest">Operator Name</label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cyber-input w-full pl-10"
              placeholder="ENTER_NAME..."
              required
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-orange/50" size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-mono text-xs text-cyber-orange/70 uppercase tracking-widest">Identification Hash</label>
          <div className="relative">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="cyber-input w-full pl-10"
              placeholder="ENTER_ID..."
              required
            />
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-orange/50" size={18} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="cyber-button w-full flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
          {isSubmitting ? 'UPLOADING...' : 'TRANSMIT_DATA'}
        </button>
      </form>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-6 p-4 font-mono text-xs border ${
              message.type === 'success' ? 'border-green-500/50 text-green-400 bg-green-500/5' : 'border-red-500/50 text-red-400 bg-red-500/5'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const WinnerListPage = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'submissions'), orderBy('timestamp', 'asc'), limit(10));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
      setLoading(false);
    } catch (error) {
      console.error('Data Fetch Error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    
    // Initial fetch
    fetchData();

    // Refresh every 7 seconds
    const interval = setInterval(() => {
      console.log('REFRESHING_DATA...');
      fetchData();
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const winner = submissions.length > 0 ? submissions[0] : null;
    
    if (winner && !audioRef.current) {
      // Create and play looping sound when a winner is found
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.volume = 0.3;
      audio.loop = true;
      audio.play().catch(e => console.log('Audio playback blocked by browser:', e));
      audioRef.current = audio;
    } else if (!winner && audioRef.current) {
      // Stop sound if no winner
      audioRef.current.pause();
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [submissions]);

  const winner = submissions.length > 0 ? submissions[0] : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-cyber-orange w-12 h-12" />
        <p className="font-mono text-cyber-orange animate-pulse">SYNCING_WINNER_DATA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Winner Display */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="cyber-border bg-cyber-orange/5 p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
           <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-cyber-orange)_0%,_transparent_70%)]" />
        </div>
        
        <Trophy className="mx-auto text-cyber-orange w-16 h-16 mb-4" />
        <h2 className="text-sm text-cyber-orange/70 mb-2">Current Champion</h2>
        {winner ? (
          <motion.div
            key={winner.id}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-2"
          >
            <div className="text-5xl font-bold tracking-tighter uppercase">{winner.name}</div>
            <div className="font-mono text-xs text-cyber-orange/50">ID: {winner.userId}</div>
          </motion.div>
        ) : (
          <div className="text-2xl font-mono text-cyber-orange/30 italic">AWAITING_CHAMPION...</div>
        )}
      </motion.div>

      {/* Submissions List */}
      <div className="cyber-border bg-cyber-gray/50 backdrop-blur-xl p-6">
        <h3 className="text-lg mb-6 flex items-center gap-2">
          <Hash size={18} />
          Recent Submissions
        </h3>
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <p className="text-center font-mono text-cyber-orange/30 py-8">AWAITING_INCOMING_DATA...</p>
          ) : (
            submissions.map((sub) => (
              <motion.div 
                key={sub.id}
                layout
                className="flex items-center justify-between p-4 bg-cyber-dark/50 border border-cyber-orange/10 hover:border-cyber-orange/30 transition-colors"
              >
                <div>
                  <div className="font-bold uppercase">{sub.name}</div>
                  <div className="font-mono text-[10px] text-cyber-orange/50">ID: {sub.userId}</div>
                </div>
                {sub.id === winner?.id && (
                  <div className="text-[10px] font-mono text-cyber-orange border border-cyber-orange px-3 py-1">
                    WINNER
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/winner-list" element={<WinnerListPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
