export interface AcademicVerificationResult {
  isAcademic: boolean;
  titleOk: boolean;
  detailsOk: boolean;
  departmentMatch: boolean;
  topicMatch: boolean;
  reason: string;
  /** true when the verifier itself failed (network/API error) — never when the content was rejected */
  error?: true;
}



const SYSTEM_PROMPT = `You are a STRICT academic content moderator for a university Q&A platform. You must reject anything that is not clearly academic and clearly aligned with the given department and topic.

You will receive:
- TITLE
- DETAILS
- DEPARTMENT
- USER-SELECTED TOPIC

Apply all four rules. If ANY rule fails, the whole post must be rejected.

RULE 1 — titleOk
The title must name a specific, real academic subject.
REJECT (titleOk=false) if the title is:
  - Pop culture, cartoons, brands, games (example: "Ben 10", "Minecraft", "iPhone 15")
  - Greetings, memes, jokes, or filler (example: "Hello", "Help", "Is water wet?")
  - Vague single words with no subject (example: "Question", "Info", "Stuff")
  - Advertisements or spam (example: "Buy cheap data bundles")
ACCEPT (titleOk=true) only if the title is a real academic subject (example: "RSA Encryption", "Binary Search Trees", "Dijkstra's Algorithm").

RULE 2 — detailsOk
The details must contain a real academic question or problem statement that a lecturer could answer.
REJECT (detailsOk=false) if the details are:
  - A greeting, filler, or small talk (example: "Hello, good morning", "lol idk just wanna know stuff")
  - A vague one-liner with no academic substance (example: "I need help", "Please assist")
  - A download request or resource request (example: "Does anybody have the file for me to download")
  - Personal gossip, spam, or casual chat (example: "I heard two lecturers are dating")
ACCEPT (detailsOk=true) only if the details clearly state an academic problem or question (example: "Why does Dijkstra's algorithm fail with negative edge weights?").

RULE 3 — departmentMatch
The title and details must clearly belong to the given DEPARTMENT. If the subject is from a different field, reject even if it is academic in general.
REJECT (departmentMatch=false) if:
  - The question is about a subject that belongs to a DIFFERENT department
  - Example: "Human Anatomy" or "Photosynthesis" under "Computer Science And Informatics" → departmentMatch=false
  - Example: "Cryptography" under "Department of Engineering" → departmentMatch=false
  - Example: "Roman History" under "Computer Science And Informatics" → departmentMatch=false
ACCEPT (departmentMatch=true) only if the subject clearly belongs to the given department.

RULE 4 — topicMatch
The USER-SELECTED TOPIC must be a real, specific academic topic, AND the title and details must clearly relate to that exact topic.
REJECT (topicMatch=false) if:
  - The topic is generic or meaningless (example: "technology", "programming", "general", "misc", "Random Stuff", "Other") → topicMatch=false
  - The topic is not a real academic subject → topicMatch=false
  - The topic is a real academic subject BUT it does not match the question
    Example: question about "Docker containers" with topic "Cryptography" → topicMatch=false
    Example: question about "neural networks" with topic "Networking" → topicMatch=false
    Example: question about "Binary Search Trees" with topic "Random Stuff" → topicMatch=false
ACCEPT (topicMatch=true) only if the topic is specific AND the question is clearly about that topic.

FINAL RULE
isAcademic = true ONLY if titleOk AND detailsOk AND departmentMatch AND topicMatch are ALL true.
If even one is false, isAcademic MUST be false.

Return ONLY this JSON and nothing else:
{
  "isAcademic": true | false,
  "titleOk": true | false,
  "detailsOk": true | false,
  "departmentMatch": true | false,
  "topicMatch": true | false,
  "reason": "one short sentence naming the first failing rule"
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
  // TEMPORARY DEBUG — remove after key is confirmed
  console.log('[AcademicVerifier] VITE_MERCURY_KEY defined:', !!apiKey);
  if (!apiKey) {
    console.warn('[AcademicVerifier] VITE_MERCURY_KEY is missing — blocking submission.');
    return {
      isAcademic: false,
      titleOk: false,
      detailsOk: false,
      departmentMatch: false,
      topicMatch: false,
      reason: 'Verification service unavailable — please try again',
      error: true,
    };
  }

  // Truncate inputs defensively before sending
  const sanitizedTitle = (title ?? '').trim().slice(0, 100);
  const sanitizedDetails = (details ?? '').trim().slice(0, 500);
  const sanitizedDepartment = (department ?? '').trim().slice(0, 200);
  const sanitizedTopic = (userSelectedTopic ?? '').trim().slice(0, 100);

  const userPayload = JSON.stringify(
    {
      TITLE: sanitizedTitle,
      DETAILS: sanitizedDetails,
      DEPARTMENT: sanitizedDepartment,
      USER_SELECTED_TOPIC: sanitizedTopic,
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
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[AcademicVerifier] Mercury HTTP error ${response.status} ${response.statusText}:`,
        errorBody,
      );
      return {
        isAcademic: false,
        titleOk: false,
        detailsOk: false,
        departmentMatch: false,
        topicMatch: false,
        reason: 'Verification service unavailable — please try again',
        error: true,
      };
    }

    const data: unknown = await response.json();
    // TEMPORARY DEBUG — log the FULL Mercury response so we can see its exact shape
    console.log('[AcademicVerifier] Full Mercury response:', JSON.stringify(data, null, 2));

    // Extract content defensively — try every path Mercury might use
    const choice = (data as any)?.choices?.[0];

    // Guard: if the model hit the token limit, content will be null/incomplete
    if (choice?.finish_reason === 'length') {
      console.warn('[AcademicVerifier] Mercury finish_reason=length — token budget exhausted.');
      return {
        isAcademic: false,
        titleOk: false,
        detailsOk: false,
        departmentMatch: false,
        topicMatch: false,
        reason: 'Your question is too long to verify — please shorten it.',
      };
    }

    const message = choice?.message;
    let content: unknown = message?.content;

    if (content === null || content === undefined) {
      // Alternate paths some Inception API versions use
      content =
        choice?.text ??
        // tool_calls path: some json_object responses embed JSON in function arguments
        (message?.tool_calls?.[0]?.function?.arguments) ??
        (data as any)?.content ??
        (data as any)?.response ??
        null;
    }

    // TEMPORARY DEBUG — log the extracted content
    console.log('[AcademicVerifier] Extracted content type:', typeof content, '| value:', content);

    if (content === null || content === undefined) {
      console.error(
        '[AcademicVerifier] Mercury returned null/undefined content. Full response logged above.',
      );
      throw new Error('Mercury returned null content');
    }

    // Handle string (parse it) or object (already parsed by json_object mode)
    let parsed: unknown = null;
    if (typeof content === 'string') {
      try {
        parsed = JSON.parse(content);
      } catch {
        // Regex fallback when JSON is truncated
        const pick = (key: string): string | undefined => {
          const m = content.match(
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
    } else if (typeof content === 'object') {
      parsed = content;
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[AcademicVerifier] Could not parse Mercury response — blocking submission.');
      return {
        isAcademic: false,
        titleOk: false,
        detailsOk: false,
        departmentMatch: false,
        topicMatch: false,
        reason: 'Verification service unavailable — please try again',
        error: true,
      };
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
    console.error('[AcademicVerifier] Unexpected error — blocking submission:', err);
    return {
      isAcademic: false,
      titleOk: false,
      detailsOk: false,
      departmentMatch: false,
      topicMatch: false,
      reason: 'Verification service unavailable — please try again',
      error: true,
    };
  }
}
