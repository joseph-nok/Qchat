export interface AcademicVerificationResult {
  isAcademic: boolean;
  reason: string;
}

/**
 * Verifies whether a student question is academic using the Mercury 2 API.
 * Academic questions: coursework, university subjects, exams, assignments.
 * Non-academic questions: casual chat, gossip, spam, memes.
 *
 * On any API or network error, falls back to isAcademic: true so student questions are never blocked.
 */
export async function verifyAcademicQuestion(
  questionText: string
): Promise<AcademicVerificationResult> {
  const fallbackResult: AcademicVerificationResult = {
    isAcademic: true,
    reason: '',
  };

  try {
    const apiKey = import.meta.env?.VITE_MERCURY_KEY;
    if (!apiKey) {
      console.warn('[AcademicVerifier] VITE_MERCURY_KEY is missing. Defaulting to academic approval.');
      return fallbackResult;
    }

    const trimmedQuestion = questionText?.trim();
    if (!trimmedQuestion) {
      return fallbackResult;
    }

    const response = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mercury-2',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI academic moderator. Evaluate if the question is academic. Academic questions = coursework, university subjects, exams, assignments; non-academic = casual chat, gossip, spam, memes. Return ONLY JSON: {"isAcademic": true/false, "reason": "..."}.',
          },
          {
            role: 'user',
            content: trimmedQuestion,
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(`[AcademicVerifier] API returned status ${response.status}: ${response.statusText}`);
      return fallbackResult;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return fallbackResult;
    }

    let parsed: { isAcademic?: boolean; reason?: string } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback parser in case response was truncated by token limit
      const academicMatch = content.match(/"isAcademic"\s*:\s*(true|false)/i);
      const reasonMatch = content.match(/"reason"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/i);
      if (academicMatch) {
        parsed = {
          isAcademic: academicMatch[1].toLowerCase() === 'true',
          reason: reasonMatch ? reasonMatch[1].replace(/\\"/g, '"') : '',
        };
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return fallbackResult;
    }

    if (parsed.isAcademic === false) {
      return {
        isAcademic: false,
        reason:
          typeof parsed.reason === 'string' && parsed.reason.trim()
            ? parsed.reason.trim()
            : 'This question was flagged as non-academic. Please ensure your post is related to coursework, university subjects, exams, or assignments.',
      };
    }

    return {
      isAcademic: true,
      reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : '',
    };
  } catch (error) {
    console.warn('[AcademicVerifier] Failed to verify question, falling back to approve:', error);
    return fallbackResult;
  }
}
