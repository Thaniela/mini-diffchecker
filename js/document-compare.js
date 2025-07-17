
function runDocumentComparer() {

  
  if (typeof window.pdfjsLib === 'undefined' || typeof window.mammoth === 'undefined') {
    alert("A required library (pdf.js or mammoth.js) failed to load. Please check your internet connection and refresh.");
    return;
  }
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

  
  const uploadContainer = document.getElementById('upload-container');
  const resultWrapper = document.getElementById('diffResultWrapper');
  const compareBtn = document.getElementById('compareFilesBtn');
  const removalsCountEl = document.getElementById('removals-count');
  const additionsCountEl = document.getElementById('additions-count');
  const clearDocBtn = document.getElementById('clearDocBtn');


  
  let file1 = null;
  let file2 = null;

  
  

const diffEditor = monaco.editor.createDiffEditor(document.getElementById('documentDiffEditor'), {
  theme: 'vs',
  readOnly: true,
  automaticLayout: true,
  wordWrap: 'on',
  minimap: { enabled: false },
  renderSideBySide: true,
  diffAlgorithm: 'advanced',
  scrollBeyondLastLine: false,
  wrappingIndent: 'same',
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'hidden',
    alwaysConsumeMouseWheel: false
  },
  diffWordWrap: 'on',
  
  ignoreTrimWhitespace: true,
  renderWhitespace: 'none',
  renderIndentGuides: false,
  
  diffDecorations: {
    addedLineDecoration: {
      backgroundColor: 'rgba(155, 185, 85, 0.2)',
      isWholeLine: false 
    },
    removedLineDecoration: {
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      isWholeLine: false 
    },
    modifiedLineDecoration: {
      backgroundColor: 'rgba(255, 255, 0, 0.2)',
      isWholeLine: false 
    }
  }
});


function normalizeText(text) {
  
  let standardized = text.replace(/\r\n|\r/g, '\n');

  
  const lines = standardized.split('\n');

  
  const processedLines = lines.map(line => {
    
    
    return line.replace(/[ \t]+/g, ' ').trim();
  });

  
  return processedLines.join('\n');
}
    
  async function extractTextFromFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let allText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      

      let lastY;
      let pageText = '';
      for (let item of textContent.items) {
        
        
        if (lastY !== undefined && item.transform[5] !== lastY) {
          pageText += '\n';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
      
      allText += pageText + '\n';
      
    }
    return allText;
  }

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === 'txt') {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsText(file);
    });
  }

  throw new Error('Unsupported file type: ' + extension);
}

  const checkFilesAndEnableButton = () => {
    if (file1 && file2) {
      compareBtn.disabled = false;
    }
  };
  
  
  const setupDropZone = (dropZoneId) => {
    const dropZone = document.getElementById(dropZoneId);
    const input = dropZone.querySelector('input[type="file"]');
    const content = dropZone.querySelector('.drop-zone__content');
    const fileDisplay = dropZone.querySelector('.drop-zone__file-display');

    const handleFile = (selectedFile) => {
      if (dropZoneId === 'drop-zone-1') file1 = selectedFile;
      else file2 = selectedFile;
      content.classList.add('hidden');
      fileDisplay.textContent = selectedFile.name;
      fileDisplay.classList.remove('hidden');
      checkFilesAndEnableButton();
    };
    
    dropZone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files.length) handleFile(input.files[0]); });
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragleave'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        handleFile(e.dataTransfer.files[0]);
      }
    });
  };

  setupDropZone('drop-zone-1');
  setupDropZone('drop-zone-2');

  clearDocBtn.addEventListener('click', () => {
  
  file1 = null;
  file2 = null;
  
  
  document.querySelectorAll('.drop-zone__file-display').forEach(el => {
    el.textContent = '';
    el.classList.add('hidden');
  });
  
  
  document.querySelectorAll('.drop-zone__content').forEach(el => {
    el.classList.remove('hidden');
  });
  
  
  document.querySelectorAll('.drop-zone input[type="file"]').forEach(el => {
    el.value = '';
  });
  
  
  uploadContainer.classList.remove('hidden');
  resultWrapper.classList.add('hidden');
  clearDocBtn.classList.add('hidden');
  
  
  const originalModel = diffEditor.getOriginalEditor().getModel();
  const modifiedModel = diffEditor.getModifiedEditor().getModel();
  diffEditor.setModel({
    original: monaco.editor.createModel('', 'text/plain'),
    modified: monaco.editor.createModel('', 'text/plain')
  });
  
  
  if (originalModel) originalModel.dispose();
  if (modifiedModel) modifiedModel.dispose();
  
  
  removalsCountEl.textContent = '0 removals';
  additionsCountEl.textContent = '0 additions';
  
  
  compareBtn.disabled = true;
});


compareBtn.addEventListener('click', async () => {
  if (!file1 || !file2) return;
  compareBtn.disabled = true;
  compareBtn.textContent = 'Processing...';
  try {
    const [text1, text2] = await Promise.all([extractTextFromFile(file1), extractTextFromFile(file2)]);

    const normalizedText1 = normalizeText(text1);
    const normalizedText2 = normalizeText(text2);

    const originalModel = monaco.editor.createModel(normalizedText1, 'text/plain');
    const modifiedModel = monaco.editor.createModel(normalizedText2, 'text/plain');
    
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    uploadContainer.classList.add('hidden');
    resultWrapper.classList.remove('hidden');
    clearDocBtn.classList.remove('hidden'); 
  } catch (err) {
    console.error("Comparison failed:", err);
    alert("An error occurred during comparison: " + err.message);
  } finally {
    compareBtn.disabled = false;
    compareBtn.textContent = 'Find Difference';
  }
});

  diffEditor.onDidUpdateDiff(() => {
    const changes = diffEditor.getLineChanges() || [];
    let additions = 0;
    let removals = 0;
    changes.forEach(change => {
      if (change.originalEndLineNumber === 0) {
        additions += (change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1);
      } else if (change.modifiedEndLineNumber === 0) {
        removals += (change.originalEndLineNumber - change.originalStartLineNumber + 1);
      } else {
        additions++;
        removals++;
      }
    });
    removalsCountEl.textContent = `${removals} removal${removals !== 1 ? 's' : ''}`;
    additionsCountEl.textContent = `${additions} addition${additions !== 1 ? 's' : ''}`;

    const diffContainerEl = document.getElementById('documentDiffEditor');
    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();

    const newHeight = Math.max(
      originalEditor.getContentHeight(),
      modifiedEditor.getContentHeight()
    );

    diffContainerEl.style.height = `${newHeight + 20}px`;
    diffEditor.layout();
  });
}


require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
require(['vs/editor/editor.main'], runDocumentComparer);