import { Copy } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DiffGenerator } from '@/lib/diffGenerator';
import { ActivityTracker } from '@/lib/activityTracker';

export function DiffView() {
  const { codeLines } = useApp();
  const [copied, setCopied] = useState(false);

  // Get initial code for comparison
  const currentCode = codeLines.join('\n');
  
  // Get original code (simulated - in real app would come from version control)
  const originalCode = `// Authentication Service
// Handles JWT token generation and validation

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const SECRET_KEY = "hardcoded_secret_123"  // ← security issue

async function authenticateUser(username, password) {
  const user = db.findUser(username)  // missing await
  
  if (!user) {
    return null
  }
  
  const isValid = bcrypt.compare(password, user.passwordHash)  // missing await
  
  if (isValid) {
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    )
    return token
  }
}

async function validateToken(token) {
  const decoded = jwt.verify(token, SECRET_KEY)
  return decoded
  // no try/catch — throws on invalid token
}

async function refreshToken(oldToken) {
  const decoded = validateToken(oldToken)  // missing await
  
  const newToken = jwt.sign(
    { userId: decoded.userId, role: decoded.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  )
  return newToken
}`;

  const diff = DiffGenerator.generateDiff(originalCode, currentCode);
  const summary = DiffGenerator.generateSummary(diff);

  const handleCopyPatch = async () => {
    const patch = DiffGenerator.generatePatch(originalCode, currentCode);
    await navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Changes Made</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground">{summary}</span>
          <button 
            onClick={handleCopyPatch}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-[0.97]">
            <Copy size={10} /> {copied ? 'Copied!' : 'Copy patch'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 overflow-auto">
        {/* Before */}
        <div className="rounded border border-border overflow-auto">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground px-3 py-1.5 bg-accent/50 border-b border-border sticky top-0">Original</div>
          <div className="font-mono text-[11px] leading-5">
            {diff.before.map((line, i) => (
              <div 
                key={i} 
                className={`px-3 flex ${line.type === 'removed' ? 'bg-mm-red/10' : ''}`}
              >
                <span className="w-6 text-muted-foreground/40 text-right pr-2 select-none shrink-0">
                  {line.oldLineNum}
                </span>
                <span className={line.type === 'removed' ? 'text-mm-red' : 'text-foreground'}>
                  {line.text || '\u00A0'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* After */}
        <div className="rounded border border-border overflow-auto">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground px-3 py-1.5 bg-accent/50 border-b border-border sticky top-0">Current</div>
          <div className="font-mono text-[11px] leading-5">
            {diff.after.map((line, i) => (
              <div 
                key={i}
                className={`px-3 flex ${line.type === 'added' ? 'bg-mm-green/10' : ''}`}
              >
                <span className="w-6 text-muted-foreground/40 text-right pr-2 select-none shrink-0">
                  {line.newLineNum}
                </span>
                <span className={line.type === 'added' ? 'text-mm-green' : 'text-foreground'}>
                  {line.text || '\u00A0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
