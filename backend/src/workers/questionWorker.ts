import { Worker, Job } from 'bullmq';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Assignment from '../models/Assignment';
import { buildPrompt } from '../utils/promptBuilder';
import { notifyJob } from '../utils/wsManager';
import { AssignmentInput } from '../types';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veda-ai');

const worker = new Worker('question-generation', async (job: Job) => {
  const { assignmentId, input }: { assignmentId: string; input: AssignmentInput } = job.data;

  try {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
    notifyJob(job.id!, { status: 'processing', progress: 10, message: 'Starting AI generation...' });

    await job.updateProgress(20);
    notifyJob(job.id!, { status: 'processing', progress: 20, message: 'Building prompt...' });

    const prompt = buildPrompt(input);

    await job.updateProgress(40);
    notifyJob(job.id!, { status: 'processing', progress: 40, message: 'Generating questions with AI...' });

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
    });

    await job.updateProgress(70);
    notifyJob(job.id!, { status: 'processing', progress: 70, message: 'Parsing AI response...' });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let questionPaper;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      questionPaper = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate and fix structure
    if (!questionPaper.sections || !Array.isArray(questionPaper.sections)) {
      throw new Error('Invalid question paper structure');
    }

    questionPaper.id = assignmentId;
    questionPaper.createdAt = new Date();

    await job.updateProgress(90);
    notifyJob(job.id!, { status: 'processing', progress: 90, message: 'Saving results...' });

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      result: questionPaper,
    });

    await job.updateProgress(100);
    notifyJob(job.id!, { status: 'completed', progress: 100, message: 'Question paper ready!', result: questionPaper });

    return questionPaper;
  } catch (error: any) {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
    notifyJob(job.id!, { status: 'failed', progress: 0, message: error.message });
    throw error;
  }
}, { connection: redisConnection });

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

console.log('Question generation worker started');
