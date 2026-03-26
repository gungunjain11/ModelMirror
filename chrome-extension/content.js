// ModelMirror Content Script — captures text selections on the page
let lastSelection = '';

function captureSelection() {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Get the selected text
    let text = sel.toString().trim();
    
    // Also try focused element (textarea/input)
    const activeEl = document.activeElement;
    if (!text && activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd).trim();
    }

    if (text && text.length > 0) {
      lastSelection = text;
      console.log('[Content] Selected:', text.length, 'chars');
    }
  } catch (e) {
    console.error('[Content] Capture error:', e.message);
  }
}

// Listen for selections - use capture phase to catch early
document.addEventListener('mouseup', captureSelection, true);
document.addEventListener('touchend', captureSelection, true);
document.addEventListener('keyup', captureSelection, true);
document.addEventListener('selectionchange', captureSelection);

// Respond to background script requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_cached_selection') {
    console.log('[Content] Sending cached selection:', lastSelection.length, 'chars');
    sendResponse({ ok: true, text: lastSelection });
    return true;
  }
});
