export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: 'mcq' | 'short' | 'long' | 'truefalse';
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  duration: number;
  sections: Section[];
  createdAt: Date;
}

export interface AssignmentInput {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  difficulty: string;
  additionalInstructions?: string;
  topics?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: QuestionPaper;
  error?: string;
}
