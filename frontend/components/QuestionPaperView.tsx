'use client';
import { useRef } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Question, Section } from '@/types';

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string }> = {
  easy: { bg: '#dcfce7', color: '#16a34a' },
  medium: { bg: '#fef9c3', color: '#ca8a04' },
  hard: { bg: '#fee2e2', color: '#dc2626' },
};

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ', short: 'Short', long: 'Long', truefalse: 'T/F',
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = DIFFICULTY_COLORS[difficulty] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: colors.bg, color: colors.color, textTransform: 'capitalize',
    }}>
      {difficulty}
    </span>
  );
}

function QuestionItem({ question, index }: { question: Question; index: number }) {
  return (
    <div style={{
      padding: '16px 0', borderBottom: '1px solid #f1f5f9',
      display: 'flex', gap: 16, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: '#f8fafc',
        border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#64748b',
        flexShrink: 0, marginTop: 2,
      }}>{index}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6, marginBottom: 8 }}>
          {question.text}
        </p>
        {question.options && question.options.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            {question.options.map((opt, i) => (
              <div key={i} style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 13, color: '#374151' }}>
                {String.fromCharCode(65 + i)}. {opt}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DifficultyBadge difficulty={question.difficulty} />
          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: '#ede9fe', color: '#6366f1', fontWeight: 600 }}>
            {TYPE_LABELS[question.type] || question.type}
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
            [{question.marks} mark{question.marks > 1 ? 's' : ''}]
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section, startIndex }: { section: Section; startIndex: number }) {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{section.title}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{section.instruction}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>{section.questions.length} questions</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6366f1' }}>{section.totalMarks} marks</div>
        </div>
      </div>
      <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />
      {section.questions.map((q, i) => (
        <QuestionItem key={q.id || i} question={q} index={startIndex + i} />
      ))}
    </div>
  );
}

export default function QuestionPaperView() {
  const { questionPaper, form, reset, setCurrentStep } = useAssignmentStore();
  const printRef = useRef<HTMLDivElement>(null);

  if (!questionPaper) return null;

  const handlePrint = () => window.print();

  const totalQuestions = questionPaper.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  questionPaper.sections.forEach(s => s.questions.forEach(q => {
    if (q.difficulty in diffCounts) diffCounts[q.difficulty as keyof typeof diffCounts]++;
  }));

  let qIndex = 1;

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Question Paper Generated!</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Review your AI-generated question paper below</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setCurrentStep('form')} style={{
            padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#fff', fontSize: 14, cursor: 'pointer', color: '#64748b', fontWeight: 500,
          }}>
            Create New
          </button>
          <button onClick={handlePrint} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            fontSize: 14, cursor: 'pointer', color: '#fff', fontWeight: 600,
          }}>
            Print / Download PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Questions', value: totalQuestions, color: '#6366f1' },
          { label: 'Total Marks', value: questionPaper.totalMarks, color: '#8b5cf6' },
          { label: 'Sections', value: questionPaper.sections.length, color: '#06b6d4' },
          { label: 'Easy', value: diffCounts.easy, color: '#16a34a' },
          { label: 'Medium', value: diffCounts.medium, color: '#ca8a04' },
          { label: 'Hard', value: diffCounts.hard, color: '#dc2626' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px 20px', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Question Paper */}
      <div ref={printRef}>
        {/* Header */}
        <div className="card" style={{ padding: 32, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Question Paper
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            {questionPaper.title}
          </h1>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
            Subject: {questionPaper.subject} &nbsp;|&nbsp; Total Marks: {questionPaper.totalMarks} &nbsp;|&nbsp; Duration: {questionPaper.duration} minutes
          </div>

          {/* Student Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 600, margin: '0 auto', borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            {['Name', 'Roll Number', 'Section'].map(field => (
              <div key={field} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{field}</div>
                <div style={{ borderBottom: '1.5px solid #1e293b', height: 28 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        {questionPaper.sections.map((section) => {
          const startIndex = qIndex;
          qIndex += section.questions.length;
          return <SectionBlock key={section.id} section={section} startIndex={startIndex} />;
        })}
      </div>

      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white; }
          .card { box-shadow: none; border: 1px solid #e2e8f0; }
        }
      `}</style>
    </div>
  );
}
