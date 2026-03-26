import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { APIClient } from '@/config/apiConfig';
import { CodeAnalyzer } from '@/lib/codeAnalyzer';

const modes = ['Simplify', 'Performance', 'Readability'] as const;

export function RefactorTab() {
  const { codeLines } = useApp();
  const [mode, setMode] = useState<typeof modes[number]>('Simplify');
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [refactorText, setRefactorText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const modePrompts: Record<typeof modes[number], string> = {
    Simplify: 'Focus on reducing complexity and removing redundant code',
    Performance: 'Focus on optimizing performance and execution speed',
    Readability: 'Focus on improving code clarity and maintainability',
  };

  const handleRefactor = async () => {
    const code = codeLines.join('\n').trim();
    
    if (!code) {
      setError('Please add some code first');
      return;
    }

    setLoading(true);
    setError(null);
    setShown(false);

    try {
      const issues = CodeAnalyzer.analyzeCode(code);
      const complexity = CodeAnalyzer.getComplexityScore(code);

      const text = await APIClient.chat(
        `Refactor this code for ${mode.toLowerCase()}.

${modePrompts[mode]}

Return a concise list of specific refactoring suggestions:

Suggestions:
${issues.slice(0, 5).map(i => `- ${i.message}: ${i.suggestion}`).join('\n')}

Code:
\`\`\`
${code}
\`\`\``,
        undefined,
        `You are a code refactoring expert. Provide specific, actionable refactoring suggestions that improve ${mode.toLowerCase()}.`
      );

      setRefactorText(text);
      setShown(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refactor code';
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
            onClick={() => { setMode(m); setShown(false); }}
            className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={handleRefactor}
        disabled={loading}
        className="w-full py-2 text-xs rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? 'Analyzing...' : `Suggest ${mode}`}
      </button>

      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-32 shimmer rounded" />
        </div>
      )}

      {shown && !loading && (
        <div className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-96 overflow-auto">
          {refactorText}
        </div>
      )}
    </div>
  );
}
