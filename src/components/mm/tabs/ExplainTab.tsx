import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { APIClient } from '@/config/apiConfig';
import { CodeAnalyzer } from '@/lib/codeAnalyzer';

export function ExplainTab() {
  const { codeLines } = useApp();
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    const code = codeLines.join('\n').trim();
    
    if (!code) {
      setError('Please add some code first');
      return;
    }

    setLoading(true);
    setError(null);
    setShown(false);

    try {
      // Analyze code before asking AI
      const issues = CodeAnalyzer.analyzeCode(code);
      const complexity = CodeAnalyzer.getComplexityScore(code);
      
      const text = await APIClient.chat(
        `Explain this code in simple terms.

Return in format:

**Purpose:**
[What the code does]

**Complexity Score:** ${complexity}/100

**Detected Issues:**
${issues.slice(0, 3).map(i => `- ${i.message} (${i.severity})`).join('\n')}

**Plain English:**
[Simple explanation of what happens step by step]

Code:
\`\`\`
${code}
\`\`\``,
        undefined,
        'You are a code explanation expert. Explain code in a clear, structured way that helps developers understand what it does and how it works.'
      );

      setExplainText(text);
      setShown(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to explain code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <button
        onClick={handleExplain}
        disabled={loading}
        className="w-full py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? 'Analyzing...' : 'Explain this code'}
      </button>

      {error && (
        <div className="p-2 rounded bg-mm-red/10 border border-mm-red/30 text-xs text-mm-red">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-4 shimmer rounded" />
          <div className="h-3 shimmer rounded w-3/4" />
          <div className="h-3 shimmer rounded w-1/2" />
          <div className="h-20 shimmer rounded" />
        </div>
      )}

      {shown && !loading && (
        <div className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-96 overflow-auto">
          {explainText}
        </div>
      )}
    </div>
  );
}
