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
    wordWrap: 'on' 
  });

  window.editor2 = monaco.editor.create(document.getElementById('editor2'), {
    value: '',
    language: 'plaintext',
    lineNumbers: 'on',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on' 
  });

  window.diffEditor = monaco.editor.createDiffEditor(document.getElementById('diffContainer'), {
    theme: 'vs',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    renderSideBySide: true, 
    diffAlgorithm: 'advanced'  
 
  });

  window.diffEditor.getOriginalEditor().updateOptions({ wordWrap: 'on' });
  window.diffEditor.getModifiedEditor().updateOptions({ wordWrap: 'on' });

  window.diffEditor.onDidUpdateDiff(() => {
    const diffContainer = document.getElementById('diffContainer');
    const originalEditor = window.diffEditor.getOriginalEditor();
    const modifiedEditor = window.diffEditor.getModifiedEditor();

    
    const newHeight = Math.max(
      originalEditor.getContentHeight(),
      modifiedEditor.getContentHeight()
    );

    
    diffContainer.style.height = `${newHeight + 20}px`;

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

});