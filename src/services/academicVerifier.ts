export interface AcademicVerificationResult {
  isAcademic: boolean;
  titleOk: boolean;
  detailsOk: boolean;
  departmentMatch: boolean;
  matchedTopic: string | null;
  reason: string;
}

/**
 * Closed-topic whitelist per department.
 * Each department maps to an array of accepted academic topic strings.
 * Topics are matched case-insensitively and trimmed inside the verifier.
 *
 * Important: a department does NOT need to exist in this map for the question
 * to be verified. Any department the user selects — including newly added ones
 * that have not had their whitelist configured yet — is still sent to the
 * Mercury 2 verifier. If the department has no entry here, it is treated as an
 * empty closed topic list, so NOTHING can match and the question is rejected
 * (matchedTopic = null) until the department's topics are added below.
 */
export const DEPARTMENT_TOPICS: Record<string, string[]> = {
  // Example department — replace / extend with real closed topic lists.
  'Computer Science And Informatics': [
    'Algorithms',
    'Data Structures',
    'Programming',
    'Databases',
    'Networks',
    'Artificial Intelligence',
    'Machine Learning',
    'Computer Vision',
    'Natural Language Processing',
    'Operating Systems',
    'Software Engineering',
    'Computer Architecture',
    'Distributed Systems',
  ],
};

/**
 * Returns the closed topic list for a department, or an empty array when the
 * department has no defined whitelist. Matching is done case-insensitively by
 * the verifier, so store topics in a canonical form here.
 */
export function getTopicsForDepartment(department: string): string[] {
  if (!department || typeof department !== 'string') return [];
  // Try exact key first, then a case-insensitive fallback.
  const exact = DEPARTMENT_TOPICS[department];
  if (exact) return exact;
  const key = Object.keys(DEPARTMENT_TOPICS).find(
    (k) => k.toLowerCase() === department.toLowerCase()
  );
  return key ? DEPARTMENT_TOPICS[key] : [];
}

const FALLBACK_RESULT: AcademicVerificationResult = {
  isAcademic: true,
  titleOk: true,
  detailsOk: true,
  departmentMatch: true,
  matchedTopic: null,
  reason: 'Verification unavailable',
};

/**
 * Evaluates TITLE and DETAILS against DEPARTMENT and the closed TOPIC LIST
 * using the Mercury 2 model.
 *
 * Returns ONLY JSON shaped as:
 *   { isAcademic, titleOk, detailsOk, departmentMatch, matchedTopic, reason }
 *
 * Rules (encoded in the system prompt):
 *   - matchedTopic is the best match from the topic list, or null.
 *   - isAcademic is true ONLY if titleOk AND detailsOk AND departmentMatch
 *     are all true AND matchedTopic is not null.
 *   - On API/parsing errors the result falls back to all-true with
 *     matchedTopic set to userSelectedTopic so submission is not blocked.
 */
export async function verifyAcademicQuestion(
  title: string,
  details: string,
  department: string,
  validTopics: string[],
  userSelectedTopic: string
): Promise<AcademicVerificationResult> {
  const apiKey = import.meta.env?.VITE_MERCURY_KEY;
  if (!apiKey) {
    console.warn('[AcademicVerifier] VITE_MERCURY_KEY is missing. Falling back.');
    return {
      ...FALLBACK_RESULT,
      matchedTopic: userSelectedTopic || null,
    };
  }

  const topicListText =
    validTopics.length > 0
      ? validTopics.map((t) => `- ${t}`).join('\n')
      : 'NONE — this department has no closed topic list; any non-empty topic is treated as no match.';

  const systemPrompt =
    'You are an academic moderator. Evaluate TITLE and DETAILS against DEPARTMENT and the closed TOPIC LIST. Set matchedTopic to the best match from the list or null. isAcademic is true ONLY if titleOk, detailsOk, departmentMatch are all true AND matchedTopic is not null. Return ONLY JSON.';

  const userPayload = JSON.stringify({
    TITLE: title.trim(),
    DETAILS: details.trim(),
    DEPARTMENT: department.trim(),
    TOPIC_LIST: validTopics,
    SELECTED_TOPIC: userSelectedTopic.trim(),
    TOPIC_LIST_TEXT: topicListText,
  }, null, 2);

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(
        `[AcademicVerifier] Mercury API error ${response.status}: ${response.statusText}`
      );
      return {
        ...FALLBACK_RESULT,
        matchedTopic: userSelectedTopic || null,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return {
        ...FALLBACK_RESULT,
        matchedTopic: userSelectedTopic || null,
      };
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback regex extraction if JSON was truncated.
      const pick = (key: string) => {
        const m = content.match(new RegExp(`"${key}"\\s*:\\s*(true|false|null|"[^"]*"|[\\d.]+)`, 'i'));
        return m ? m[1] : undefined;
      };
      const rawTopic = pick('matchedTopic');
      parsed = {
        isAcademic: pick('isAcademic'),
        titleOk: pick('titleOk'),
        detailsOk: pick('detailsOk'),
        departmentMatch: pick('departmentMatch'),
        matchedTopic:
          rawTopic === 'null'
            ? null
            : rawTopic ?? null,
        reason: (pick('reason') || '').replace(/^["']|["']$/g, ''),
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        ...FALLBACK_RESULT,
        matchedTopic: userSelectedTopic || null,
      };
    }

    const titleOk = parsed.titleOk === true;
    const detailsOk = parsed.detailsOk === true;
    const departmentMatch = parsed.departmentMatch === true;
    const matchedTopic =
      parsed.matchedTopic === null || parsed.matchedTopic === undefined
        ? null
        : String(parsed.matchedTopic);
    const isAcademic =
      titleOk && detailsOk && departmentMatch && matchedTopic !== null;

    return {
      isAcademic,
      titleOk,
      detailsOk,
      departmentMatch,
      matchedTopic,
      reason:
        typeof parsed.reason === 'string' && parsed.reason.trim()
          ? parsed.reason.trim()
          : '',
    };
  } catch (error) {
    console.warn('[AcademicVerifier] Unexpected error during verification:', error);
    return {
      ...FALLBACK_RESULT,
      matchedTopic: userSelectedTopic || null,
    };
  }
}
