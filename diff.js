// Use Google's diff-match-patch library
const dmp = new diff_match_patch();

// Compare text to text
document.getElementById('compareBtn').addEventListener('click', () => {
  const text1 = document.getElementById('text1').value;
  const text2 = document.getElementById('text2').value;

  const diff = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diff);

  const html = dmp.diff_prettyHtml(diff);
  document.getElementById('diffResult').innerHTML = html;
});

// Compare files
document.getElementById('compareFilesBtn').addEventListener('click', () => {
  const file1 = document.getElementById('file1').files[0];
  const file2 = document.getElementById('file2').files[0];

  if (!file1 || !file2) {
    alert("Please select both files");
    return;
  }

  const reader1 = new FileReader();
  const reader2 = new FileReader();

  reader1.onload = function(e1) {
    reader2.onload = function(e2) {
      const text1 = e1.target.result;
      const text2 = e2.target.result;

      const diff = dmp.diff_main(text1, text2);
      dmp.diff_cleanupSemantic(diff);

      const html = dmp.diff_prettyHtml(diff);
      document.getElementById('fileDiffResult').innerHTML = html;
    };
    reader2.readAsText(file2);
  };

  reader1.readAsText(file1);
});
