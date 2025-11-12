import { QUESTION_KEYWORDS } from "@shared/schema";

/**
 * Detect if text is a question based on keywords
 * Matches the Python script's logic
 */
export function isQuestion(text: string): boolean {
  if (!text || text.length < 10) {
    return false;
  }

  const textLower = text.toLowerCase().trim();

  // Check for question keywords
  for (const keyword of QUESTION_KEYWORDS) {
    if (textLower.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate audio volume from analyser data
 */
export function calculateVolume(dataArray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  return sum / dataArray.length;
}

/**
 * Format elapsed time in HH:MM:SS
 */
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Send transcription to webhook
 */
export async function sendToWebhook(
  webhookUrl: string,
  text: string,
  questionNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      question_number: questionNumber,
      type: "interview_question" as const,
      text: text,
      word_count: text.split(/\s+/).length,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `Webhook returned ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
