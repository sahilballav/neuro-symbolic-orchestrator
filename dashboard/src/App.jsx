import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Activity, Terminal, Cpu } from 'lucide-react';

export default function App() {
  const [verdicts, setVerdicts] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, blocked: 0 });

  useEffect(() => {
    // Connect directly to the Spring Boot Server-Sent Events bridge
    const eventSource = new EventSource('http://localhost:8080/api/stream');

    eventSource.addEventListener('verdict', (event) => {
      const newVerdict = JSON.parse(event.data);
      
      setVerdicts((prev) => [newVerdict, ...prev].slice(0, 20)); // Keep last 20 events
      setStats((prev) => {
        const isApproved = newVerdict.action === 'PERMIT_AND_SIGN';
        return {
          total: prev.total + 1,
          approved: prev.approved + (isApproved ? 1 : 0),
          blocked: prev.blocked + (isApproved ? 0 : 1),
        };
      });
    });

    return () => eventSource.close();
  }, []);

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '24px', fontFamily: 'monospace' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={28} /> ENGO ARCHITECTURE // ZERO-TRUST COMMAND CENTER
          </h1>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Real-time Neuro-Symbolic Validation Streams</p>
        </div>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}><span>Total Scanned</span><Activity size={20} /></div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#f3f4f6' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}><span>Permitted & Signed</span><ShieldCheck size={20} /></div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#10b981' }}>{stats.approved}</div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Quarantined / Dropped</span><ShieldAlert size={20} /></div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#ef4444' }}>{stats.blocked}</div>
        </div>
      </div>

      {/* Main Stream Display */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
        <h2 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={16} /> LIVE DEPLOYMENT TELEMETRY
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
          <AnimatePresence initial={false}>
            {verdicts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
                Awaiting edge agent transactions... Publish payloads via the Kafka producer to trigger validation.
              </div>
            ) : (
              verdicts.map((v) => {
                const isApproved = v.action === 'PERMIT_AND_SIGN';
                return (
                  <motion.div
                    key={v.orchestrator_txn_id}
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    style={{
                      borderLeft: `4px solid ${isApproved ? '#10b981' : '#ef4444'}`,
                      backgroundColor: '#1f2937',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px', color: '#9ca3af' }}>{v.orchestrator_txn_id}</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>{v.source_node} → {v.target_node}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>{v.reason}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isApproved ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                      {isApproved ? <Shield size={16} /> : <ShieldAlert size={16} />}
                      {v.action}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}