import { setupTextComparison, setupFileComparison } from './domHandlers.js';

document.addEventListener('DOMContentLoaded', () => {
  setupTextComparison();
  setupFileComparison();
});
