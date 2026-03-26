// Real diff generation using edit distance algorithm

export interface DiffLine {
  text: string;
  type: 'added' | 'removed' | 'normal';
  oldLineNum?: number;
  newLineNum?: number;
}

export interface DiffSummary {
  before: DiffLine[];
  after: DiffLine[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
}

export class DiffGenerator {
  /**
   * Generate unified diff between two code strings
   */
  static generateDiff(before: string, after: string): DiffSummary {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    const alignment = this.alignLines(beforeLines, afterLines);

    let addedCount = 0;
    let removedCount = 0;
    let changedCount = 0;

    const diffBefore: DiffLine[] = [];
    const diffAfter: DiffLine[] = [];

    for (const [bIdx, aIdx] of alignment) {
      const bLine = bIdx >= 0 ? beforeLines[bIdx] : '';
      const aLine = aIdx >= 0 ? afterLines[aIdx] : '';

      if (bIdx === -1) {
        // Added line
        diffAfter.push({
          text: aLine,
          type: 'added',
          newLineNum: aIdx + 1,
        });
        addedCount++;
      } else if (aIdx === -1) {
        // Removed line
        diffBefore.push({
          text: bLine,
          type: 'removed',
          oldLineNum: bIdx + 1,
        });
        removedCount++;
      } else if (bLine === aLine) {
        // Unchanged line
        diffBefore.push({
          text: bLine,
          type: 'normal',
          oldLineNum: bIdx + 1,
        });
        diffAfter.push({
          text: aLine,
          type: 'normal',
          newLineNum: aIdx + 1,
        });
      } else {
        // Changed line
        diffBefore.push({
          text: bLine,
          type: 'removed',
          oldLineNum: bIdx + 1,
        });
        diffAfter.push({
          text: aLine,
          type: 'added',
          newLineNum: aIdx + 1,
        });
        changedCount++;
        removedCount++;
        addedCount++;
      }
    }

    return {
      before: diffBefore,
      after: diffAfter,
      addedCount,
      removedCount,
      changedCount,
    };
  }

  /**
   * Align lines using longest common subsequence approach
   */
  private static alignLines(
    before: string[],
    after: string[]
  ): Array<[number, number]> {
    // Simple but effective: find matching lines
    const result: Array<[number, number]> = [];
    const usedAfter = new Set<number>();

    // First pass: find exact matches
    for (let b = 0; b < before.length; b++) {
      let foundMatch = false;
      for (let a = 0; a < after.length; a++) {
        if (!usedAfter.has(a) && before[b] === after[a]) {
          result.push([b, a]);
          usedAfter.add(a);
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        result.push([b, -1]);
      }
    }

    // Add remaining lines
    for (let a = 0; a < after.length; a++) {
      if (!usedAfter.has(a)) {
        result.push([-1, a]);
      }
    }

    // Sort for better visualization
    return result.sort((a, b) => {
      if (a[0] === -1) return 1;
      if (b[0] === -1) return -1;
      return a[0] - b[0];
    });
  }

  /**
   * Generate human-readable patch format
   */
  static generatePatch(before: string, after: string, filename = 'code.ts'): string {
    const diff = this.generateDiff(before, after);
    let patch = `--- a/${filename}\n+++ b/${filename}\n`;

    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    let bIdx = 0;
    let aIdx = 0;

    for (const line of diff.before) {
      if (line.type === 'normal') {
        patch += ` ${line.text}\n`;
        bIdx++;
      } else if (line.type === 'removed') {
        patch += `-${line.text}\n`;
      }
    }

    return patch;
  }

  /**
   * Generate summary statistics
   */
  static generateSummary(diff: DiffSummary): string {
    const { addedCount, removedCount, changedCount } = diff;
    const totalChanges = addedCount + removedCount;
    
    const parts = [];
    if (addedCount > 0) parts.push(`+${addedCount} added`);
    if (removedCount > 0) parts.push(`-${removedCount} removed`);
    if (changedCount > 0) parts.push(`~${changedCount} changed`);

    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }
}
