// Popup script
const userData = {
  firstName: 'Terrance',
  lastName: 'Isaak',
  email: 'bobinzuks@gmail.com',
  company: 'https://github.com/bobinzuks'
};

// Load user data from storage or use defaults
chrome.storage.local.get(['userData'], (result) => {
  const data = result.userData || userData;
  document.getElementById('user-name').textContent = `${data.firstName} ${data.lastName}`;
  document.getElementById('user-email').textContent = data.email;
});

// Handle network button clicks
document.querySelectorAll('.network-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const site = btn.dataset.site;

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'startGuide',
      site: site,
      userData: userData
    }, (response) => {
      if (response && response.success) {
        showStatus(`✅ ${site} guide started!`, 'success');
        btn.classList.add('active');
      } else {
        showStatus(`❌ Failed to start guide`, 'error');
      }
    });
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;

  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}
