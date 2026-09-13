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



const SYSTEM_PROMPT = `You are a BALANCED academic content moderator for a university Q&A platform. Your job is to ALLOW genuine academic questions and only REJECT content that is clearly non-academic, spam, or inappropriate.

You will receive:
- TITLE
- DETAILS
- DEPARTMENT
- USER-SELECTED TOPIC

Apply all four rules. If ANY rule clearly fails, the whole post must be rejected.

RULE 1 — titleOk
The title must refer to a real academic subject, concept, tool, or technology.
REJECT (titleOk=false) ONLY if the title is:
  - Pure pop culture, cartoons, brands (example: "Ben 10", "iPhone 15", "Minecraft")
  - Greetings, memes, jokes (example: "Hello", "Is water wet?")
  - Meaningless filler with zero academic reference (example: "Help", "Stuff")
  - Advertisements or spam
ACCEPT (titleOk=true) if the title names a real academic subject, technology, concept, tool, framework, or field. Short titles are fine. Example acceptable titles: "CSS", "RSA Encryption", "React Hooks", "Binary Trees", "Tailwind CSS", "Frontend".

RULE 2 — detailsOk
The details must show the user is asking an academic question, even if phrased casually or briefly.
REJECT (detailsOk=false) ONLY if the details are:
  - Pure greetings or filler with no question at all (example: "Hello, good morning", "lol idk")
  - A download request (example: "Does anybody have the file for me to download")
  - Personal gossip, spam, or casual chat with zero academic meaning (example: "I heard two lecturers are dating")
  - Completely empty or just whitespace
ACCEPT (detailsOk=true) if the user is genuinely asking about an academic concept, tool, comparison, or problem, even if it is:
  - Short (as few as 5–10 words)
  - Casually phrased (example: "Is CSS better than Tailwind CSS?", "which sorting algorithm is faster?")
  - A comparison question (example: "React vs Vue — which is easier?")
  - A 'why', 'how', 'what', 'which', or 'when' question about any academic topic
The AI must read the semantic intent of the question, not judge the length or formality.

RULE 3 — departmentMatch
The title and details must broadly belong to the given DEPARTMENT. Apply this rule generously — cross-topic questions within the same broad field should pass.
REJECT (departmentMatch=false) ONLY if the question is obviously about a completely different academic field:
  - Example: "Human Anatomy" under "Computer Science And Informatics" → departmentMatch=false
  - Example: "Photosynthesis" under "Engineering" → departmentMatch=false
ACCEPT (departmentMatch=true) if the question is plausibly related to or used within the given department, even if it leans toward a sub-field.

RULE 4 — topicMatch
The USER-SELECTED TOPIC must be a recognizable academic subject AND the question must be related to it.
REJECT (topicMatch=false) ONLY if:
  - The topic is pure nonsense or completely meaningless (example: "Random Stuff", "zzz", "misc")
  - The topic is a real subject BUT the question is clearly about a completely different subject
ACCEPT (topicMatch=true) if the topic is a real academic concept and the question is at least loosely related to it. Broad topic labels like "Frontend", "Programming", "Networking" are acceptable if the question fits.

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
        temperature: 0.3,
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
