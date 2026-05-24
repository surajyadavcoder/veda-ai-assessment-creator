'use client';
import { useState } from 'react';
import axios from 'axios';
import { useAssignmentStore } from '@/store/assignmentStore';
import { wsClient } from '@/lib/websocket';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple Choice (MCQ)' },
  { id: 'short', label: 'Short Answer' },
  { id: 'long', label: 'Long Answer' },
  { id: 'truefalse', label: 'True / False' },
];

const GRADE_LEVELS = ['Grade 1-5', 'Grade 6-8', 'Grade 9-10', 'Grade 11-12', 'Undergraduate', 'Postgraduate'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];
const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'English', 'Computer Science', 'Economics', 'Other'];

export default function AssignmentForm() {
  const { form, setForm, setJobId, setAssignmentId, setCurrentStep } = useAssignmentStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.gradeLevel) e.gradeLevel = 'Grade level is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (form.questionTypes.length === 0) e.questionTypes = 'Select at least one question type';
    if (!form.numberOfQuestions || form.numberOfQuestions < 1) e.numberOfQuestions = 'Must be at least 1';
    if (!form.totalMarks || form.totalMarks < 1) e.totalMarks = 'Must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleType = (id: string) => {
    const types = form.questionTypes.includes(id)
      ? form.questionTypes.filter(t => t !== id)
      : [...form.questionTypes, id];
    setForm({ questionTypes: types });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      wsClient.connect();
      const res = await axios.post(`${API}/assignments`, form);
      const { jobId, assignmentId } = res.data;
      setJobId(jobId);
      setAssignmentId(assignmentId);
      wsClient.subscribe(jobId);
      setCurrentStep('generating');
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create assignment' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => ({
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1.5px solid ${errors[field] ? '#f43f5e' : '#e2e8f0'}`,
    fontSize: 14, outline: 'none', background: '#fff',
    transition: 'border-color 0.2s',
  });

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' };
  const errorStyle = { fontSize: 12, color: '#f43f5e', marginTop: 4 };

  return (
    <div>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', letterSpacing: -0.5, marginBottom: 8 }}>
          Create AI Assessment
        </h1>
        <p style={{ color: '#64748b', fontSize: 16 }}>
          Fill in the details below and AI will generate a complete question paper
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Main Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Basic Info */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', color: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>1</span>
              Basic Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Assignment Title *</label>
                <input value={form.title} onChange={e => setForm({ title: e.target.value })}
                  placeholder="e.g. Mid-Term Mathematics Exam"
                  style={inputStyle('title')}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = errors.title ? '#f43f5e' : '#e2e8f0'}
                />
                {errors.title && <div style={errorStyle}>{errors.title}</div>}
              </div>
              <div>
                <label style={labelStyle}>Subject *</label>
                <select value={form.subject} onChange={e => setForm({ subject: e.target.value })} style={inputStyle('subject')}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subject && <div style={errorStyle}>{errors.subject}</div>}
              </div>
              <div>
                <label style={labelStyle}>Grade Level *</label>
                <select value={form.gradeLevel} onChange={e => setForm({ gradeLevel: e.target.value })} style={inputStyle('gradeLevel')}>
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.gradeLevel && <div style={errorStyle}>{errors.gradeLevel}</div>}
              </div>
              <div>
                <label style={labelStyle}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  style={inputStyle('dueDate')} />
                {errors.dueDate && <div style={errorStyle}>{errors.dueDate}</div>}
              </div>
              <div>
                <label style={labelStyle}>Topics / Chapters</label>
                <input value={form.topics} onChange={e => setForm({ topics: e.target.value })}
                  placeholder="e.g. Algebra, Geometry, Trigonometry"
                  style={inputStyle('topics')} />
              </div>
            </div>
          </div>

          {/* Question Settings */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', color: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>2</span>
              Question Settings
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Question Types * (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {QUESTION_TYPES.map(qt => (
                  <button key={qt.id} onClick={() => toggleType(qt.id)} style={{
                    padding: '8px 16px', borderRadius: 8,
                    border: `1.5px solid ${form.questionTypes.includes(qt.id) ? '#6366f1' : '#e2e8f0'}`,
                    background: form.questionTypes.includes(qt.id) ? '#ede9fe' : '#fff',
                    color: form.questionTypes.includes(qt.id) ? '#6366f1' : '#64748b',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}>
                    {form.questionTypes.includes(qt.id) ? '✓ ' : ''}{qt.label}
                  </button>
                ))}
              </div>
              {errors.questionTypes && <div style={errorStyle}>{errors.questionTypes}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Number of Questions *</label>
                <input type="number" value={form.numberOfQuestions}
                  onChange={e => setForm({ numberOfQuestions: parseInt(e.target.value) || 0 })}
                  min={1} max={100} style={inputStyle('numberOfQuestions')} />
                {errors.numberOfQuestions && <div style={errorStyle}>{errors.numberOfQuestions}</div>}
              </div>
              <div>
                <label style={labelStyle}>Total Marks *</label>
                <input type="number" value={form.totalMarks}
                  onChange={e => setForm({ totalMarks: parseInt(e.target.value) || 0 })}
                  min={1} style={inputStyle('totalMarks')} />
                {errors.totalMarks && <div style={errorStyle}>{errors.totalMarks}</div>}
              </div>
              <div>
                <label style={labelStyle}>Difficulty Level</label>
                <select value={form.difficulty} onChange={e => setForm({ difficulty: e.target.value })} style={inputStyle('difficulty')}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', color: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>3</span>
              Additional Instructions
            </div>
            <textarea value={form.additionalInstructions}
              onChange={e => setForm({ additionalInstructions: e.target.value })}
              placeholder="Any special instructions, focus areas, or requirements for the AI..."
              rows={4}
              style={{ ...inputStyle('additionalInstructions'), resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {errors.submit && (
            <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 14 }}>
              {errors.submit}
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ alignSelf: 'flex-end', padding: '14px 36px', fontSize: 16 }}>
            {loading ? 'Creating...' : 'Generate Question Paper with AI'}
          </button>
        </div>

        {/* Preview Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 16 }}>Preview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Title', value: form.title || 'Not set' },
                { label: 'Subject', value: form.subject || 'Not set' },
                { label: 'Grade', value: form.gradeLevel || 'Not set' },
                { label: 'Questions', value: form.numberOfQuestions },
                { label: 'Total Marks', value: form.totalMarks },
                { label: 'Difficulty', value: form.difficulty },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', maxWidth: 150, textAlign: 'right', wordBreak: 'break-word' }}>{item.value}</span>
                </div>
              ))}
              {form.questionTypes.length > 0 && (
                <div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Question Types</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {form.questionTypes.map(t => (
                      <span key={t} style={{ padding: '2px 8px', background: '#ede9fe', color: '#6366f1', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #ede9fe, #faf5ff)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6366f1', marginBottom: 10 }}>How it works</div>
            {['Fill in assignment details', 'AI generates structured questions', 'Review & download PDF'].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: '#4c1d95' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
