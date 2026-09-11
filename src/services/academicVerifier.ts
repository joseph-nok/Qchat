export interface AcademicVerificationResult {
  isAcademic: boolean;
  titleOk: boolean;
  detailsOk: boolean;
  reason: string;
}

/**
 * Evaluates both the title and details together using the Mercury 2 API.
 * A question is academic ONLY if BOTH parts are meaningful academic content.
 * Reject casual greetings, one-word answers, random chat, gossip, spam, memes,
 * or vague statements even if the title looks academic.
 */
export async function verifyAcademicQuestion(
  title: string,
  details: string
): Promise<AcademicVerificationResult> {
  const fallbackResult: AcademicVerificationResult = {
    isAcademic: true,
    titleOk: true,
    detailsOk: true,
    reason: 'Verification unavailable',
  };

  try {
    const apiKey = import.meta.env?.VITE_MERCURY_KEY;
    if (!apiKey) {
      console.warn('[AcademicVerifier] VITE_MERCURY_KEY is missing. Falling back.');
      return fallbackResult;
    }

    const combinedPayload = `Title: ${title.trim()}\nDetails: ${details.trim()}`;

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
              'You are an academic moderator. Evaluate BOTH the title and details. A question is academic ONLY if BOTH parts are meaningful academic content about coursework, university subjects, exams, assignments, or academic concepts. Reject casual greetings, one-word answers, random chat, gossip, spam, memes, or vague statements even if the title looks academic. Return ONLY JSON: {"isAcademic": true/false, "titleOk": true/false, "detailsOk": true/false, "reason": "..."}.',
          },
          {
            role: 'user',
            content: combinedPayload,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(`[AcademicVerifier] API error status ${response.status}: ${response.statusText}`);
      return fallbackResult;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return fallbackResult;
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback regex parsing if JSON was cut off
      const academicMatch = content.match(/"isAcademic"\s*:\s*(true|false)/i);
      const titleOkMatch = content.match(/"titleOk"\s*:\s*(true|false)/i);
      const detailsOkMatch = content.match(/"detailsOk"\s*:\s*(true|false)/i);
      const reasonMatch = content.match(/"reason"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/i);
      if (academicMatch || titleOkMatch || detailsOkMatch) {
        parsed = {
          isAcademic: academicMatch ? academicMatch[1].toLowerCase() === 'true' : undefined,
          titleOk: titleOkMatch ? titleOkMatch[1].toLowerCase() === 'true' : undefined,
          detailsOk: detailsOkMatch ? detailsOkMatch[1].toLowerCase() === 'true' : undefined,
          reason: reasonMatch ? reasonMatch[1].replace(/\\"/g, '"') : '',
        };
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return fallbackResult;
    }

    const titleOk = typeof parsed.titleOk === 'boolean' ? parsed.titleOk : true;
    const detailsOk = typeof parsed.detailsOk === 'boolean' ? parsed.detailsOk : true;
    const isAcademic =
      parsed.isAcademic === false || !titleOk || !detailsOk ? false : true;
    const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';

    return {
      isAcademic,
      titleOk: isAcademic ? true : titleOk,
      detailsOk: isAcademic ? true : detailsOk,
      reason,
    };
  } catch (error) {
    console.warn('[AcademicVerifier] Unexpected error during verification:', error);
    return fallbackResult;
  }
}
