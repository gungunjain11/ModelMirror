import { useApp } from '@/contexts/AppContext';
import { useMemo, useRef, useEffect } from 'react';

function syntaxHighlight(line: string, language: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Simple tokenizer
  const jsKeywords = /\b(const|let|var|function|async|await|return|if|import|from|export|require|new|throw|try|catch|for|class|extends|this)\b/g;
  const pyKeywords = /\b(def|class|import|from|return|if|elif|else|for|in|with|as|pass|self|None|True|False|not|and|or|async|await|raise|try|except)\b/g;
  const keywords = language === 'Python' ? pyKeywords : jsKeywords;

  let lastIndex = 0;
  const text = line;

  // Comment check
  const commentIdx = language === 'Python' ? text.indexOf('#') : text.indexOf('//');
  if (commentIdx >= 0 && (commentIdx === 0 || text[commentIdx - 1] !== ':')) {
    // Check if inside a string
    const beforeComment = text.slice(0, commentIdx);
    const singleQuotes = (beforeComment.match(/'/g) || []).length;
    const doubleQuotes = (beforeComment.match(/"/g) || []).length;
    const backtickQuotes = (beforeComment.match(/`/g) || []).length;
    if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backtickQuotes % 2 === 0) {
      const codePart = text.slice(0, commentIdx);
      const commentPart = text.slice(commentIdx);
      return [...highlightCode(codePart, keywords), <span key="c" className="text-muted-foreground/60">{commentPart}</span>];
    }
  }

  return highlightCode(text, keywords);
}

function highlightCode(text: string, keywords: RegExp): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Find strings first
  const tokens: { start: number; end: number; type: 'string' | 'keyword' }[] = [];

  // Strings
  const stringRegex = /(['"`])(?:(?!\1|\\).|\\.)*\1/g;
  let m: RegExpExecArray | null;
  while ((m = stringRegex.exec(text)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, type: 'string' });
  }

  // Keywords (not inside strings)
  keywords.lastIndex = 0;
  while ((m = keywords.exec(text)) !== null) {
    const inString = tokens.some(t => m!.index >= t.start && m!.index < t.end);
    if (!inString) {
      tokens.push({ start: m.index, end: m.index + m[0].length, type: 'keyword' });
    }
  }

  tokens.sort((a, b) => a.start - b.start);

  let pos = 0;
  tokens.forEach((tok, i) => {
    if (tok.start > pos) {
      parts.push(<span key={`t${i}`}>{text.slice(pos, tok.start)}</span>);
    }
    if (tok.start >= pos) {
      const className = tok.type === 'string' ? 'text-mm-amber' : 'text-primary';
      parts.push(<span key={`k${i}`} className={className}>{text.slice(tok.start, tok.end)}</span>);
      pos = tok.end;
    }
  });
  if (pos < text.length) {
    parts.push(<span key="end">{text.slice(pos)}</span>);
  }
  return parts.length ? parts : [<span key="empty">{text}</span>];
}

export function CodeEditor() {
  const { codeLines, setCodeLines, registerEdit, files, activeFileIndex, showMinimap, fontSize } = useApp();
  const file = files[activeFileIndex];
  const scrollRef = useRef<HTMLTextAreaElement>(null);

  // Sync textarea with codeLines
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.value = codeLines.join('\n');
    }
  }, [activeFileIndex]); // Reset when file changes

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.currentTarget.value;
    const lines = text.split('\n');
    setCodeLines(lines);
    registerEdit();
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background relative">
      <textarea
        ref={scrollRef}
        className="flex-1 font-mono p-4 outline-none resize-none bg-background text-foreground"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.5',
          whiteSpace: 'pre',
          overflowWrap: 'normal',
        }}
        onChange={handleInput}
        defaultValue={codeLines.join('\n')}
        placeholder="// Start typing code here..."
      />

      {/* Minimap */}
      {showMinimap && (
        <div className="w-16 shrink-0 border-l border-border bg-card/50 overflow-hidden relative">
          <div className="p-1" />
          {/* Viewport indicator */}
          <div className="absolute top-0 left-0 right-0 h-8 border border-primary/30 bg-primary/5 rounded-sm" />
        </div>
      )}
    </div>
  );
}
