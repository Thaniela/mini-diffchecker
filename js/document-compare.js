// js/document-compare.js

/**
 * This is the main function for our entire application. It will be called only
 * after all necessary libraries, including the Monaco Editor, are fully loaded.
 * This structure prevents all race condition errors.
 */
function runDocumentComparer() {

  // --- 1. VERIFY LIBRARIES & CONFIGURE ---
  // A quick check to make sure external scripts loaded correctly.
  if (typeof window.pdfjsLib === 'undefined' || typeof window.mammoth === 'undefined') {
    alert("A required library (pdf.js or mammoth.js) failed to load. Please check your internet connection and refresh.");
    return;
  }
  
  // Configure the PDF.js library. This must be done before it's used.
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

  // --- 2. GET DOM ELEMENTS ---
  const uploadContainer = document.getElementById('upload-container');
  const resultWrapper = document.getElementById('diffResultWrapper');
  const compareBtn = document.getElementById('compareFilesBtn');
  const removalsCountEl = document.getElementById('removals-count');
  const additionsCountEl = document.getElementById('additions-count');

  // --- 3. STATE VARIABLES ---
  let file1 = null;
  let file2 = null;

  // --- 4. CREATE THE MONACO DIFF EDITOR ---
  // This is safe to do now because this whole function runs after Monaco is ready.
  const diffEditor = monaco.editor.createDiffEditor(document.getElementById('documentDiffEditor'), {
    theme: 'vs', // Use the light theme to match the screenshot
    readOnly: true,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    renderSideBySide: true, // This is the key change to make it single-column
    diffAlgorithm: 'advanced' // Optional: Use advanced diff algorithm for better results
  });

  // --- 5. HELPER FUNCTIONS ---
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

  compareBtn.addEventListener('click', async () => {
    if (!file1 || !file2) return;
    compareBtn.disabled = true;
    compareBtn.textContent = 'Processing...';
    try {
      const [text1, text2] = await Promise.all([extractTextFromFile(file1), extractTextFromFile(file2)]);
      diffEditor.setModel({
        original: monaco.editor.createModel(text1, 'text/plain'),
        modified: monaco.editor.createModel(text2, 'text/plain')
      });
      uploadContainer.classList.add('hidden');
      resultWrapper.classList.remove('hidden');
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
  });
}

// --- GLOBAL ENTRY POINT ---
// This is the most reliable way to start our app. It tells the Monaco loader
// to fetch its files, and ONLY when it's done, it will run our main function.
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
require(['vs/editor/editor.main'], runDocumentComparer);