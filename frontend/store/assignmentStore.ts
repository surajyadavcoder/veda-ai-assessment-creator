import { create } from 'zustand';
import { AssignmentForm, JobStatus, QuestionPaper } from '@/types';

interface AssignmentStore {
  form: AssignmentForm;
  jobId: string | null;
  assignmentId: string | null;
  jobStatus: JobStatus | null;
  questionPaper: QuestionPaper | null;
  currentStep: 'form' | 'generating' | 'result';
  
  setForm: (form: Partial<AssignmentForm>) => void;
  setJobId: (jobId: string) => void;
  setAssignmentId: (id: string) => void;
  setJobStatus: (status: JobStatus) => void;
  setQuestionPaper: (paper: QuestionPaper) => void;
  setCurrentStep: (step: 'form' | 'generating' | 'result') => void;
  reset: () => void;
}

const defaultForm: AssignmentForm = {
  title: '',
  subject: '',
  gradeLevel: '',
  dueDate: '',
  questionTypes: [],
  numberOfQuestions: 10,
  totalMarks: 50,
  difficulty: 'medium',
  additionalInstructions: '',
  topics: '',
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  form: defaultForm,
  jobId: null,
  assignmentId: null,
  jobStatus: null,
  questionPaper: null,
  currentStep: 'form',

  setForm: (data) => set((state) => ({ form: { ...state.form, ...data } })),
  setJobId: (jobId) => set({ jobId }),
  setAssignmentId: (assignmentId) => set({ assignmentId }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
  setQuestionPaper: (questionPaper) => set({ questionPaper }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () => set({ form: defaultForm, jobId: null, assignmentId: null, jobStatus: null, questionPaper: null, currentStep: 'form' }),
}));
