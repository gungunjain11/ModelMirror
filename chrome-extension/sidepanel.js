// ModelMirror Side Panel — UI Logic v1.1

const editor          = document.getElementById('editor');
const charCount       = document.getElementById('char-count');
const langSelect      = document.getElementById('lang-select');
const statusEl        = document.getElementById('status');
const statusText      = document.getElementById('status-text');
const resultEl        = document.getElementById('result');
const serverDot       = document.getElementById('server-dot');
const serverLabel     = document.getElementById('server-label');
const healthBtn       = document.getElementById('health-btn');
const grabBtn         = document.getElementById('grab-btn');
const selectionBanner = document.getElementById('selection-banner');
const selectionPreview= document.getElementById('selection-preview');
const selUseBtn       = document.getElementById('sel-use-btn');
const selDismissBtn   = document.getElementById('sel-dismiss-btn');

let pendingSelection = '';
let lastAction = '';

// ── Tab switching ──────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');
  });
});

// ── Character count ────────────────────────────────────────────────────────
editor.addEventListener('input', () => {
  charCount.textContent = editor.value.length.toLocaleString() + ' chars';
});

// ── Tab key in editor ──────────────────────────────────────────────────────
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = editor.selectionStart;
    editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
    editor.selectionStart = editor.selectionEnd = s + 2;
  }
});

// ── Status helpers ─────────────────────────────────────────────────────────
function setStatus(msg, state) {
  statusText.textContent = msg;
  statusEl.className = state || '';
}

function setLoading(on) {
  document.querySelectorAll('.action-btn').forEach(b => (b.disabled = on));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// ── Selection / grab ───────────────────────────────────────────────────────
function showBanner(text) {
  pendingSelection = text;
  const preview = text.trim().slice(0, 80).replace(/\s+/g, ' ');
  selectionPreview.textContent = preview + (text.length > 80 ? '…' : '');
  selectionBanner.classList.add('visible');
}

function hideBanner() {
  selectionBanner.classList.remove('visible');
  pendingSelection = '';
}

selUseBtn.addEventListener('click', () => {
  if (pendingSelection) {
    editor.value = pendingSelection;
    charCount.textContent = pendingSelection.length.toLocaleString() + ' chars';
    hideBanner();
    setStatus('Code loaded from page ✓', 'ok');
    editor.focus();
  }
});

selDismissBtn.addEventListener('click', hideBanner);

grabBtn.addEventListener('click', async () => {
  grabBtn.textContent = 'Grabbing…';
  grabBtn.disabled = true;

  try {
    console.log('[Sidepanel] Sending get_selection request...');
    const response = await chrome.runtime.sendMessage({ action: 'get_selection' });
    console.log('[Sidepanel] Got response:', response);

    if (response && response.text) {
      const text = response.text.trim();
      console.log('[Sidepanel] Grabbed text length:', text.length);
      
      if (text.length > 0) {
        editor.value = text;
        charCount.textContent = text.length.toLocaleString() + ' chars';
        setStatus('Code loaded from page ✓', 'ok');
        editor.focus();
      } else {
        setStatus('No text selected on the page. Highlight some code first.', 'error');
      }
    } else {
      console.log('[Sidepanel] Empty response:', response);
      setStatus('No text selected on the page. Highlight some code first.', 'error');
    }
  } catch (err) {
    console.error('[Sidepanel] Error:', err);
    setStatus('Could not read page selection.', 'error');
  } finally {
    grabBtn.innerHTML = '<div class="grab-pulse"></div> Grab from page';
    grabBtn.disabled = false;
  }
});

// ── Render helpers ─────────────────────────────────────────────────────────
const LABEL_COLORS = {
  'Explanation': '#3abfcf',
  'Intent':      '#6366f1',
  'Before':      '#a855f7',
  'After':       '#22c55e',
  'Why':         '#3abfcf',
  'Tests':       '#f0c94a',
  'Bugs Found':  '#f06060',
};

function field(label, value, isCode) {
  const color = LABEL_COLORS[label] || '#4a5578';
  const extraClass = label === 'Explanation' ? 'explanation-text' : label === 'Why' ? 'why-text' : '';
  const valueClass = isCode ? 'field-value code-block' : `field-value ${extraClass}`;

  if (isCode) {
    return `
      <div class="field">
        <div class="field-label">
          <span style="width:3px;height:3px;border-radius:50%;background:${color};display:inline-block;"></span>
          ${escapeHtml(label)}
        </div>
        <div class="code-wrap">
          <div class="${valueClass}">${escapeHtml(value)}</div>
          <button class="copy-btn" data-code="${escapeHtml(value)}">Copy</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="field">
      <div class="field-label">
        <span style="width:3px;height:3px;border-radius:50%;background:${color};display:inline-block;"></span>
        ${escapeHtml(label)}
      </div>
      <div class="${valueClass}">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderBugs(bugs) {
  if (!Array.isArray(bugs) || bugs.length === 0) {
    return '<div class="placeholder-text">No bugs found — code looks clean ✓</div>';
  }

  let html = `<div class="result-title">🐛 ${bugs.length} Issue${bugs.length !== 1 ? 's' : ''} Found</div>`;
  html += '<div class="bugs-list">';

  bugs.forEach(bug => {
    const sev = (bug.severity || 'info').toLowerCase();
    html += `
      <div class="bug-item sev-${sev}">
        <div class="bug-header">
          <span class="bug-severity">${escapeHtml(sev)}</span>
          <span class="bug-type">${escapeHtml(bug.type || 'Issue')}</span>
        </div>
        <div class="bug-desc">${escapeHtml(bug.description || '')}</div>
        ${bug.fix ? `<div class="bug-fix-wrap"><div class="bug-fix-label">Fix</div><div class="bug-fix">${escapeHtml(bug.fix)}</div></div>` : ''}
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function renderResult(data, action) {
  if (!data) {
    resultEl.innerHTML = '<div class="error-box"><div class="error-title">No data returned</div><div class="error-msg">The server returned an empty response.</div></div>';
    attachCopyListeners();
    return;
  }

  let html = '';

  // Handle test context questions
  if (data.context_questions) {
    html = `
      <div class="result-title">${escapeHtml(data.title || 'Test Generation - More Info Needed')}</div>
      <div class="field" style="margin-bottom: 12px;">
        <div class="field-value explanation-text">${escapeHtml(data.explanation || '')}</div>
      </div>
      
      <div style="background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 11px;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--muted); margin-bottom: 10px; font-family: var(--mono);">Purpose of Code</div>
        <textarea id="ctx-purpose" style="width: 100%; background: var(--bg2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius); padding: 7px 9px; font-family: var(--mono); font-size: 11px; resize: none; outline: none; margin-bottom: 10px; min-height: 60px;" placeholder="What is the primary purpose of this code?"></textarea>
        
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--muted); margin-bottom: 10px; font-family: var(--mono);">Expected Output</div>
        <textarea id="ctx-output" style="width: 100%; background: var(--bg2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius); padding: 7px 9px; font-family: var(--mono); font-size: 11px; resize: none; outline: none; margin-bottom: 10px; min-height: 60px;" placeholder="What should be the expected output?"></textarea>
        
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--muted); margin-bottom: 10px; font-family: var(--mono);">Edge Cases & Constraints</div>
        <textarea id="ctx-edge" style="width: 100%; background: var(--bg2); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius); padding: 7px 9px; font-family: var(--mono); font-size: 11px; resize: none; outline: none; margin-bottom: 12px; min-height: 60px;" placeholder="Any specific edge cases?"></textarea>
        
        <button id="ctx-submit-btn" style="width: 100%; padding: 8px; background: linear-gradient(135deg,#2d6de0,#4f8cff); color: #fff; border: none; border-radius: var(--radius); font-family: var(--mono); font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; letter-spacing: 0.5px; text-transform: uppercase;">Generate Tests with Context</button>
      </div>
      
      <div style="font-size: 9px; color: var(--muted); margin-top: 8px; font-family: var(--mono); line-height: 1.6;">💡 Providing context helps generate more meaningful test cases.</div>
    `;
    
    resultEl.innerHTML = html;
    const submitBtn = document.getElementById('ctx-submit-btn');
    submitBtn.addEventListener('click', async () => {
      const purpose = document.getElementById('ctx-purpose').value.trim();
      const output = document.getElementById('ctx-output').value.trim();
      const edge = document.getElementById('ctx-edge').value.trim();
      
      if (!purpose || !output) {
        setStatus('Please fill in Purpose and Expected Output.', 'error');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating…';
      const code = editor.value.trim();
      const language = langSelect.value;
      const context = { purpose, expected_output: output, edge_cases: edge };
      
      setLoading(true);
      setStatus('Generating tests…', 'loading');
      try {
        const response = await chrome.runtime.sendMessage({ action: 'generate_tests', code, language, context });
        setLoading(false);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Tests with Context';
        if (!response || !response.ok) {
          renderError(response?.error || 'Unknown error');
          setStatus('Failed.', 'error');
          return;
        }
        renderResult(response.data, 'generate_tests');
        setStatus('Done ✓', 'ok');
      } catch (err) {
        renderError('Could not reach the extension background.');
        setStatus('Failed.', 'error');
        setLoading(false);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Tests with Context';
      }
    });
    return;
  }

  if (action === 'find_bugs') {
    // If full_code is returned, show the fixed code; otherwise show individual bugs
    if (data.full_code) {
      html = `<div class="result-title">✓ Fixed Code</div>`;
      html += '<div class="field-divider"></div>';
      html += field('Fixed Code', data.full_code, true);
      if (data.explanation) {
        html += '<div class="field-divider"></div>';
        html += field('Summary', data.explanation);
      }
    } else {
      html = renderBugs(data.bugs || []);
      if (data.explanation) {
        html += '<div class="field-divider"></div>';
        html += field('Explanation', data.explanation);
      }
      if (data.bugs && data.bugs.length > 0) {
        html += '<div class="field-divider"></div>';
        html += `<button id="full-fixed-code-btn" style="width: 100%; padding: 10px; background: linear-gradient(135deg,#f07070,#f5a84a); color: #fff; border: none; border-radius: var(--radius); font-family: var(--mono); font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px;">Show Full Fixed Code</button>`;
      }
    }
  } else {
    if (data.title) {
      html += `<div class="result-title">${escapeHtml(data.title)}</div>`;
    }
    if (data.explanation) html += field('Explanation', data.explanation);
    if (data.intent) html += field('Intent', data.intent);

    if (action === 'generate_tests' && data.fix_after) {
      html += '<div class="field-divider"></div>';
      html += field('Tests', data.fix_after, true);
    } else {
      if (data.fix_before) {
        html += '<div class="field-divider"></div>';
        html += field('Before', data.fix_before, true);
      }
      if (data.fix_after) {
        html += field('After', data.fix_after, true);
      }
    }

    if (data.why) {
      html += '<div class="field-divider"></div>';
      html += field('Why', data.why);
    }

    if (action === 'optimize') {
      html += '<div class="field-divider"></div>';
      html += `<button id="full-solution-btn" style="width: 100%; padding: 10px; background: linear-gradient(135deg,#00a8b0,#00C6CF); color: #fff; border: none; border-radius: var(--radius); font-family: var(--mono); font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px;">Show Full Solution</button>`;
    }


  }

  resultEl.innerHTML = html || '<div class="placeholder-text">Empty response from server.</div>';
  attachCopyListeners();

  if (action === 'optimize') {
    const btn = document.getElementById('full-solution-btn');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Getting full solution…';
        setLoading(true);
        setStatus('Generating full code…', 'loading');
        try {
          const r = await chrome.runtime.sendMessage({ action: 'optimize', code: editor.value.trim(), language: langSelect.value, fullSolution: true });
          setLoading(false);
          btn.disabled = false;
          btn.textContent = 'Show Full Solution';
          if (!r || !r.ok) { renderError(r?.error || 'Error'); setStatus('Failed.', 'error'); return; }
          renderResult(r.data, 'optimize');
          setStatus('Done ✓', 'ok');
        } catch (e) { renderError('Connection failed.'); setStatus('Failed.', 'error'); setLoading(false); btn.disabled = false; btn.textContent = 'Show Full Solution'; }
      });
    }
  }

  if (action === 'find_bugs') {
    const btn = document.getElementById('full-fixed-code-btn');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Generating…';
        setLoading(true);
        setStatus('Generating full fixed code…', 'loading');
        try {
          const r = await chrome.runtime.sendMessage({ action: 'find_bugs', code: editor.value.trim(), language: langSelect.value, fullSolution: true });
          setLoading(false);
          btn.disabled = false;
          btn.textContent = 'Show Full Fixed Code';
          if (!r || !r.ok) { renderError(r?.error || 'Error'); setStatus('Failed.', 'error'); return; }
          renderResult(r.data, 'find_bugs');
          setStatus('Done ✓', 'ok');
        } catch (e) { renderError('Connection failed.'); setStatus('Failed.', 'error'); setLoading(false); btn.disabled = false; btn.textContent = 'Show Full Fixed Code'; }
      });
    }
  }


}

function renderError(errorText) {
  resultEl.innerHTML = `<div class="error-box"><div class="error-title">⚠ Request Failed</div><div class="error-msg">${escapeHtml(errorText || 'Unknown error.')}</div></div>`;
}

function attachCopyListeners() {
  resultEl.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code || '';
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });
}

async function analyze(action) {
  lastAction = action;
  const code = editor.value.trim();
  if (!code) {
    setStatus('No code — paste some or grab from the page.', 'error');
    return;
  }

  const language = langSelect.value;
  setLoading(true);
  setStatus('Analyzing…', 'loading');
  resultEl.innerHTML = '<div class="placeholder-text">Working on it…</div>';

  try {
    const response = await chrome.runtime.sendMessage({ action, code, language });
    setLoading(false);
    if (!response || !response.ok) {
      renderError(response?.error || 'Unknown error');
      setStatus('Failed.', 'error');
      return;
    }
    renderResult(response.data, action);
    setStatus('Done ✓', 'ok');
  } catch (err) {
    renderError('Could not reach the extension background.');
    setStatus('Failed.', 'error');
    setLoading(false);
  }
}

document.getElementById('btn-explain').addEventListener('click', () => analyze('explain'));
document.getElementById('btn-refactor').addEventListener('click', () => analyze('refactor'));
document.getElementById('btn-optimize').addEventListener('click', () => analyze('optimize'));
document.getElementById('btn-tests').addEventListener('click', () => analyze('generate_tests'));
document.getElementById('btn-bugs').addEventListener('click', () => analyze('find_bugs'));

async function checkHealth(showInResult) {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'health' });
    if (response && response.ok) {
      serverDot.className = 'dot online';
      serverLabel.textContent = 'online';
      if (showInResult) {
        resultEl.innerHTML = `<div class="field"><div class="field-label"><span style="width:4px;height:4px;border-radius:50%;background:#34d399;display:inline-block;"></span>Server Status</div><div class="field-value" style="color:#34d399;">✓ Reachable — ${escapeHtml(response.message || 'Running')}</div></div>`;
      }
    } else {
      serverDot.className = 'dot offline';
      serverLabel.textContent = 'offline';
      if (showInResult) {
        resultEl.innerHTML = `<div class="error-box"><div class="error-title">Server Offline</div><div class="error-msg">${escapeHtml(response?.error || 'Cannot connect.')}</div></div>`;
      }
    }
  } catch (err) {
    serverDot.className = 'dot offline';
    serverLabel.textContent = 'offline';
    if (showInResult) {
      resultEl.innerHTML = `<div class="error-box"><div class="error-title">Server Offline</div><div class="error-msg">Start the server with: node server.js</div></div>`;
    }
  }
}

healthBtn.addEventListener('click', () => checkHealth(true));
checkHealth(false);

const setServerUrl = document.getElementById('set-server-url');
const setApiKey = document.getElementById('set-api-key');
const setModel = document.getElementById('set-model');
const saveBtn = document.getElementById('save-settings');
const saveFeedback = document.getElementById('save-feedback');

chrome.storage.local.get(['serverUrl', 'apiKey', 'model'], (data) => {
  if (data.serverUrl) setServerUrl.value = data.serverUrl;
  if (data.apiKey) setApiKey.value = data.apiKey;
  if (data.model) setModel.value = data.model;
});

saveBtn.addEventListener('click', () => {
  const settings = {
    serverUrl: setServerUrl.value.trim() || 'http://localhost:3000',
    apiKey: setApiKey.value.trim(),
    model: setModel.value.trim() || 'openai/gpt-4o-mini',
  };
  chrome.storage.local.set(settings, () => {
    saveFeedback.textContent = '✓ Settings saved';
    setTimeout(() => { saveFeedback.textContent = ''; }, 2500);
  });
});
