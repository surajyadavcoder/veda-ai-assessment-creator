'use client';
import { useAssignmentStore } from '@/store/assignmentStore';
import AssignmentForm from '@/components/AssignmentForm';
import GeneratingView from '@/components/GeneratingView';
import QuestionPaperView from '@/components/QuestionPaperView';

export default function Home() {
  const { currentStep } = useAssignmentStore();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 800 }}>V</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>VedaAI</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>AI Assessment Creator</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {(['form', 'generating', 'result'] as const).map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: currentStep === step ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : i < (['form','generating','result'] as const).indexOf(currentStep) ? '#10b981' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: currentStep === step ? '#6366f1' : '#94a3b8', fontWeight: currentStep === step ? 600 : 400 }}>
                  {step === 'form' ? 'Create' : step === 'generating' ? 'Generate' : 'View'}
                </span>
                {i < 2 && <div style={{ width: 20, height: 1, background: '#e2e8f0' }} />}
              </div>
            ))}
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {currentStep === 'form' && <AssignmentForm />}
        {currentStep === 'generating' && <GeneratingView />}
        {currentStep === 'result' && <QuestionPaperView />}
      </main>
    </div>
  );
}
