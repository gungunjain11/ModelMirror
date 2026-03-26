import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { APIClient } from '@/config/apiConfig';

export function TestsTab() {
  const modes = ["Generate", "Validate"] as const;
  const { codeLines } = useApp();
  const [mode, setMode] = useState<typeof modes[number]>("Generate");
  const [testsText, setTestsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const code = codeLines.join('\n').trim();
    
    if (!code) {
      setError('Please add some code first');
      return;
    }

    setLoading(true);
    setError(null);
    setShown(false);

    try {
      const prompt =
        mode === "Generate"
          ? `Generate edge test cases for this code.

Return format:
Input: [test input]
Expected Output: [expected result]
Explanation: [why this edge case matters]

Code:
\`\`\`
${code}
\`\`\``
          : `For this code and tests:

1. Check test coverage
2. Suggest missing edge cases
3. Identify weak or incomplete tests

Return format:
Missing Tests:
- [test case]

Weak Tests:
- [test case]

Better Inputs:
- [input description]

Code:
\`\`\`
${code}
\`\`\``;

      const text = await APIClient.chat(
        prompt,
        undefined,
        'You are a QA expert. Generate comprehensive test cases for code. Focus on edge cases, security concerns, and error handling.'
      );

      setTestsText(text);
      setShown(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate tests';
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-1">
        {modes.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-[11px] rounded ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-muted-foreground"
            }`}
          >
            {m === "Generate" ? "Edge Cases" : "Validate Tests"}
          </button>
        ))}
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? 'Generating...' : 'Generate Tests'}
      </button>

      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-4 shimmer rounded w-1/3" />
          <div className="h-40 shimmer rounded" />
          <div className="h-20 shimmer rounded" />
        </div>
      )}

      {shown && !loading && (
        <div className="space-y-3 animate-slide-in-right">
          <div className="bg-background rounded border border-border p-2 font-mono text-[10px] whitespace-pre-wrap overflow-auto max-h-96">
            {testsText}
          </div>
        </div>
      )}
    </div>
  );
}
