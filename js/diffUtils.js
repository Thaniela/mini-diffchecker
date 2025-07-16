export const dmp = new window.diff_match_patch(); 

export function getDiffHtml(text1, text2) {
  const diff = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diff);
  return dmp.diff_prettyHtml(diff);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
