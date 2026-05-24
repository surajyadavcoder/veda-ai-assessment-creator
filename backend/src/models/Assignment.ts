import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: Date;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  difficulty: string;
  additionalInstructions: string;
  topics: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId: string;
  result: any;
  createdAt: Date;
}

const AssignmentSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  dueDate: { type: Date, required: true },
  questionTypes: [{ type: String }],
  numberOfQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  difficulty: { type: String, required: true },
  additionalInstructions: { type: String, default: '' },
  topics: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  jobId: { type: String },
  result: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
