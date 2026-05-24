import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import { AssignmentModel } from '../models/Assignment';
import { redis } from '../lib/redis';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const url = new URL(redisUrl.startsWith('redis://') ? redisUrl : `redis://${redisUrl}`);
const connection = { host: url.hostname, port: parseInt(url.port || '6379') };

const assessmentQueue = new Queue('assessment-generation', { connection });

// Create assignment & queue job
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Validation
    if (!body.title || !body.subject || !body.gradeLevel) {
      return res.status(400).json({ error: 'Title, subject, and grade level are required' });
    }
    if (!body.totalMarks || parseInt(body.totalMarks) <= 0) {
      return res.status(400).json({ error: 'Total marks must be a positive number' });
    }
    if (!body.numberOfQuestions || parseInt(body.numberOfQuestions) <= 0) {
      return res.status(400).json({ error: 'Number of questions must be positive' });
    }

    let fileContent = '';
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        fileContent = parsed.text;
      } else {
        fileContent = req.file.buffer.toString('utf-8');
      }
    }

    const assignmentData = {
      title: body.title,
      subject: body.subject,
      gradeLevel: body.gradeLevel,
      dueDate: body.dueDate,
      totalMarks: parseInt(body.totalMarks),
      numberOfQuestions: parseInt(body.numberOfQuestions),
      questionTypes: Array.isArray(body.questionTypes) ? body.questionTypes : [body.questionTypes || 'MCQ'],
      difficulty: body.difficulty || 'mixed',
      additionalInstructions: body.additionalInstructions,
      fileContent,
      status: 'pending' as const,
    };

    const assignment = new AssignmentModel(assignmentData);
    await assignment.save();

    // Add to BullMQ queue
    const job = await assessmentQueue.add('generate', {
      assignmentId: assignment._id.toString(),
      assignmentData,
    });

    await AssignmentModel.findByIdAndUpdate(assignment._id, { jobId: job.id });

    res.json({
      success: true,
      assignmentId: assignment._id,
      jobId: job.id,
      message: 'Assignment created and queued for processing',
    });
  } catch (err: any) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get assignment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Check Redis cache first
    const cached = await redis.get(`assignment:${req.params.id}`);
    if (cached) return res.json(JSON.parse(cached));

    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Cache completed assignments
    if (assignment.status === 'completed') {
      await redis.setex(`assignment:${req.params.id}`, 3600, JSON.stringify(assignment));
    }

    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await AssignmentModel.find({}, '-result').sort({ createdAt: -1 }).limit(20);
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
