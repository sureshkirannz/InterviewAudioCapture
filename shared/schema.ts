import { z } from "zod";

// Transcription entry schema
export const transcriptionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  text: z.string(),
  isQuestion: z.boolean(),
  questionNumber: z.number().optional(),
  wordCount: z.number(),
  webhookSent: z.boolean(),
  webhookSuccess: z.boolean().optional(),
  webhookError: z.string().optional(),
  duration: z.number().optional(),
});

export type Transcription = z.infer<typeof transcriptionSchema>;

// Session statistics
export interface SessionStats {
  questionsDetected: number;
  totalTranscriptions: number;
  webhookSuccessCount: number;
  webhookFailCount: number;
  sessionStartTime: Date | null;
  elapsedTime: number;
}

// Audio state
export type AudioState = "idle" | "listening" | "recording" | "processing";

// Webhook payload matching Python script format
export interface WebhookPayload {
  timestamp: string;
  question_number: number;
  type: "interview_question";
  text: string;
  word_count: number;
}

// Settings
export interface AppSettings {
  webhookUrl: string;
  silenceThreshold: number;
  silenceDuration: number;
  minSpeechDuration: number;
  maxRecordingDuration: number;
}

// Question detection keywords (from Python script)
export const QUESTION_KEYWORDS = [
  // Question words
  'what', 'when', 'where', 'why', 'how', 'who', 'which', 'whose',
  // Modal questions
  'can you', 'could you', 'would you', 'will you', 'should',
  'do you', 'did you', 'have you', 'are you', 'were you',
  // Interview specific
  'tell me', 'describe', 'explain', 'share', 'discuss',
  'walk me through', 'talk about', 'give me an example',
  'your experience', 'your approach', 'your opinion',
  'your strengths', 'your weakness', 'time when',
  'situation where', 'challenge', 'achievement',
  // Ending with ?
  '?'
];

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  webhookUrl: "https://n8n.smartbytesolutions.co.nz/webhook/interview-audio",
  silenceThreshold: 300,
  silenceDuration: 1.5,
  minSpeechDuration: 1.5,
  maxRecordingDuration: 30,
};
