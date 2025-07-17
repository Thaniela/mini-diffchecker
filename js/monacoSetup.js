import { setupTextComparison, setupEditorFileOpeners, setupClearButton } from './domHandlers.js';

require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });

require(['vs/editor/editor.main'], function () {
  window.editor1 = monaco.editor.create(document.getElementById('editor1'), {
    value: '',
    language: 'plaintext',
    lineNumbers: 'on',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    renderIndicators: false,
    stickyScroll: { enabled: false },
    scrollBeyondLastLine: true,
    largeFileOptimizations: true,
    maxTokenizationLineLength: 20000,
  });

  window.editor2 = monaco.editor.create(document.getElementById('editor2'), {
    value: '',
    language: 'plaintext',
    lineNumbers: 'on',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    renderIndicators: false,
    stickyScroll: { enabled: false },
    scrollBeyondLastLine: true,
    largeFileOptimizations: true,
  maxTokenizationLineLength: 20000,
  });

  window.diffEditor = monaco.editor.createDiffEditor(document.getElementById('diffContainer'), {
    theme: 'vs',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    renderSideBySide: true, 
    diffAlgorithm: 'advanced',
    renderIndicators: false,
    scrollBeyondLastLine: true,
    wrappingIndent: 'same',
    overviewRulerLanes: 0,
    folding: false,
    glyphMargin: false,
    fixedOverflowWidgets: true,
    stickyScroll: { enabled: false },
    smoothScrolling: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'hidden',
      alwaysConsumeMouseWheel: false
    },
    diffWordWrap: 'on',
  });

  window.diffEditor.getOriginalEditor().updateOptions({ wordWrap: 'on', scrollBeyondLastLine: true });
  window.diffEditor.getModifiedEditor().updateOptions({ wordWrap: 'on', scrollBeyondLastLine: true });

  window.diffEditor.getModifiedEditor().onDidScrollChange((e) => {
  window.diffEditor.getOriginalEditor().setScrollTop(e.scrollTop);
});

window.diffEditor.getOriginalEditor().onDidScrollChange((e) => {
  window.diffEditor.getModifiedEditor().setScrollTop(e.scrollTop);
});

  window.diffEditor.onDidUpdateDiff(() => {
    const diffContainer = document.getElementById('diffContainer');
    const originalEditor = window.diffEditor.getOriginalEditor();
    const modifiedEditor = window.diffEditor.getModifiedEditor();

    
    const newHeight = Math.max(
      originalEditor.getContentHeight(),
      modifiedEditor.getContentHeight()
    );

    
    diffContainer.style.height = `${newHeight + 20}px`;

    window.diffEditor.layout();

    const removalsEl = document.getElementById('text-removals-count');
    const additionsEl = document.getElementById('text-additions-count');
    const changes = window.diffEditor.getLineChanges() || [];
    
    let additions = 0;
    let removals = 0;

    changes.forEach(change => {
      
      if (change.originalEndLineNumber === 0) {
        additions += (change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1);
      } 
      
      else if (change.modifiedEndLineNumber === 0) {
        removals += (change.originalEndLineNumber - change.originalStartLineNumber + 1);
      } 
      
      else {
        additions++;
        removals++;
      }
    });

    removalsEl.textContent = `${removals} removal${removals !== 1 ? 's' : ''}`;
    additionsEl.textContent = `${additions} addition${additions !== 1 ? 's' : ''}`;
  });

  window.diffEditor.layout();

  setupTextComparison();
  setupEditorFileOpeners();
  setupClearButton(); 

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      window.editor1.layout();
      window.editor2.layout();
      window.diffEditor.layout();
    }, 100);
  });


});