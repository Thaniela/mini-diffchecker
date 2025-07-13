import { getDiffHtml, readFileAsText } from './diffUtils.js';

export function setupTextComparison() {
  const compareBtn = document.getElementById('compareBtn');
  compareBtn.addEventListener('click', () => {
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
