'use client';
import { useEffect, useState } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { wsClient } from '@/lib/websocket';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STEPS = [
  { progress: 10, label: 'Initializing AI engine...' },
  { progress: 20, label: 'Building structured prompt...' },
  { progress: 40, label: 'Generating questions with AI...' },
  { progress: 70, label: 'Parsing and validating response...' },
  { progress: 90, label: 'Saving question paper...' },
  { progress: 100, label: 'Question paper ready!' },
];

export default function GeneratingView() {
  const { jobId, assignmentId, setJobStatus, setQuestionPaper, setCurrentStep, form } = useAssignmentStore();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Starting generation...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const handler = (data: any) => {
      if (data.status === 'processing' || data.status === 'active') {
        setProgress(data.progress || 0);
        setMessage(data.message || 'Processing...');
      }
      if (data.status === 'completed' && data.result) {
        setProgress(100);
        setMessage('Question paper ready!');
        setQuestionPaper(data.result);
        setTimeout(() => setCurrentStep('result'), 800);
      }
      if (data.status === 'failed') {
        setFailed(true);
        setMessage(data.message || 'Generation failed');
      }
    };

    wsClient.on('job_update', handler);

    // Fallback polling
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/assignments/${assignmentId}`);
        if (res.data.status === 'completed' && res.data.result) {
          clearInterval(poll);
          setProgress(100);
          setQuestionPaper(res.data.result);
          setTimeout(() => setCurrentStep('result'), 500);
        }
        if (res.data.status === 'failed') {
          clearInterval(poll);
          setFailed(true);
          setMessage('Generation failed. Please try again.');
        }
      } catch {}
    }, 3000);

    // Simulate progress if WS not connected
    let simProgress = 0;
    const sim = setInterval(() => {
      simProgress += 3;
      if (simProgress <= 85) setProgress(p => Math.max(p, simProgress));
      else clearInterval(sim);
    }, 1000);

    return () => {
      wsClient.off('job_update', handler);
      clearInterval(poll);
      clearInterval(sim);
    };
  }, [jobId, assignmentId]);

  const currentStep = STEPS.findIndex(s => s.progress > progress) - 1;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: failed ? '#fef2f2' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 20px',
          animation: failed ? 'none' : 'pulse 2s infinite',
        }}>
          {failed ? '❌' : '🤖'}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
          {failed ? 'Generation Failed' : 'Generating Question Paper...'}
        </h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{progress}%</span>
        </div>
        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            height: '100%', borderRadius: 10,
            background: failed ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            width: `${progress}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.slice(0, -1).map((step, i) => {
            const done = progress >= step.progress;
            const active = progress >= step.progress && progress < (STEPS[i + 1]?.progress || 101);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#10b981' : active ? '#6366f1' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: done || active ? 'white' : '#94a3b8',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, color: done ? '#10b981' : active ? '#6366f1' : '#94a3b8', fontWeight: done || active ? 600 : 400 }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="card" style={{ padding: 20, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>GENERATING FOR</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{form.title}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          {form.subject} • {form.gradeLevel} • {form.numberOfQuestions} questions • {form.totalMarks} marks
        </div>
      </div>

      {failed && (
        <button className="btn-primary" onClick={() => setCurrentStep('form')} style={{ marginTop: 20 }}>
          Try Again
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
