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
  if (!clearBtn) return; // Guard clause in case the button isn't on the page

  clearBtn.addEventListener('click', () => {
    // Clear the two input editors
    window.editor1.setValue('');
    window.editor2.setValue('');

    // Clear the diff editor by setting an empty model
    window.diffEditor.setModel({
      original: monaco.editor.createModel(''),
      modified: monaco.editor.createModel('')
    });

    // Hide the entire result wrapper
    document.getElementById('diffResultWrapper').classList.add('hidden');
  });
}

/**
 * Sets up the file open buttons for the Monaco editors.
 */
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

    // When the "Open File" button is clicked, programmatically click the hidden file input.
    openFileBtn.addEventListener('click', () => fileInput.click());

    // When a file is selected in the file dialog...
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) {
        return; // No file selected
      }
      try {
        const text = await readFileAsText(file);
        editor.setValue(text); // Load the file content into the editor.
      } catch (err) {
        console.error("Error reading file:", err);
        alert("Failed to read the selected file.");
      }
      // Reset the input value to allow opening the same file again
      event.target.value = '';
    });
  };

  // Connect the components for both editors
  connectComponents('openFile1', 'fileInput1', window.editor1);
  connectComponents('openFile2', 'fileInput2', window.editor2);
}