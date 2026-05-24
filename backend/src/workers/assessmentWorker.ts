import { Worker, Job } from 'bullmq';
import Groq from 'groq-sdk';
import { AssignmentModel } from '../models/Assignment';
import { notifyClient } from '../lib/websocket';
import { connectDB } from '../lib/db';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const url = new URL(redisUrl.startsWith('redis://') ? redisUrl : `redis://${redisUrl}`);
const connection = { host: url.hostname, port: parseInt(url.port || '6379') };

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(data: any): string {
  return `You are an expert teacher creating a structured exam question paper.

Assignment Details:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Title: ${data.title}
- Total Marks: ${data.totalMarks}
- Total Questions: ${data.numberOfQuestions}
- Question Types: ${data.questionTypes.join(', ')}
- Difficulty: ${data.difficulty}
- Additional Instructions: ${data.additionalInstructions || 'None'}
${data.fileContent ? `- Reference Content: ${data.fileContent.substring(0, 500)}` : ''}

Create a structured question paper. Return ONLY valid JSON in this exact format:
{
  "title": "${data.title}",
  "subject": "${data.subject}",
  "gradeLevel": "${data.gradeLevel}",
  "totalMarks": ${data.totalMarks},
  "duration": "2 Hours",
  "sections": [
    {
      "id": "section-a",
      "title": "Section A",
      "instruction": "Attempt all questions",
      "totalMarks": 20,
      "questions": [
        {
          "id": "q1",
          "text": "Question text here",
          "type": "MCQ",
          "difficulty": "Easy",
          "marks": 2,
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ]
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Rules:
- Distribute ${data.numberOfQuestions} questions across sections based on types
- MCQ questions must have exactly 4 options
- Short Answer and Long Answer should NOT have options
- difficulty must be exactly: Easy, Moderate, or Hard
- Make questions relevant to ${data.subject} for grade ${data.gradeLevel}
- Total marks of all questions must equal ${data.totalMarks}`;
}

async function processJob(job: Job) {
  const { assignmentId, assignmentData } = job.data;

  try {
    await connectDB();

    // Update status to processing
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'processing' });
    notifyClient(job.id as string, { type: 'status', status: 'processing', progress: 20 });

    notifyClient(job.id as string, { type: 'status', status: 'processing', progress: 50, message: 'Generating questions...' });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(assignmentData) }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawContent = completion.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const questionPaper = JSON.parse(jsonMatch[0]);

    notifyClient(job.id as string, { type: 'status', status: 'processing', progress: 80, message: 'Saving results...' });

    // Save result
    const updated = await AssignmentModel.findByIdAndUpdate(
      assignmentId,
      { status: 'completed', result: questionPaper },
      { new: true }
    );

    notifyClient(job.id as string, {
      type: 'completed',
      status: 'completed',
      progress: 100,
      result: questionPaper,
      assignmentId,
    });

    return questionPaper;
  } catch (err: any) {
    console.error('Worker error:', err);
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'failed' });
    notifyClient(job.id as string, { type: 'error', status: 'failed', message: err.message });
    throw err;
  }
}

connectDB().then(() => {
  const worker = new Worker('assessment-generation', processJob, { connection });
  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
  console.log('Assessment worker started');
});
