require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });

require(['vs/editor/editor.main'], function () {
  window.editor1 = monaco.editor.create(document.getElementById('editor1'), {
    value: '',
    language: 'plaintext',
    lineNumbers: 'on',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false }
  });

  window.editor2 = monaco.editor.create(document.getElementById('editor2'), {
    value: '',
    language: 'plaintext',
    lineNumbers: 'on',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false }
  });

  // Initialize the DiffEditor empty — we’ll set the model later
  window.diffEditor = monaco.editor.createDiffEditor(document.getElementById('diffContainer'), {
    theme: 'vs',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false }
  });
});
