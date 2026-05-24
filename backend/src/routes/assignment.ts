import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';
import Assignment from '../models/Assignment';
import { AssignmentInput } from '../types';

const router = Router();

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL, enableAutoPipelining: true };
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_HOST ? {} : undefined,
  };
};

const queue = new Queue('question-generation', { connection: getRedisConnection() as any });

router.post('/', async (req: Request, res: Response) => {
  try {
    const input: AssignmentInput = req.body;
    if (!input.title || !input.subject || !input.gradeLevel) {
      return res.status(400).json({ error: 'Title, subject, and grade level are required' });
    }
    if (!input.numberOfQuestions || input.numberOfQuestions < 1) {
      return res.status(400).json({ error: 'Number of questions must be at least 1' });
    }
    if (!input.totalMarks || input.totalMarks < 1) {
      return res.status(400).json({ error: 'Total marks must be at least 1' });
    }
    if (!input.questionTypes || input.questionTypes.length === 0) {
      return res.status(400).json({ error: 'Select at least one question type' });
    }
    const assignment = new Assignment({ ...input, status: 'pending' });
    await assignment.save();
    const job = await queue.add('generate-questions', {
      assignmentId: assignment._id.toString(),
      input,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });
    res.status(201).json({
      success: true,
      assignmentId: assignment._id,
      jobId: job.id,
      message: 'Assignment created. Generating question paper...',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 }).limit(20);
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await queue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const state = await job.getState();
    res.json({ jobId: job.id, status: state, progress: job.progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
