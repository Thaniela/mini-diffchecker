// js/document-compare.js

// --- Core Diffing Logic (from diff-match-patch) ---
const dmp = new window.diff_match_patch();

function getDiffHtml(text1, text2) {
  const diff = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diff);
  return dmp.diff_prettyHtml(diff);
}

// --- File Parsers ---

/**
 * Reads a .txt file and returns its text content.
 */
function readTxtFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Reads a .docx file and returns its text content using mammoth.js.
 */
async function readDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Reads a .pdf file and returns its text content using pdf.js.
 */
async function readPdfFile(file) {
  // Set up the worker source for pdf.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let allText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    allText += textContent.items.map(item => item.str).join(' ') + '\n';
  }
  
  return allText;
}

/**
 * Universal file processor.
 * Detects file type and uses the appropriate parser.
 */
function processFile(file) {
  if (file.type === 'application/pdf') {
    return readPdfFile(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return readDocxFile(file);
  } else if (file.type === 'text/plain') {
    return readTxtFile(file);
  } else {
    // Fallback for other file types that might be text-readable
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'docx') return readDocxFile(file);
    if (extension === 'pdf') return readPdfFile(file);
    if (extension === 'txt') return readTxtFile(file);

    return Promise.reject(new Error('Unsupported file type: ' + file.type));
  }
}


// --- DOM Handlers and Main Logic ---

function setupPage() {
  const compareBtn = document.getElementById('compareFilesBtn');
  const diffResultWrapper = document.getElementById('diffResultWrapper');
  const fileDiffResult = document.getElementById('fileDiffResult');
  let file1 = null;
  let file2 = null;

  const checkFilesAndEnableButton = () => {
    if (file1 && file2) {
      compareBtn.disabled = false;
    }
  };
  
  const setupDropZone = (dropZoneId, inputId) => {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);
    const content = dropZone.querySelector('.drop-zone__content');
    const fileDisplay = dropZone.querySelector('.drop-zone__file-display');

    const handleFile = (selectedFile) => {
        if (dropZoneId === 'drop-zone-1') file1 = selectedFile;
        if (dropZoneId === 'drop-zone-2') file2 = selectedFile;

        content.classList.add('hidden');
        fileDisplay.textContent = selectedFile.name;
        fileDisplay.classList.remove('hidden', 'processing');
        checkFilesAndEnableButton();
    };

    dropZone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files.length) handleFile(input.files[0]); });
    
    // Drag and Drop
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        handleFile(input.files[0]);
      }
    });
  };

  setupDropZone('drop-zone-1', 'file1');
  setupDropZone('drop-zone-2', 'file2');

  // Logic for the compare button
  compareBtn.addEventListener('click', async () => {
    if (!file1 || !file2) {
      alert("Please select both files.");
      return;
    }
    
    compareBtn.disabled = true;
    compareBtn.textContent = 'Processing...';

    try {
      const [text1, text2] = await Promise.all([
        processFile(file1),
        processFile(file2)
      ]);

      const html = getDiffHtml(text1, text2);
      fileDiffResult.innerHTML = html;
      diffResultWrapper.classList.remove('hidden');

    } catch (err) {
      console.error("Failed to process files:", err);
      alert("Error: " + err.message);
    } finally {
      compareBtn.disabled = false;
      compareBtn.textContent = 'Find Difference';
    }
  });
}

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', setupPage);