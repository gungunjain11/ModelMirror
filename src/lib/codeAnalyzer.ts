// Real code analysis system for detecting stuck patterns and generating insights

export interface CodeIssue {
  line: number;
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
}

export interface StuckIndicator {
  type: 'idle' | 'backspace-loop' | 'lint-error' | 'syntax-error' | 'complexity';
  confidence: number;
  reason: string;
  affectedLines?: number[];
}

export class CodeAnalyzer {
  /**
   * Analyze code for common issues and patterns
   */
  static analyzeCode(code: string): CodeIssue[] {
    const lines = code.split('\n');
    const issues: CodeIssue[] = [];

    // Check for common security issues
    issues.push(...this.detectSecurityIssues(code, lines));
    
    // Check for code quality issues
    issues.push(...this.detectQualityIssues(code, lines));
    
    // Check for performance issues
    issues.push(...this.detectPerformanceIssues(code, lines));
    
    return issues.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private static detectSecurityIssues(code: string, lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Hardcoded secrets
    if (/SECRET|PASSWORD|API_KEY|TOKEN/.test(code) && /"[a-zA-Z0-9_]{10,}"/.test(code)) {
      const lineNum = lines.findIndex(l => /SECRET|PASSWORD|API_KEY/.test(l)) + 1;
      issues.push({
        line: lineNum,
        type: 'error',
        severity: 'high',
        message: 'Hardcoded secret detected',
        suggestion: 'Use environment variables (process.env.SECRET_KEY)',
      });
    }

    // SQL injection patterns
    if (/query.*\+|query.*\$\{/.test(code)) {
      const lineNum = lines.findIndex(l => /query.*\+|query.*\$\{/.test(l)) + 1;
      issues.push({
        line: lineNum,
        type: 'warning',
        severity: 'high',
        message: 'Potential SQL injection vulnerability',
        suggestion: 'Use parameterized queries or prepared statements',
      });
    }

    // Missing await on async
    const asyncLines = lines.filter(l => /async\s+function|async\s*\(/.test(l));
    if (asyncLines.length > 0) {
      lines.forEach((line, idx) => {
        if (/await.*\(.*\)|[a-zA-Z]\s*\(/.test(line) && !line.includes('await') && 
            /findUser|db\.|fetch|Promise/.test(line)) {
          issues.push({
            line: idx + 1,
            type: 'warning',
            severity: 'medium',
            message: 'Missing await on async operation',
            suggestion: 'Add await before the async call',
          });
        }
      });
    }

    return issues;
  }

  private static detectQualityIssues(code: string, lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Missing error handling
    if (/\.json\(\)|fetch|db\.|Promise/.test(code) && !/try|catch|\.catch/.test(code)) {
      issues.push({
        line: 1,
        type: 'warning',
        severity: 'medium',
        message: 'Async operations without error handling',
        suggestion: 'Wrap in try-catch or add .catch() handler',
      });
    }

    // Deeply nested callbacks
    const nestingLevel = Math.max(
      ...(code.match(/\{/g) || []).map((_, i, arr) => 
        arr.slice(0, i + 1).filter(c => c === '{').length -
        arr.slice(0, i + 1).filter(c => c === '}').length
      ),
      0
    );
    if (nestingLevel > 4) {
      issues.push({
        line: 1,
        type: 'info',
        severity: 'low',
        message: `High nesting depth detected (${nestingLevel} levels)`,
        suggestion: 'Consider extracting nested logic into separate functions',
      });
    }

    // Empty functions
    if (/{\s*}|{\s*\/\/\s*}/.test(code)) {
      const lineNum = lines.findIndex(l => /{\s*}/.test(l)) + 1;
      if (lineNum > 0) {
        issues.push({
          line: lineNum,
          type: 'info',
          severity: 'low',
          message: 'Empty code block',
          suggestion: 'Implement the function or remove it',
        });
      }
    }

    return issues;
  }

  private static detectPerformanceIssues(code: string, lines: string[]): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // N+1 queries
    if (/for\s*\(|forEach|map.*\(|\.find\(/.test(code) && /db\.|query|fetch/.test(code)) {
      const lineNum = lines.findIndex(l => /for\s*\(|forEach|map/.test(l)) + 1;
      issues.push({
        line: lineNum,
        type: 'warning',
        severity: 'medium',
        message: 'Potential N+1 query pattern detected',
        suggestion: 'Batch database queries or use JOIN operations',
      });
    }

    // Inefficient loops
    if (/\.indexOf|\.includes|\.find/.test(code) && /for.*in|for.*of/.test(code)) {
      issues.push({
        line: 1,
        type: 'info',
        severity: 'low',
        message: 'Consider using efficient data structures',
        suggestion: 'Use Set/Map for lookups instead of indexOf/includes',
      });
    }

    return issues;
  }

  /**
   * Detect if developer is stuck based on edit patterns
   */
  static detectStuckPatterns(
    keystrokeHistory: number[],
    backspaceCount: number,
    lineEdits: Map<number, number>
  ): StuckIndicator[] {
    const indicators: StuckIndicator[] = [];

    // Pattern 1: Backspace loop (changing same line repeatedly)
    if (backspaceCount > 5) {
      const mostEditedLine = Array.from(lineEdits.entries()).reduce((a, b) => 
        b[1] > a[1] ? b : a, [0, 0]
      );
      
      if (mostEditedLine[1] > 3) {
        indicators.push({
          type: 'backspace-loop',
          confidence: Math.min(0.95, 0.5 + (backspaceCount / 20)),
          reason: `Line ${mostEditedLine[0]} edited ${mostEditedLine[1]} times`,
          affectedLines: [mostEditedLine[0]],
        });
      }
    }

    // Pattern 2: Stagnant keystroke rate (low typing speed)
    const recentKPS = keystrokeHistory.slice(-5);
    if (recentKPS.length > 0) {
      const avgKPS = recentKPS.reduce((a, b) => a + b, 0) / recentKPS.length;
      if (avgKPS < 10) {
        indicators.push({
          type: 'idle',
          confidence: Math.min(0.85, 0.2 + (1 - avgKPS / 20)),
          reason: `Very low keystroke rate: ${Math.round(avgKPS)} KPM`,
        });
      }
    }

    // Pattern 3: Complexity spike (many issues in short code)
    const issues = this.analyzeCode(''); // Will be called with actual code
    if (issues.filter(i => i.severity === 'high').length > 2) {
      indicators.push({
        type: 'complexity',
        confidence: 0.7,
        reason: `Multiple high-severity issues detected`,
      });
    }

    return indicators;
  }

  /**
   * Calculate code complexity score
   */
  static getComplexityScore(code: string): number {
    let score = 0;

    // Cyclomatic complexity
    const conditions = (code.match(/if|else|case|for|while|catch|\?\s*\w+\s*:/g) || []).length;
    score += conditions * 2;

    // Function size
    const lines = code.split('\n').length;
    score += Math.max(0, lines - 50) * 0.5;

    // Nesting depth
    let maxNesting = 0;
    let currentNesting = 0;
    for (const char of code) {
      if (char === '{') currentNesting++;
      if (char === '}') currentNesting--;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    score += maxNesting * 3;

    return Math.round(score);
  }
}
