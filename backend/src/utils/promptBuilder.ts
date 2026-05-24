import { AssignmentInput } from '../types';

export function buildPrompt(input: AssignmentInput): string {
  const types = input.questionTypes.join(', ');
  return `You are an expert teacher. Create a structured question paper with EXACTLY this JSON format.

Assignment Details:
- Subject: ${input.subject}
- Grade: ${input.gradeLevel}
- Total Questions: ${input.numberOfQuestions}
- Total Marks: ${input.totalMarks}
- Difficulty: ${input.difficulty}
- Question Types: ${types}
- Topics: ${input.topics || input.subject}
- Instructions: ${input.additionalInstructions || 'Standard exam format'}

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "title": "${input.title}",
  "subject": "${input.subject}",
  "totalMarks": ${input.totalMarks},
  "duration": 60,
  "sections": [
    {
      "id": "section-a",
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "id": "q1",
          "text": "Question text here",
          "difficulty": "easy",
          "marks": 2,
          "type": "short"
        }
      ],
      "totalMarks": 20
    }
  ]
}

Rules:
1. Create 2-3 sections based on difficulty
2. Distribute ${input.numberOfQuestions} questions across sections
3. Total marks must equal ${input.totalMarks}
4. Use difficulty: easy, medium, or hard only
5. Use type: mcq, short, long, or truefalse only
6. Return ONLY the JSON object, nothing else`;
}
