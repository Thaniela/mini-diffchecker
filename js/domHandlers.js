import { getDiffHtml, readFileAsText } from './diffUtils.js';

export function setupTextComparison() {
  const compareBtn = document.getElementById('compareBtn');

  const diffResultWrapper = document.getElementById('diffResultWrapper');
  
  compareBtn.addEventListener('click', () => {
    diffResultWrapper.classList.remove('hidden');
    const original = window.editor1.getValue();
    const modified = window.editor2.getValue();

    const originalModel = monaco.editor.createModel(original, 'plaintext');
    const modifiedModel = monaco.editor.createModel(modified, 'plaintext');

    window.diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });
  });
}

export function setupFileComparison() {
  const compareFilesBtn = document.getElementById('compareFilesBtn');
  compareFilesBtn.addEventListener('click', async () => {
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    if (!file1 || !file2) {
      alert("Please select both files");
      return;
    }

    const [text1, text2] = await Promise.all([
      readFileAsText(file1),
      readFileAsText(file2)
    ]);

    const html = getDiffHtml(text1, text2);
    document.getElementById('fileDiffResult').innerHTML = html;
  });
}


export function setupClearButton() {
  const clearBtn = document.getElementById('clearBtn');
  if (!clearBtn) return; 

  clearBtn.addEventListener('click', () => {
    
    window.editor1.setValue('');
    window.editor2.setValue('');

    
    window.diffEditor.setModel({
      original: monaco.editor.createModel(''),
      modified: monaco.editor.createModel('')
    });

    
    document.getElementById('diffResultWrapper').classList.add('hidden');
  });
}


export function setupEditorFileOpeners() {
  /**
   * Helper to connect a button, a hidden file input, and an editor instance.
   * @param {string} buttonId - The ID of the button that triggers the file dialog.
   * @param {string} inputId - The ID of the hidden file input element.
   * @param {monaco.editor.IStandaloneCodeEditor} editor - The Monaco editor instance.
   */
  const connectComponents = (buttonId, inputId, editor) => {
    const openFileBtn = document.getElementById(buttonId);
    const fileInput = document.getElementById(inputId);

    
    openFileBtn.addEventListener('click', () => fileInput.click());

    
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) {
        return; 
      }
      try {
        const text = await readFileAsText(file);
        editor.setValue(text); 
      } catch (err) {
        console.error("Error reading file:", err);
        alert("Failed to read the selected file.");
      }
      
      event.target.value = '';
    });
  };

  
  connectComponents('openFile1', 'fileInput1', window.editor1);
  connectComponents('openFile2', 'fileInput2', window.editor2);
}