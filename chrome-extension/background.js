// ModelMirror Background Service Worker
// Handles: LLM calls, side panel setup, message routing, selection capture

const DEFAULT_SERVER_URL = 'http://localhost:3000';

async function getAnalyzeUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get(['serverUrl'], data => {
      const base = (data.serverUrl || DEFAULT_SERVER_URL).replace(/\/$/, '');
      resolve(`${base}/analyze`);
    });
  });
}

// Open side panel when extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(() => {});

// ── Selection capture ─────────────────────────────────────────────────────
// Primary method: directly execute script to get current selection
async function getSelectedText(tabId) {
  try {
    // Execute in the content's context to get live selection
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',  // Run in main world to access page's selections
      func: () => {
        const sel = window.getSelection && window.getSelection();
        if (!sel) return '';
        
        // Method 1: Direct toString
        let text = sel.toString();
        if (text.trim()) {
          console.log('[Grab] Method 1 (toString): ' + text.length + ' chars');
          return text;
        }
        
        // Method 2: Get from focused editor element if selection is on textarea/input
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
          text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
          if (text.trim()) {
            console.log('[Grab] Method 2 (activeElement): ' + text.length + ' chars');
            return text;
          }
        }
        
        // Method 3: Get contentEditable selection
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const container = range.commonAncestorContainer;
          if (container.nodeType === Node.ELEMENT_NODE || container.nodeType === Node.TEXT_NODE) {
            text = range.toString();
            if (text.trim()) {
              console.log('[Grab] Method 3 (range): ' + text.length + ' chars');
              return text;
            }
          }
        }
        
        return '';
      },
    });
    
    const text = results?.[0]?.result || '';
    console.log('[BG] Script execution got:', text.length, 'chars -', text.slice(0, 60));
    return text;
  } catch (err) {
    console.error('[BG] Script execution failed:', err.message);
    return '';
  }
}

// ── Message router ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    sendResponse({ ok: false, error: 'No action specified.' });
    return false;
  }

  if (message.action === 'health') {
    handleHealth(sendResponse);
    return true;
  }

  if (message.action === 'get_selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0]) {
        sendResponse({ ok: false, text: '' });
        return;
      }
      const text = await getSelectedText(tabs[0].id);
      sendResponse({ ok: true, text });
    });
    return true;
  }

  const validActions = ['explain', 'refactor', 'optimize', 'generate_tests', 'find_bugs'];
  if (!validActions.includes(message.action)) {
    sendResponse({ ok: false, error: 'Unknown action: ' + message.action });
    return false;
  }

  if (typeof message.code !== 'string' || message.code.trim() === '') {
    sendResponse({ ok: false, error: 'No code provided.' });
    return false;
  }

  handleAnalyze(message.action, message.code, message.language || '', message.intent || '', message.context || null, message.fullSolution || false, sendResponse);
  return true;
});

// ── Health check ──────────────────────────────────────────────────────────
async function handleHealth(sendResponse) {
  const analyzeUrl = await getAnalyzeUrl();
  const baseUrl = analyzeUrl.replace('/analyze', '');
  try {
    const response = await fetch(baseUrl, { method: 'GET' });
    const text = await response.text();
    if (response.ok) {
      sendResponse({ ok: true, message: text || 'Server is running.' });
    } else {
      sendResponse({ ok: false, error: `Server responded with status ${response.status}.` });
    }
  } catch (err) {
    sendResponse({ ok: false, error: `Cannot connect to server at ${baseUrl}. Make sure it is running.` });
  }
}

// ── Analyze ───────────────────────────────────────────────────────────────
async function handleAnalyze(action, code, language, intent, context, fullSolution, sendResponse) {
  const analyzeUrl = await getAnalyzeUrl();

  try {
    const payload = { code, language, action };
    if (context) {
      payload.context = context;
    }
    if (fullSolution) {
      payload.fullSolution = fullSolution;
    }

    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      sendResponse({
        ok: false,
        error: data.explanation || `Server error: ${response.status}`,
        data,
      });
      return;
    }

    sendResponse({ ok: true, data });
  } catch (err) {
    sendResponse({
      ok: false,
      error: 'Local server not running. Start server with: node server.js',
      data: null,
    });
  }
}
