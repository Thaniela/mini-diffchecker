// js/document-compare.js

/**
 * This is the main function for our entire application. It will be called only
 * after all necessary libraries, including the Monaco Editor, are fully loaded.
 * This structure prevents all race condition errors.
 */
function runDocumentComparer() {

  // --- 1. VERIFY LIBRARIES & CONFIGURE ---
  if (typeof window.pdfjsLib === 'undefined' || typeof window.mammoth === 'undefined') {
    alert("A required library (pdf.js or mammoth.js) failed to load. Please check your internet connection and refresh.");
    return;
  }
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

  // --- 2. GET DOM ELEMENTS ---
  const uploadContainer = document.getElementById('upload-container');
  const resultWrapper = document.getElementById('diffResultWrapper');
  const compareBtn = document.getElementById('compareFilesBtn');
  const removalsCountEl = document.getElementById('removals-count');
  const additionsCountEl = document.getElementById('additions-count');
  const clearDocBtn = document.getElementById('clearDocBtn');


  // --- 3. STATE VARIABLES ---
  let file1 = null;
  let file2 = null;

  // --- 4. CREATE THE MONACO DIFF EDITOR ---
  // Update the Monaco Editor configuration in the runDocumentComparer function

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
  // These are the key changes to ignore whitespace
  ignoreTrimWhitespace: true,
  renderWhitespace: 'none',
  renderIndentGuides: false,
  // Customize the diff colors to not highlight whitespace
  diffDecorations: {
    addedLineDecoration: {
      backgroundColor: 'rgba(155, 185, 85, 0.2)',
      isWholeLine: false // Only highlight the changed text, not whole line
    },
    removedLineDecoration: {
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      isWholeLine: false // Only highlight the changed text, not whole line
    },
    modifiedLineDecoration: {
      backgroundColor: 'rgba(255, 255, 0, 0.2)',
      isWholeLine: false // Only highlight the changed text, not whole line
    }
  }
});

// Update the normalizeText function to better handle line breaks
function normalizeText(text) {
  // Standardize line endings and collapse multiple spaces/newlines
  let standardized = text.replace(/\r\n|\r/g, '\n')
                        .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
                        .replace(/[ \t]+/g, ' ')
                        .trim();

  // Split into paragraphs (separated by two newlines)
  const paragraphs = standardized.split(/\n{2,}/);

  // Process each paragraph
  const processedParagraphs = paragraphs.map(paragraph => {
    // Clean up the paragraph
    let cleanParagraph = paragraph.replace(/\n/g, ' ')
                                 .replace(/[ ]+/g, ' ')
                                 .trim();

    // Word wrap to ~80 characters while preserving words
    const words = cleanParagraph.split(' ');
    let currentLine = '';
    const lines = [];
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 > 80) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine.length ? ' ' : '') + word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.join('\n');
  });

  // Join paragraphs with double newlines
  return processedParagraphs.join('\n\n');
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
        allText += textContent.items.map(item => item.str).join(' ') + '\n';
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
  
  // --- 6. ATTACH ALL EVENT LISTENERS ---
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
  // Reset file state
  file1 = null;
  file2 = null;
  
  // Clear file displays
  document.querySelectorAll('.drop-zone__file-display').forEach(el => {
    el.textContent = '';
    el.classList.add('hidden');
  });
  
  // Show file input content again
  document.querySelectorAll('.drop-zone__content').forEach(el => {
    el.classList.remove('hidden');
  });
  
  // Clear file inputs
  document.querySelectorAll('.drop-zone input[type="file"]').forEach(el => {
    el.value = '';
  });
  
  // Reset UI state
  uploadContainer.classList.remove('hidden');
  resultWrapper.classList.add('hidden');
  clearDocBtn.classList.add('hidden');
  
  // Clear diff editor
  const originalModel = diffEditor.getOriginalEditor().getModel();
  const modifiedModel = diffEditor.getModifiedEditor().getModel();
  diffEditor.setModel({
    original: monaco.editor.createModel('', 'text/plain'),
    modified: monaco.editor.createModel('', 'text/plain')
  });
  
  // Dispose of old models to prevent memory leaks
  if (originalModel) originalModel.dispose();
  if (modifiedModel) modifiedModel.dispose();
  
  // Reset counters
  removalsCountEl.textContent = '0 removals';
  additionsCountEl.textContent = '0 additions';
  
  // Reset compare button
  compareBtn.disabled = true;
});

// Update the compareBtn click handler to show the clear button when done
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
    clearDocBtn.classList.remove('hidden'); // Show the clear button
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

// --- GLOBAL ENTRY POINT ---
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
require(['vs/editor/editor.main'], runDocumentComparer);