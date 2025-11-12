// Content script - runs on every page
console.log('🎯 Affiliate Signup Helper loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startGuide') {
    startAffiliateGuide(request.site, request.userData);
    sendResponse({ success: true });
  } else if (request.action === 'showArrow') {
    showArrow(request.selector, request.message, request.emoji);
    sendResponse({ success: true });
  } else if (request.action === 'clearArrows') {
    clearAllArrows();
    sendResponse({ success: true });
  }
  return true;
});

// Show arrow pointing to element
function showArrow(selector, message, emoji = '👇') {
  // Clear old arrows
  clearAllArrows();

  // Find target
  const target = document.querySelector(selector);
  if (!target) {
    console.error('Target not found:', selector);
    showDebug(`❌ Not found: ${selector}`);
    return false;
  }

  showDebug(`✅ Found: ${selector}`);

  // Add glow to target
  target.classList.add('affiliate-glow');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Create arrow
  const arrow = document.createElement('div');
  arrow.className = 'affiliate-arrow';
  arrow.innerHTML = emoji;
  arrow.id = 'affiliate-arrow-current';

  const rect = target.getBoundingClientRect();
  arrow.style.position = 'fixed';

  if (emoji === '👉') {
    arrow.style.left = (rect.left - 140) + 'px';
    arrow.style.top = (rect.top + rect.height/2 - 60) + 'px';
  } else {
    arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
    arrow.style.top = (rect.top - 140) + 'px';
  }

  document.body.appendChild(arrow);

  // Create message box
  const msgBox = document.createElement('div');
  msgBox.className = 'affiliate-message';
  msgBox.id = 'affiliate-message-current';
  msgBox.innerHTML = `<div>${message}</div>`;
  document.body.appendChild(msgBox);

  showDebug(`👁️ Arrow visible`);
  return true;
}

// Clear all arrows and highlights
function clearAllArrows() {
  document.querySelectorAll('.affiliate-arrow, .affiliate-message').forEach(el => el.remove());
  document.querySelectorAll('.affiliate-glow').forEach(el => el.classList.remove('affiliate-glow'));
}

// Show debug message
function showDebug(message) {
  let debugBox = document.getElementById('affiliate-debug-log');
  if (!debugBox) {
    debugBox = document.createElement('div');
    debugBox.id = 'affiliate-debug-log';
    debugBox.className = 'affiliate-debug';
    document.body.appendChild(debugBox);
  }

  const time = new Date().toLocaleTimeString();
  const logLine = `[${time}] ${message}`;

  const logs = debugBox.innerHTML.split('<br>').filter(l => l.trim());
  logs.push(logLine);
  debugBox.innerHTML = logs.slice(-10).join('<br>');
}

// Show progress tracker
function showProgress(step, total, description) {
  let progressBox = document.getElementById('affiliate-progress-box');
  if (!progressBox) {
    progressBox = document.createElement('div');
    progressBox.id = 'affiliate-progress-box';
    progressBox.className = 'affiliate-progress';
    document.body.appendChild(progressBox);
  }

  progressBox.innerHTML = `
    <div style="font-size: 18px; margin-bottom: 10px;">
      Step ${step} of ${total}
    </div>
    <div style="font-size: 14px; opacity: 0.9;">
      ${description}
    </div>
  `;
}

// Start affiliate guide for specific site
function startAffiliateGuide(site, userData) {
  showDebug(`🚀 Starting guide for: ${site}`);
  showProgress(1, 5, 'Initializing...');

  if (site === 'partnerstack') {
    startPartnerStackGuide(userData);
  } else if (site === 'shareasale') {
    startShareASaleGuide(userData);
  } else if (site === 'impact') {
    startImpactGuide(userData);
  } else if (site === 'cj') {
    startCJGuide(userData);
  }
}

// PartnerStack specific guide
function startPartnerStackGuide(userData) {
  const url = window.location.href;
  showDebug(`📍 URL: ${url}`);

  // Detect current page
  const body = document.body.textContent;

  if (url.includes('/partners') && !url.includes('/book-a-demo')) {
    // Landing page
    showProgress(1, 5, 'Click "Book a demo"');
    showArrow('a[href*="book-a-demo"], a[href*="demo"]', '👉 Click "Book a demo"', '👉');
  } else if (body.includes("I'm a software vendor")) {
    // Choice page
    showProgress(2, 5, 'Choose user type');

    // Find vendor button
    const allElements = Array.from(document.querySelectorAll('*'));
    const vendorBtn = allElements.find(el =>
      el.textContent.includes("I'm a software vendor") &&
      (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'DIV')
    );

    if (vendorBtn) {
      vendorBtn.classList.add('affiliate-glow');
      vendorBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const arrow = document.createElement('div');
      arrow.className = 'affiliate-arrow';
      arrow.innerHTML = '👇';
      const rect = vendorBtn.getBoundingClientRect();
      arrow.style.position = 'fixed';
      arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
      arrow.style.top = (rect.top - 140) + 'px';
      document.body.appendChild(arrow);

      const msgBox = document.createElement('div');
      msgBox.className = 'affiliate-message';
      msgBox.innerHTML = '<div>👇 Click "Software vendor"</div>';
      document.body.appendChild(msgBox);
    }
  } else {
    // Form page - try to find inputs
    const firstNameInput = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');

    if (firstNameInput) {
      showProgress(3, 5, 'Fill form fields');
      showArrow('input[name*="first" i], input[placeholder*="first" i]', '👇 First Name');

      // Auto-copy first name
      navigator.clipboard.writeText(userData.firstName).then(() => {
        showDebug(`📋 Copied: ${userData.firstName}`);
      });
    } else {
      showDebug('⚠️ Form not detected yet');
    }
  }
}

// Placeholder guides for other networks
function startShareASaleGuide(userData) {
  showDebug('📌 ShareASale guide coming soon');
}

function startImpactGuide(userData) {
  showDebug('📌 Impact.com guide coming soon');
}

function startCJGuide(userData) {
  showDebug('📌 CJ Affiliate guide coming soon');
}

// Initialize
showDebug('✅ Extension ready');
