# Question Form Input Limits & AI Moderation Specification

## 1. Overview
To ensure fast interface response times, eliminate LLM token exhaustion, lower inference costs, and enforce academic quality across the QCampus Connect platform, the question submission interface (`src/route/QAPage.tsx`) and the AI verification service (`src/services/academicVerifier.ts`) enforce strict character limits, pre-flight validation guards, and token budgeting.

---

## 2. Input Character Limits

| Input Field | Hard Limit | Minimum Guard | Live Counter Format | Visual Warning States |
| :--- | :--- | :--- | :--- | :--- |
| **Title** | `100` chars | 1 non-empty char | `{currentLength}/100` | Subtle grey $\rightarrow$ Red at $\ge 90$ chars $\rightarrow$ Bold Red at 100 chars |
| **Details** | `500` chars | 12 chars (`trimmed`) | `{currentLength}/500` (right-aligned) | Subtle grey $\rightarrow$ Red at $\ge 450$ chars $\rightarrow$ Bold Red at 500 chars |
| **Hashtags** (Optional) | `100` chars | None | `{currentLength}/100` | Subtle grey $\rightarrow$ Red at $\ge 90$ chars $\rightarrow$ Bold Red at 100 chars |

---

## 3. Client-Side Enforcement & Telemetry (`src/route/QAPage.tsx`)

### 3.1 Keystroke & Paste Overflow Prevention
- All input fields use HTML5 `maxLength` (`maxLength={100}`, `maxLength={500}`).
- The browser natively blocks keystrokes once the character limit is reached.
- Paste events containing text exceeding the limit are automatically truncated at the limit by the browser, preventing paste overflow.

### 3.2 Pre-Flight Validation Guards
Before dispatching any HTTP request to the Mercury 2 verification API in `handleAsk`, the client runs pre-flight JavaScript validation to save tokens:
1. **Title Required**: If `title.trim().length === 0`, halts with `"Please enter a title."`
2. **Title Length**: If `title.length > 100`, halts with `"Your title is too long. Please shorten to 100 characters. ({length}/100)"`
3. **Details Minimum**: If `body.trim().length < 12`, halts with `"Your question details are too short. Please write at least 12 characters."`
4. **Details Length**: If `body.length > 500`, halts with `"Your details are too long. Please shorten to 500 characters. ({length}/500)"`
5. **Hashtags Length**: If `hashtags.length > 100`, halts with `"Your hashtags are too long. Please shorten to 100 characters. ({length}/100)"`

### 3.3 Defensive Moderation Error Display
If a user bypasses HTML5 attributes (e.g. through browser DevTools manipulation), the form's moderation error alert container defensively renders character overflow warnings indicating the current length vs. the maximum allowed length.

---

## 4. Verifier Token Budget & Defensive Slicing (`src/services/academicVerifier.ts`)

### 4.1 Inception Labs Mercury 2 Parameters
- **Endpoint**: `https://api.inceptionlabs.ai/v1/chat/completions`
- **Model**: `mercury-2`
- **Temperature**: `0.5`
- **Max Generation Budget (`max_tokens`)**: `1500` (expanded from 256)
- **Format**: `response_format: { type: "json_object" }`

### 4.2 Defensive String Truncation
Before assembling the JSON request payload, `academicVerifier.ts` defensively trims and slices all input strings:
```typescript
const sanitizedTitle = (title ?? '').trim().slice(0, 100);
const sanitizedDetails = (details ?? '').trim().slice(0, 500);
const sanitizedDepartment = (department ?? '').trim().slice(0, 200);
const sanitizedTopic = (userSelectedTopic ?? '').trim().slice(0, 100);
```

### 4.3 Handling Token Length Exhaustion (`finish_reason === "length"`)
If the model ever hits the generation token ceiling, the verifier safely catches the condition:
```typescript
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
```

---

## 5. Architectural & Technical Reasons for Input Limits

1. **Inference Token Budget & Cost Optimization**:
   LLM inference charges and round-trip latencies scale with input prompt token volume. Bounding user text (100 chars for title, 500 chars for details) caps the prompt token footprint to a predictable, minimal envelope, conserving university API token quotas.

2. **Eliminating Truncated Model Outputs (`finish_reason: "length"`)**:
   With an allocated `max_tokens: 1500` budget, constraining input lengths ensures the model is never starved of generation headroom. The model is guaranteed sufficient space to emit a complete, well-formed JSON object containing `isAcademic`, `titleOk`, `detailsOk`, `departmentMatch`, `topicMatch`, and `reason`.

3. **Protection Against Denial-of-Service / Payload Flooding**:
   Prevents malicious or accidental submissions of massive raw logs, textbook excerpts, or source dumps from saturating the inference pipeline or bloating database storage.

4. **Scholarly Clarity & Pedagogical Quality**:
   - **Title (100 chars)**: Forces students to identify the specific academic subject (e.g., *"RSA Key Generation Time Complexity"*) rather than posting conversational greetings (*"Hey quick question"*).
   - **Details (500 chars max, 12 chars min)**: Requires students to articulate their specific conceptual hurdle in a concise, readable paragraph that faculty members can rapidly review and answer, while blocking low-effort single-word filler (*"Help"*).
