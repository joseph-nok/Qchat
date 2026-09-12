export interface AcademicVerificationResult {
  isAcademic: boolean;
  titleOk: boolean;
  detailsOk: boolean;
  departmentMatch: boolean;
  topicMatch: boolean;
  reason: string;
}

const FALLBACK_RESULT: AcademicVerificationResult = {
  isAcademic: true,
  titleOk: true,
  detailsOk: true,
  departmentMatch: true,
  topicMatch: true,
  reason: 'Verification unavailable — allowing by default',
};

const SYSTEM_PROMPT = `You are a strict academic content moderator for a university Q&A platform.

You will receive a TITLE, DETAILS, a DEPARTMENT, and a USER-SELECTED TOPIC.

Judge each of the four checks independently using your general knowledge of what is academic and what is not. Do NOT rely on any fixed list of topics.

Rules:
1. titleOk = true ONLY if the TITLE names a specific, real academic subject. Pop culture, cartoons, brands, games, greetings, ads, gossip, vague single words like "Help", or meaningless strings are NOT academic. Set titleOk=false.
2. detailsOk = true ONLY if the DETAILS contain a clear academic question or problem statement that a qualified lecturer could answer. Greetings, download requests, vague one-liners, personal gossip, spam, or casual chat are NOT academic. Set detailsOk=false.
3. departmentMatch = true ONLY if the TITLE and DETAILS clearly belong to the given DEPARTMENT. If the subject belongs to a different domain (for example, biology under Computer Science, or history under Engineering), set departmentMatch=false.
4. topicMatch = true ONLY if the USER-SELECTED TOPIC is a real, specific academic topic AND the TITLE and DETAILS clearly relate to it. If the topic is a generic buzzword ("technology", "programming", "general", "misc"), is unrelated to the question, or is not a real academic topic, set topicMatch=false.
5. isAcademic = true ONLY if titleOk, detailsOk, departmentMatch, and topicMatch are ALL true.

Return ONLY this JSON object and nothing else:
{
  "isAcademic": true | false,
  "titleOk": true | false,
  "detailsOk": true | false,
  "departmentMatch": true | false,
  "topicMatch": true | false,
  "reason": "one short sentence explaining the first failing check, or 'All checks passed'"
}`;

/**
 * Evaluates TITLE, DETAILS, DEPARTMENT, and USER-SELECTED TOPIC using
 * Mercury 2's general academic knowledge — no closed topic whitelist.
 *
 * On ANY API error or missing key the function falls back to all-true so
 * a network problem never blocks a student.
 */
export async function verifyAcademicQuestion(
  title: string,
  details: string,
  department: string,
  userSelectedTopic: string,
): Promise<AcademicVerificationResult> {
  const apiKey = import.meta.env?.VITE_MERCURY_KEY;
  if (!apiKey) {
    console.warn('[AcademicVerifier] VITE_MERCURY_KEY is missing — falling back to allow.');
    return { ...FALLBACK_RESULT };
  }

  const userPayload = JSON.stringify(
    {
      TITLE: title.trim(),
      DETAILS: details.trim(),
      DEPARTMENT: department.trim(),
      USER_SELECTED_TOPIC: userSelectedTopic.trim(),
    },
    null,
    2,
  );

  try {
    const response = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mercury-2',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPayload },
        ],
        temperature: 0.1,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(
        `[AcademicVerifier] Mercury API error ${response.status}: ${response.statusText} — falling back to allow.`,
      );
      return { ...FALLBACK_RESULT };
    }

    const data: unknown = await response.json();
    const content =
      data &&
      typeof data === 'object' &&
      'choices' in data &&
      Array.isArray((data as Record<string, unknown>)['choices'])
        ? (
            (data as Record<string, unknown[]>)['choices'][0] as
              | Record<string, unknown>
              | undefined
          )?.['message']
        : undefined;

    const rawContent =
      content && typeof content === 'object' && 'content' in (content as object)
        ? (content as Record<string, unknown>)['content']
        : undefined;

    if (!rawContent || typeof rawContent !== 'string') {
      console.warn('[AcademicVerifier] Unexpected response shape — falling back to allow.');
      return { ...FALLBACK_RESULT };
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Regex fallback when JSON is truncated.
      const pick = (key: string): string | undefined => {
        const m = rawContent.match(
          new RegExp(`"${key}"\\s*:\\s*(true|false|null|"[^"]*"|[\\d.]+)`, 'i'),
        );
        return m ? m[1] : undefined;
      };
      parsed = {
        isAcademic: pick('isAcademic'),
        titleOk: pick('titleOk'),
        detailsOk: pick('detailsOk'),
        departmentMatch: pick('departmentMatch'),
        topicMatch: pick('topicMatch'),
        reason: (pick('reason') ?? '').replace(/^["']|["']$/g, ''),
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      console.warn('[AcademicVerifier] Could not parse Mercury response — falling back to allow.');
      return { ...FALLBACK_RESULT };
    }

    const p = parsed as Record<string, unknown>;

    // Treat any non-explicit-true value as false to stay conservative.
    const titleOk = p['titleOk'] === true;
    const detailsOk = p['detailsOk'] === true;
    const departmentMatch = p['departmentMatch'] === true;
    const topicMatch = p['topicMatch'] === true;
    const isAcademic = titleOk && detailsOk && departmentMatch && topicMatch;

    return {
      isAcademic,
      titleOk,
      detailsOk,
      departmentMatch,
      topicMatch,
      reason:
        typeof p['reason'] === 'string' && (p['reason'] as string).trim()
          ? (p['reason'] as string).trim()
          : '',
    };
  } catch (err) {
    console.warn('[AcademicVerifier] Unexpected error — falling back to allow:', err);
    return { ...FALLBACK_RESULT };
  }
}
