// js/app.js - Main Application Logic with Cache Support

document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const loadingSpinner = document.getElementById('loadingSpinner');
  
  // Handle search form submission
  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    
    if (!query) {
      showError('Please enter a search term');
      return;
    }
    
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    document.getElementById('recipesContainer').innerHTML = '';
    document.getElementById('emptyState').style.display = 'none';
    
    try {
      // Search for recipes (caching handled in recipes.js)
      const recipes = await searchRecipes(query);
      
      // Hide loading spinner
      loadingSpinner.style.display = 'none';
      
      // Display recipes
      displayRecipes(recipes);
      
    } catch (error) {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';
      
      // Show specific error message
      handleSearchError(error);
    }
  });
  
  // Check if user is logged in (for navigation display)
  checkAuthStatus();
});

// Enhanced error handling
function handleSearchError(error) {
  const container = document.getElementById('recipesContainer');
  
  let errorMessage = 'Failed to fetch recipes';
  let errorDetails = '';
  let errorIcon = '⚠️';
  let helpText = '';
  
  // Check for specific error types
  if (error.message.includes('Rate limit') || error.message.includes('wait')) {
    errorMessage = 'Rate Limit Reached';
    errorDetails = error.message;
    errorIcon = '⏱️';
    helpText = `
      <strong>💡 Pro Tips:</strong>
      <ul class="mb-0 text-start">
        <li>Search for something you've already searched - it loads instantly from cache!</li>
        <li>Try different filters on cached searches</li>
        <li>Browse your favorites while waiting</li>
        <li>Cache lasts 1 hour, so revisit searches are free</li>
      </ul>
    `;
  } else if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Authentication')) {
    errorMessage = 'Authentication Error';
    errorDetails = 'There was an issue with the API credentials. Please contact support.';
    errorIcon = '🔒';
  } else if (error.message.includes('network') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
    errorMessage = 'Network Error';
    errorDetails = 'Please check your internet connection and try again.';
    errorIcon = '🌐';
  } else {
    errorDetails = error.message || 'An unexpected error occurred. Please try again later.';
    errorIcon = '❌';
  }
  
  container.innerHTML = `
    <div class="col-12">
      <div class="alert alert-warning shadow-sm" role="alert" style="border-left: 4px solid #ffc107;">
        <h4 class="alert-heading">${errorIcon} ${errorMessage}</h4>
        <p class="mb-2">${errorDetails}</p>
        ${helpText ? `<hr>${helpText}` : ''}
      </div>
      <div class="text-center mt-3">
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise me-2"></i>Refresh Page
        </button>
      </div>
    </div>
  `;
  
  console.error('Search Error:', error);
}

// Simple error alert
function showError(message) {
  showNotification(message, 'warning');
}

// Check authentication status
function checkAuthStatus() {
  const currentUser = localStorage.getItem('currentUser');
  const loginLink = document.querySelector('a[href="login.html"]');
  
  if (currentUser && loginLink) {
    const user = JSON.parse(currentUser);
    // User is logged in - show user name and logout option
    loginLink.innerHTML = `<i class="bi bi-person-circle me-1"></i>${user.name.split(' ')[0]}`;
    loginLink.href = '#';
    loginLink.addEventListener('click', function(e) {
      e.preventDefault();
      showLogoutConfirm();
    });
  }
}

// Show logout confirmation
function showLogoutConfirm() {
  if (confirm('Are you sure you want to logout?')) {
    logout();
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  showNotification('Logged out successfully!', 'info');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Show notification (defined in recipes.js, but fallback here)
if (typeof showNotification === 'undefined') {
  function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    let bgColor = '#28a745';
    let icon = '✅';
    
    if (type === 'warning') {
      bgColor = '#ffc107';
      icon = '⚠️';
    } else if (type === 'info') {
      bgColor = '#17a2b8';
      icon = 'ℹ️';
    } else if (type === 'error') {
      bgColor = '#dc3545';
      icon = '❌';
    }
    
    toast.innerHTML = `<span style="margin-right: 8px;">${icon}</span>${message}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      font-size: 0.95rem;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
