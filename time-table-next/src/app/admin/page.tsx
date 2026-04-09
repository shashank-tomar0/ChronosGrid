"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus({ type: 'idle', message: 'Initiating Excel Scan...' });

    try {
      const response = await fetch('/api/sync-excel', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'System Synced. Latest timetable data is now live.' });
      } else {
        setStatus({ type: 'error', message: `Sync Failed: ${data.error || 'Unknown error'}` });
      }
    } catch (_err) {
      setStatus({ type: 'error', message: 'Network Error: Could not connect to the sync engine.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink p-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full border border-grid bg-surface/50 backdrop-blur-xl p-12 relative overflow-hidden"
      >
        {/* Decorative Grid */}
        <div className="absolute top-0 right-0 w-32 h-32 border-l border-b border-grid pointer-events-none opacity-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-r border-t border-grid pointer-events-none opacity-20" />

        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-huge font-display text-copper uppercase leading-none tracking-tighter mb-4">
            Terminal
          </h1>
          <p className="text-muted font-sans uppercase tracking-[0.2em] text-xs">
            Data Orchestration & Sync Engine
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`group relative overflow-hidden px-8 py-4 border border-copper/50 hover:border-copper transition-all duration-500 ${isSyncing ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
            >
              <span className={`relative z-10 font-sans uppercase tracking-widest text-sm text-copper group-hover:text-ink transition-colors duration-500`}>
                {isSyncing ? 'Executing Scan...' : 'Trigger Global Re-Sync'}
              </span>
              <motion.div 
                className="absolute inset-0 bg-copper -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
              />
            </button>
            <p className="text-[10px] font-sans text-muted uppercase tracking-widest italic">
              Warning: This will overwrite the current live database with the latest contents of &quot;Individual TT Format.xlsx&quot;
            </p>
          </div>

          <AnimatePresence mode="wait">
            {status.message && (
              <motion.div
                key={status.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-6 border ${status.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : status.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-surface2 border-grid text-muted'} text-xs font-mono uppercase tracking-widest`}
              >
                <div className="flex items-start gap-4">
                  <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                  <span>{status.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-grid text-[10px] font-sans text-muted uppercase tracking-widest flex justify-between">
          <span>Engine Status: Active</span>
          <span className="text-copper">v2.0.4-live</span>
        </motion.div>
      </motion.div>
    </main>
  );
}

// End of Admin Page

