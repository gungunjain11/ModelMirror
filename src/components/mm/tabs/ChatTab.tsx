import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { APIClient } from '@/config/apiConfig';
import { Send } from 'lucide-react';

const chips = ['Why is this slow?', 'Add error handling', "Explain like I'm 5", "What's the security risk?"];

function TypewriterText({ text, speed = 25, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayed}<span className="animate-pulse">▊</span></>;
}

export function ChatTab() {
  const { codeLines } = useApp();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setStreaming(true);
    setError(null);

    try {
      const code = codeLines.join('\n');
      const reply = await APIClient.chat(
        `User question: ${text}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
        undefined,
        'You are a coding mentor. Provide helpful hints and guidance without giving full solutions. Help the user understand concepts and guide them toward solutions.'
      );

      setStreamText(reply);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: reply }]);
        setStreaming(false);
        setStreamText('');
      }, 200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      setStreaming(false);
    }
  };

  const handleStreamDone = () => {
    setMessages(prev => [...prev, { role: 'ai', content: streamText }]);
    setStreaming(false);
    setStreamText('');
  };

  const renderContent = (content: string) => {
    // Simple code block detection
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
        return (
          <div key={i} className="bg-background rounded border border-border p-2 my-1.5 font-mono text-[10px] leading-4 overflow-x-auto whitespace-pre">
            {code}
          </div>
        );
      }
      // Inline code
      const inlineParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={i}>
          {inlineParts.map((ip, j) =>
            ip.startsWith('`') ? (
              <code key={j} className="bg-accent px-1 py-0.5 rounded text-[11px] font-mono">{ip.slice(1, -1)}</code>
            ) : ip
          )}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            Start a conversation by asking about the code
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-foreground'
            }`}>
              {msg.role === 'ai' ? (
                <div><span className="text-primary font-semibold text-[10px]">ModelMirror</span><div className="mt-1">{renderContent(msg.content)}</div></div>
              ) : msg.content}
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-lg px-3 py-2 text-[12px] leading-relaxed bg-accent text-foreground">
              <span className="text-primary font-semibold text-[10px]">ModelMirror</span>
              <div className="mt-1">
                <TypewriterText text={streamText} speed={20} onDone={handleStreamDone} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-lg px-3 py-2 text-[12px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
              {error}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chips */}
      <div className="px-3 pb-1 flex flex-wrap gap-1">
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => setInput(chip)}
            className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask about this code..."
          disabled={streaming}
          className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={streaming}
          className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.95] disabled:opacity-50"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
