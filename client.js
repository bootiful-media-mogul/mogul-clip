// Configuration
const API_BASE_URL = 'https://your-api-domain.com'; // Replace with your API URL

// View management
const views = {
  login: document.getElementById('loginView'),
  loggedIn: document.getElementById('loggedInView'),
  success: document.getElementById('successView')
};

// Check authentication status on load
document.addEventListener('DOMContentLoaded', async () => {
  const token = await getStoredToken();
  if (token) {
    showLoggedInView();
  } else {
    showLoginView();
  }
});

// Show/hide views
function showLoginView() {
  Object.values(views).forEach(v => v.style.display = 'none');
  views.login.style.display = 'flex';
}

function showLoggedInView() {
  Object.values(views).forEach(v => v.style.display = 'none');
  views.loggedIn.style.display = 'flex';
  loadCurrentPageInfo();
}

function showSuccessView() {
  Object.values(views).forEach(v => v.style.display = 'none');
  views.success.style.display = 'flex';
}

// Storage helpers
async function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

async function setStoredToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ authToken: token }, resolve);
  });
}

async function clearStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['authToken'], resolve);
  });
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Disable button and show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  errorDiv.classList.remove('show');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      await setStoredToken(data.token);
      showLoggedInView();
    } else {
      errorDiv.textContent = data.message || 'Invalid email or password';
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Connection error. Please try again.';
    errorDiv.classList.add('show');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});

// Load current page info
async function loadCurrentPageInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  document.getElementById('currentUrl').textContent = tab.url;
  document.getElementById('currentUrl').title = tab.url;
  document.getElementById('pageTitle').value = tab.title || '';
}

// Save page handler
async function savePage(closeAfter = false) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const token = await getStoredToken();
  
  const pageData = {
    url: tab.url,
    title: document.getElementById('pageTitle').value || tab.title,
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
    notes: document.getElementById('notes').value
  };
  
  const statusDiv = document.getElementById('saveStatus');
  const saveBtn = document.getElementById('saveBtn');
  const saveAndCloseBtn = document.getElementById('saveAndCloseBtn');
  
  // Disable buttons during save
  saveBtn.disabled = true;
  saveAndCloseBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pageData)
    });
    
    if (response.ok) {
      if (closeAfter) {
        showSuccessView();
      } else {
        statusDiv.textContent = 'Page saved successfully!';
        statusDiv.className = 'status-message success';
        
        // Clear form for potential next save
        document.getElementById('tags').value = '';
        document.getElementById('notes').value = '';
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          statusDiv.className = 'status-message';
        }, 3000);
      }
    } else if (response.status === 401) {
      // Token expired
      await clearStoredToken();
      showLoginView();
    } else {
      const data = await response.json();
      statusDiv.textContent = data.message || 'Failed to save page';
      statusDiv.className = 'status-message error';
    }
  } catch (error) {
    statusDiv.textContent = 'Connection error. Please try again.';
    statusDiv.className = 'status-message error';
  } finally {
    saveBtn.disabled = false;
    saveAndCloseBtn.disabled = false;
    saveBtn.textContent = 'Save Page';
  }
}

// Button handlers
document.getElementById('saveBtn').addEventListener('click', () => savePage(false));
document.getElementById('saveAndCloseBtn').addEventListener('click', () => savePage(true));

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await clearStoredToken();
  showLoginView();
});

document.getElementById('closeBtn').addEventListener('click', () => {
  window.close();
});

document.getElementById('forgotPassword').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE_URL}/forgot-password` });
});

// Handle Enter key in tags/notes fields
document.getElementById('tags').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    savePage(false);
  }
});

document.getElementById('notes').addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    savePage(false);
  }
});