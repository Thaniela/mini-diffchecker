import { setupTextComparison, setupEditorFileOpeners } from './domHandlers.js';

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
    wordWrap: 'on' 
  });

  window.diffEditor.getOriginalEditor().updateOptions({ wordWrap: 'on' });
  window.diffEditor.getModifiedEditor().updateOptions({ wordWrap: 'on' });

  window.diffEditor.onDidUpdateDiff(() => {
    const diffContainer = document.getElementById('diffContainer');
    const originalEditor = window.diffEditor.getOriginalEditor();
    const modifiedEditor = window.diffEditor.getModifiedEditor();

    // Calculate the height needed by the taller of the two editors.
    const newHeight = Math.max(
      originalEditor.getContentHeight(),
      modifiedEditor.getContentHeight()
    );

    // Apply the new height to the container element.
    diffContainer.style.height = `${newHeight + 20}px`;
  });

  window.diffEditor.layout();
  
  setupTextComparison();
  setupEditorFileOpeners();
});