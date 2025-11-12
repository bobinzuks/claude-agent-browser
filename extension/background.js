// Background service worker
console.log('🎯 Affiliate Helper background script loaded');

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed!');
});
