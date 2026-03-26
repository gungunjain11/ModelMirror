// ModelMirror Local Server v1.1
// Run: node server.js

const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: '*' }));

// ── JSON helpers ───────────────────────────────────────────────────────────
function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractJsonObject(text) {
  if (typeof text !== 'string') return null;

  const direct = tryParseJson(text);
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) return direct;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    const parsed = tryParseJson(fenced[1]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  }

  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const parsed = tryParseJson(text.slice(start, end + 1));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  }

  return null;
}

// ── Normalizers ────────────────────────────────────────────────────────────
function normalizeAnalysis(obj, fallbackCode, action) {
  // For 'explain' action, exclude fix_before and fix_after
  if (action === 'explain') {
    return {
      title:       typeof obj?.title       === 'string' ? obj.title       : 'Code Analysis',
      explanation: typeof obj?.explanation === 'string' ? obj.explanation : 'Analysis complete.',
      why:         typeof obj?.why         === 'string' ? obj.why         : 'See explanation above.',
      intent:      typeof obj?.intent      === 'string' ? obj.intent      : 'Code quality improvement.',
    };
  }
  
  // For refactor, optimize, and tests — include code snippets
  return {
    title:       typeof obj?.title       === 'string' ? obj.title       : 'Code Analysis',
    explanation: typeof obj?.explanation === 'string' ? obj.explanation : 'Analysis complete.',
    fix_before:  typeof obj?.fix_before  === 'string' ? obj.fix_before  : fallbackCode,
    fix_after:   typeof obj?.fix_after   === 'string' ? obj.fix_after   : fallbackCode,
    why:         typeof obj?.why         === 'string' ? obj.why         : 'See explanation above.',
    intent:      typeof obj?.intent      === 'string' ? obj.intent      : 'Code quality improvement.',
  };
}

function normalizeBugs(obj) {
  const bugs = Array.isArray(obj?.bugs) ? obj.bugs.map(b => ({
    severity:    typeof b.severity    === 'string' ? b.severity    : 'info',
    type:        typeof b.type        === 'string' ? b.type        : 'Issue',
    description: typeof b.description === 'string' ? b.description : '',
    fix:         typeof b.fix         === 'string' ? b.fix         : '',
  })) : [];

  return {
    bugs,
    explanation: typeof obj?.explanation === 'string' ? obj.explanation : '',
  };
}

function normalizeFullCode(obj) {
  return {
    full_code: typeof obj?.full_code === 'string' ? obj.full_code : '',
    explanation: typeof obj?.explanation === 'string' ? obj.explanation : '',
  };
}

// ── Prompts ────────────────────────────────────────────────────────────────
function buildAnalyzePrompt(code, action, language, context) {
  const lang = language ? ` Language: ${language}.` : '';

  const guides = {
    explain: {
      title:       'e.g. "Debounced event handler using closure"',
      explanation: 'A clear summary (3-5 sentences) explaining: what problem this code solves, how the algorithm/logic works, key concepts involved. Be direct and educational. No bullet points for explain.',
      why:         'One sentence: the core pattern or trick.',
    },
    refactor: {
      title:       'e.g. "Extract validation + rename for clarity"',
      explanation: '2-4 bullets: specific structural problems (e.g. "• fn does 3 things — split it", "• magic number 86400 — use constant"). Be blunt.',
      fix_before:  'Copy the original code verbatim with proper indentation.',
      fix_after:   'Refactored code with proper indentation. Comments only where non-obvious.',
      why:         'One sentence: the main readability gain.',
    },
    optimize: {
      title:       'e.g. "O(n²) → O(n) with a Map lookup"',
      explanation: '2-3 bullets: bottleneck + complexity before/after. Include Big-O or estimated speedup.',
      fix_before:  'Copy the original code verbatim with proper indentation.',
      fix_after:   '1-2 specific actionable hints on HOW to optimize (not the full code). e.g.: "Replace nested loop with a Map lookup", "Use binary search instead of linear scan", "Cache function results to avoid recalculation".',
      why:         'One sentence: the complexity or speed gain.',
    },
    generate_tests: {
      title:       'e.g. "Tests: happy path + null + boundary + throws"',
      explanation: '1-2 bullets: framework used, what is under test, assumptions made about intended behavior.',
      fix_after:   'Full test file with proper indentation. Cover: happy path, null/empty input, boundary values, error throws. Use descriptive test names.',
      why:         'One sentence: the riskiest edge case covered.',
    },
  };

  const g = guides[action] || guides.explain;
  
  // Build JSON template based on action
  let jsonTemplate = '';
  if (action === 'explain') {
    jsonTemplate = `{
  "title": "${g.title}",
  "explanation": "${g.explanation}",
  "why": "${g.why}",
  "intent": "5 words max"
}`;
  } else if (action === 'generate_tests') {
    jsonTemplate = `{
  "title": "${g.title}",
  "explanation": "${g.explanation}",
  "fix_after": "${g.fix_after}",
  "why": "${g.why}",
  "intent": "5 words max"
}`;
  } else {
    jsonTemplate = `{
  "title": "${g.title}",
  "explanation": "${g.explanation}",
  "fix_before": "${g.fix_before}",
  "fix_after": "${g.fix_after}",
  "why": "${g.why}",
  "intent": "5 words max"
}`;
  }

  let contextInfo = '';
  if (action === 'generate_tests' && context) {
    contextInfo = `\nPurpose of code: ${context.purpose || 'Not specified'}
Expected output: ${context.expected_output || 'Not specified'}
Edge cases to test: ${context.edge_cases || 'Not specified'}\n`;
  }

  return `You are a senior engineer. Be terse and direct — no intros, no filler, no prose summaries.${lang}

Respond with ONLY a valid JSON object — no markdown fences, no extra text:
${jsonTemplate}

${contextInfo}
Code:
\`\`\`
${code}
\`\`\``;
}

function buildBugsPrompt(code, language) {
  const lang = language ? ` Language: ${language}.` : '';
  return `You are a security-focused code reviewer. Be blunt and specific — no filler.${lang}

Respond with ONLY a valid JSON object — no markdown fences, no extra text:
{
  "bugs": [
    {
      "severity": "high|medium|low|info",
      "type": "Exact bug class (e.g. SQL Injection, Off-by-one, Unhandled rejection, Race condition)",
      "description": "1 sentence: what breaks and where. Include line/var name if possible.",
      "fix": "The exact fix: corrected code snippet or the minimal change needed (1-3 lines)"
    }
  ],
  "explanation": "1 sentence overall verdict. If clean, say so plainly."
}

If no bugs: { "bugs": [], "explanation": "No issues found." }

Code:
\`\`\`
${code}
\`\`\``;
}

function buildBugsPromptFull(code, language) {
  const lang = language ? ` Language: ${language}.` : '';
  return `You are a senior engineer fixing code issues. Be thorough and exact.${lang}

Analyze this code and return the complete fixed version with all logical errors, security issues, and bugs resolved.

Respond with ONLY a valid JSON object — no markdown fences, no extra text:
{
  "full_code": "The complete fixed code with proper indentation, all issues resolved.",
  "explanation": "Brief summary of what was fixed."
}

Code:
\`\`\`
${code}
\`\`\``;
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('ModelMirror server is running!'));

app.post('/analyze', async (req, res) => {
  const { code, intent, language, action, context, fullSolution } = req.body || {};

  if (typeof code !== 'string' || code.trim() === '') {
    const baseResponse = {
      title: 'Invalid input',
      explanation: 'Request body must include a non-empty "code" string.',
      why: 'No code was provided.',
      intent: intent || '',
    };
    if (action !== 'explain') {
      baseResponse.fix_before = '';
      baseResponse.fix_after = '';
    }
    return res.status(400).json(baseResponse);
  }

  // For test generation, ask for context if not provided
  if (action === 'generate_tests' && !context) {
    return res.status(200).json({
      title: 'Test Generation - Need More Context',
      context_questions: {
        purpose: 'What is the primary purpose of this code? (e.g., "Validates user email addresses", "Sorts array in ascending order", "Fetches user data from API")',
        expected_output: 'What should be the expected output for typical/successful inputs? (e.g., "Returns true/false", "Returns sorted array", "Returns user object with id, name, email")',
        edge_cases: 'Are there any specific edge cases or constraints we should test? (e.g., "Handles null values", "Works with negative numbers", "Throws error on invalid API response")',
      },
      explanation: 'Please provide context about this code so we can generate meaningful test cases.',
      hint: 'Send another request with the same code and action, but include a "context" object with your answers: { code, action: "generate_tests", context: { purpose: "...", expected_output: "...", edge_cases: "..." } }',
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const baseResponse = {
      title: 'Missing API Key',
      explanation: 'OPENROUTER_API_KEY is not set in your .env file. Please add it and restart the server.',
      why: 'The server needs an API key to call the AI model.',
      intent: 'Configure the server.',
    };
    if (action !== 'explain') {
      baseResponse.fix_before = code;
      baseResponse.fix_after = code;
    }
    return res.status(500).json(baseResponse);
  }

  const isBugs = action === 'find_bugs';

  let userPrompt;
  if (isBugs && !fullSolution) {
    userPrompt = buildBugsPrompt(code, language || '');
  } else if (isBugs && fullSolution) {
    userPrompt = buildBugsPromptFull(code, language || '');
  } else {
    userPrompt = buildAnalyzePrompt(code, action, language || '', context);
  }

  let systemPrompt;
  if (isBugs && !fullSolution) {
    systemPrompt = 'You are a blunt security reviewer. Output ONLY a JSON object with keys: bugs (array of {severity,type,description,fix}), explanation. No markdown. No prose outside JSON.';
  } else if (isBugs && fullSolution) {
    systemPrompt = 'You are a senior engineer. Output ONLY a JSON object with keys: full_code, explanation. full_code must be the complete fixed code with all logical issues and bugs resolved, properly indented. Behavior must be identical to original but without errors. explanation should be 1-2 sentences summarizing what was fixed. No markdown fences. No prose outside JSON.';
  } else if (action === 'explain') {
    systemPrompt = 'You are a clear, educational senior engineer. Output ONLY a JSON object with keys: title, explanation, why, intent. explanation should be 3-5 clear sentences explaining the logic, algorithm, and key concepts. No bullet points. No markdown fences. No prose outside JSON.';
  } else if (action === 'generate_tests') {
    systemPrompt = 'You are a test-driven engineer. Output ONLY a JSON object with keys: title, explanation, fix_after, why, intent. explanation must use bullet points starting with "•". Code must be properly indented. No markdown fences. No prose outside JSON.';
  } else if (action === 'optimize' && !fullSolution) {
    systemPrompt = 'You are a senior engineer teaching optimization. Output ONLY a JSON object with keys: title, explanation, fix_before, fix_after, why, intent. For optimize in LEARNING MODE: fix_after must be 1-2 specific actionable hints (NOT full code), explaining WHAT to change and HOW (e.g., "Replace nested loop with Map lookup", "Use memoization to cache results"). explanation must use bullet points. No markdown fences. No prose outside JSON.';
  } else if (action === 'optimize' && fullSolution) {
    systemPrompt = 'You are a senior engineer. Output ONLY a JSON object with keys: title, explanation, fix_before, fix_after, why, intent. For optimize in FULL SOLUTION MODE: fix_after must be the complete optimized code with proper indentation. Behavior must be identical to original. explanation must use bullet points starting with "•". Code must be properly indented. No markdown fences. No prose outside JSON.';
  } else {
    systemPrompt = 'You are a terse senior engineer. Output ONLY a JSON object with keys: title, explanation, fix_before, fix_after, why, intent. explanation must use bullet points starting with "•". Code must be properly indented. No markdown fences. No prose outside JSON.';
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt   },
  ];

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type':  'application/json',
  };
  if (process.env.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  if (process.env.OPENROUTER_APP_NAME) headers['X-Title']      = process.env.OPENROUTER_APP_NAME;

  try {
    const apiResponse = await axios.post(
      OPENROUTER_URL,
      { model: OPENROUTER_MODEL, messages, temperature: 0.2 },
      { headers }
    );

    const rawContent = apiResponse?.data?.choices?.[0]?.message?.content || '';
    const parsed     = extractJsonObject(rawContent);

    const result = isBugs
      ? (fullSolution ? normalizeFullCode(parsed) : normalizeBugs(parsed))
      : normalizeAnalysis(parsed, code, action);

    return res.json(result);

  } catch (error) {
    const status  = error?.response?.status || 502;
    const message = error?.response?.data?.error?.message || error?.message || 'OpenRouter request failed.';

    if (isBugs) {
      return res.status(status).json({
        bugs: [],
        explanation: message,
      });
    }

    const baseResponse = {
      title:       'AI request failed',
      explanation: message,
      why:         'Could not retrieve a response from the AI model.',
      intent:      intent || '',
    };
    
    if (action !== 'explain') {
      baseResponse.fix_before = code;
      baseResponse.fix_after = code;
    }
    
    return res.status(status).json(baseResponse);
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 ModelMirror server running at http://localhost:${PORT}\n`);
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠  OPENROUTER_API_KEY is not set in .env — AI calls will fail.\n');
  }
});
