/**
 * DEPRECATED: Direct Gemini API calls have been moved to the backend.
 * 
 * This file is kept for backward compatibility but all resume processing
 * functionality has been migrated to backend API endpoints:
 * - /api/analyze-resume
 * - /api/extract-resume
 * - /api/tailor-resume
 * - /api/ats-score
 * - /api/parse-job
 * - /api/generate-cover-letter
 * - /api/check-completeness
 * 
 * Frontend components should use apiClient from @/services/api instead.
 */

// Utility function for retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = lastError.message;

      // Only retry on 503 (overloaded) or 429 (rate limit) errors
      if (!errorMsg.includes("503") && !errorMsg.includes("429")) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(
          `API overloaded (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Max retry attempts exceeded");
}
