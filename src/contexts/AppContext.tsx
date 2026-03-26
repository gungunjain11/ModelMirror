import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { FILES, MOCK_SUGGESTIONS, type FileInfo } from '@/data/mockCode';
import { APIClient } from '@/config/apiConfig';

export type View = 'editor' | 'chat' | 'analytics' | 'diff' | 'settings';
export type DemoStatus = 'watching' | 'stuck-detected' | 'fetching' | 'idle';
export type RightTab = 'suggestions' | 'explain' | 'refactor' | 'tests' | 'chat';

interface LogEntry {
  time: string;
  icon: string;
  message: string;
  id: string;
}

interface Suggestion {
  id: string;
  type: 'Fix' | 'Security' | 'Performance' | 'Edge' | 'Readability';
  confidence: number;
  title: string;
  explanation: string;
  code: string;
  targetLine: number;
  borderColor: string;
  status: 'pending' | 'applied' | 'dismissed';
}

interface AppState {
  activeView: View;
  setActiveView: (v: View) => void;
  activeFileIndex: number;
  setActiveFileIndex: (i: number) => void;
  files: FileInfo[];
  addNewFile: (name: string) => void;
  deleteFile: (index: number) => void;
  codeLines: string[];
  setCodeLines: (lines: string[]) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  drawerOpen: boolean;
  setDrawerOpen: (o: boolean) => void;
  rightTab: RightTab;
  setRightTab: (t: RightTab) => void;
  drawerTab: 'log' | 'timeline' | 'heatmap';
  setDrawerTab: (t: 'log' | 'timeline' | 'heatmap') => void;
  demoStatus: DemoStatus;
  suggestions: Suggestion[];
  logs: LogEntry[];
  appliedLines: Set<number>;
  stuckLine: number | null;
  flashLine: number | null;
  runDemo: () => void;
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  registerEdit: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  idleThreshold: number;
  setIdleThreshold: (n: number) => void;
  showMinimap: boolean;
  setShowMinimap: (b: boolean) => void;
  showLineHighlight: boolean;
  setShowLineHighlight: (b: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const idleTimer = useRef<number | null>(null);
  const hintLevelRef = useRef(0);
  const editCountRef = useRef(0);
  const [activeView, setActiveView] = useState<View>('editor');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>('suggestions');
  const [drawerTab, setDrawerTab] = useState<'log' | 'timeline' | 'heatmap'>('log');
  const [demoStatus, setDemoStatus] = useState<DemoStatus>('idle');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '00:00', icon: '●', message: 'Session started — auth_service.js', id: 'l0' },
  ]);
  const [appliedLines, setAppliedLines] = useState<Set<number>>(new Set());
  const [stuckLine, setStuckLine] = useState<number | null>(null);
  const [flashLine, setFlashLine] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [idleThreshold, setIdleThreshold] = useState(28);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLineHighlight, setShowLineHighlight] = useState(true);
  const [fileList, setFileList] = useState<FileInfo[]>(FILES);

  const activeFile = fileList[activeFileIndex];
  const [codeLines, setCodeLines] = useState<string[]>(activeFile.code.split('\n'));
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    // ONLY reset when file changes
    if (activeFileIndex >= fileList.length) return;
    
    const newCode = fileList[activeFileIndex].code.split('\n');

    setCodeLines(prev => {
      // prevent overwriting user typing
      if (prev.join('\n') !== newCode.join('\n')) {
        return newCode;
      }
      return prev;
    });

    setAppliedLines(new Set());
    setStuckLine(null);
    setFlashLine(null);
  }, [activeFileIndex, fileList]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Start dark
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = useCallback(() => setIsDark(d => !d), []);

  const addLog = useCallback((icon: string, message: string, timeSec: number) => {
    const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
    const ss = String(timeSec % 60).padStart(2, '0');
    setLogs(prev => [...prev, { time: `${mm}:${ss}`, icon, message, id: `l-${Date.now()}-${Math.random()}` }]);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);
  const triggerAISuggestions = useCallback(async () => {
    setDemoStatus('fetching');

    try {
      const code = codeLines.join('\n');
      const text = await APIClient.chat(
        `You are a coding mentor.

Hint level: ${hintLevelRef.current}

Level 0: very vague hints
Level 1: more specific hints
Level 2: very specific hints

Give 2 concise hints only.

Code:
\`\`\`
${code}
\`\`\``,
        undefined,
        'You are a coding mentor who gives helpful hints. Match the hint level requested.'
      );

      const lines = text.split("\n").filter((l: string) => l.trim() && !l.startsWith('Hint'));

      const aiSuggestions = lines.map((line: string, i: number) => ({
        id: "ai-" + i,
        type: "Hint",
        confidence: 85,
        title: line,
        explanation: line,
        code: "",
        targetLine: 1,
        borderColor: "accent",
        status: "pending"
      }));

      setSuggestions(aiSuggestions);
      setDemoStatus('watching');
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      setDemoStatus('watching');
    }
  }, [codeLines]);
  const registerEdit = useCallback(() => {
    editCountRef.current += 1;

    // Save changes to current file
    setFileList(prev => {
      const updated = [...prev];
      updated[activeFileIndex].code = codeLines.join('\n');
      return updated;
    });

    if (editCountRef.current >= 5) {
      hintLevelRef.current += 1;
      triggerAISuggestions();
      editCountRef.current = 0;
    }
  }, [triggerAISuggestions, codeLines, activeFileIndex]);

  const runDemo = useCallback(() => {
    clearTimers();
    // Reset state
    setActiveFileIndex(0);
    setCodeLines(fileList[0].code.split('\n'));
    setSuggestions([]);
    setAppliedLines(new Set());
    setStuckLine(null);
    setFlashLine(null);
    setDemoStatus('watching');
    setRightTab('suggestions');
    setActiveView('editor');
    setLogs([{ time: '00:00', icon: '●', message: 'Session started', id: 'l-reset' }]);
  }, [fileList]);


const isFetchingRef = useRef(false);

useEffect(() => {
  if (idleTimer.current) {
    clearTimeout(idleTimer.current);
  }

  idleTimer.current = window.setTimeout(async () => {
  if (isFetchingRef.current) return;

  hintLevelRef.current = 0; 

  isFetchingRef.current = true;
  await triggerAISuggestions();
  isFetchingRef.current = false;

}, idleThreshold * 1000);

  return () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };
}, [codeLines]);


  const applySuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'applied' as const } : s));
    const sug = MOCK_SUGGESTIONS.find(s => s.id === id);
    if (sug) {
      setCodeLines(prev => {
        const next = [...prev];
        // Replace the target line with the fix
        if (sug.targetLine - 1 < next.length) {
          // Preserve indentation
          const original = next[sug.targetLine - 1];
          const indent = original.match(/^(\s*)/)?.[1] || '';
          next[sug.targetLine - 1] = indent + sug.code.trim();
        }
        return next;
      });
      setFlashLine(sug.targetLine);
      setTimeout(() => setFlashLine(null), 700);
      addLog('✓', `Applied: "${sug.title}"`, 18);
    }
  }, [addLog]);
  
  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'dismissed' as const } : s));
  }, []);

  const addNewFile = useCallback((name: string) => {
    const newFile: FileInfo = {
      name: name || 'untitled.js',
      language: name.endsWith('.py') ? 'Python' : 'JavaScript',
      code: '',
      status: 'warning',
      errorLines: [],
      errorMessages: {},
    };
    setFileList(prev => [...prev, newFile]);
    setActiveFileIndex(fileList.length);
    setCodeLines(['']);
    addLog('➕', `Created new file: ${newFile.name}`, 0);
  }, [fileList.length, addLog]);

  const deleteFile = useCallback((index: number) => {
    if (fileList.length <= 1) {
      addLog('❌', 'Cannot delete the last file', 0);
      return;
    }
    const deletedName = fileList[index].name;
    setFileList(prev => prev.filter((_, i) => i !== index));
    if (activeFileIndex === index) {
      setActiveFileIndex(Math.max(0, index - 1));
    }
    addLog('🗑️', `Deleted: ${deletedName}`, 0);
  }, [fileList, activeFileIndex, addLog]);

  return (
    <AppContext.Provider value={{
      activeView, setActiveView,
      activeFileIndex, setActiveFileIndex,
      files: fileList,
      addNewFile,
      deleteFile,
      codeLines, setCodeLines,
      sidebarOpen, setSidebarOpen,
      drawerOpen, setDrawerOpen,
      rightTab, setRightTab,
      drawerTab, setDrawerTab,
      demoStatus, suggestions, logs,
      appliedLines, stuckLine, flashLine,
      runDemo, applySuggestion, dismissSuggestion,
      isDark, toggleTheme,
      fontSize, setFontSize,
      idleThreshold, setIdleThreshold,
      showMinimap, setShowMinimap,
      showLineHighlight, setShowLineHighlight,
      registerEdit,
    }}>
      {children}
    </AppContext.Provider>
  );
}
