// js/recipes.js - Recipe API Integration with Auth-Protected Favorites

// Edamam API Configuration
const API_CONFIG = {
  APP_ID: 'def844c2',
  APP_KEY: 'efa8d141c733ced8fc144278861ca547',
  BASE_URL: 'https://api.edamam.com/api/recipes/v2'
};

// Search recipes from Edamam API
async function searchRecipes(query) {
  try {
    const url = `${API_CONFIG.BASE_URL}?type=public&q=${encodeURIComponent(query)}&app_id=${API_CONFIG.APP_ID}&app_key=${API_CONFIG.APP_KEY}`;
    
    console.log('Fetching recipes for:', query);
    
    const response = await fetch(url);
    
    // Check for specific HTTP errors
    if (response.status === 429) {
      throw new Error('Rate limit exceeded (429). Please wait a minute before searching again.');
    }
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed (401/403). Please check your API credentials.');
    }
    
    if (response.status === 404) {
      throw new Error('API endpoint not found (404). Please check the API URL.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Recipes fetched successfully:', data.hits.length);
    
    return data.hits;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error: Please check your internet connection.');
    }
    
    throw error;
  }
}

// Display recipes in the UI
function displayRecipes(recipes) {
  const container = document.getElementById('recipesContainer');
  const emptyState = document.getElementById('emptyState');
  
  container.innerHTML = '';
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  if (recipes.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <h3>No recipes found</h3>
          <p>Try searching with different keywords</p>
        </div>
      </div>
    `;
    return;
  }
  
  recipes.forEach(item => {
    const recipe = item.recipe;
    const recipeCard = createRecipeCard(recipe);
    container.appendChild(recipeCard);
  });
}

// Create individual recipe card
function createRecipeCard(recipe) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  
  const calories = Math.round(recipe.calories);
  const caloriesPerServing = Math.round(calories / recipe.yield);
  
  // Check if user is logged in
  const currentUser = localStorage.getItem('currentUser');
  
  // Check if recipe is in favorites (only if logged in)
  let isFavorite = false;
  if (currentUser) {
    const user = JSON.parse(currentUser);
    const userFavoritesKey = `favorites_${user.email}`;
    const favorites = JSON.parse(localStorage.getItem(userFavoritesKey)) || [];
    isFavorite = favorites.some(fav => fav.uri === recipe.uri);
  }
  
  const favoriteClass = isFavorite ? 'btn-favorite active' : 'btn-favorite';
  
  col.innerHTML = `
    <div class="card recipe-card">
      <img src="${recipe.image}" class="card-img-top" alt="${recipe.label}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
      <div class="card-body recipe-card-body">
        <h5 class="recipe-title">${recipe.label}</h5>
        <p class="recipe-source">
          <small>Source: ${recipe.source}</small>
        </p>
        <span class="recipe-calories">
          ${caloriesPerServing} cal/serving
        </span>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <button class="btn btn-view" onclick="viewRecipe('${encodeURIComponent(JSON.stringify(recipe))}')">
            View Recipe
          </button>
          <button class="btn ${favoriteClass}" onclick="toggleFavorite('${encodeURIComponent(JSON.stringify(recipe))}', this)">
            ♥
          </button>
        </div>
      </div>
    </div>
  `;
  
  return col;
}

// View recipe details
function viewRecipe(encodedRecipe) {
  const recipe = JSON.parse(decodeURIComponent(encodedRecipe));
  sessionStorage.setItem('currentRecipe', JSON.stringify(recipe));
  window.location.href = 'recipe.html';
}

// Toggle favorite status - WITH LOGIN REQUIREMENT
function toggleFavorite(encodedRecipe, buttonElement) {
  // Check if user is logged in
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    // User is not logged in - show login modal/alert
    showLoginRequiredModal();
    return;
  }
  
  const recipe = JSON.parse(decodeURIComponent(encodedRecipe));
  const user = JSON.parse(currentUser);
  
  // Use user-specific favorites key
  const userFavoritesKey = `favorites_${user.email}`;
  let favorites = JSON.parse(localStorage.getItem(userFavoritesKey)) || [];
  
  // Check if recipe already exists in favorites
  const index = favorites.findIndex(fav => fav.uri === recipe.uri);
  
  if (index > -1) {
    // Remove from favorites
    favorites.splice(index, 1);
    showNotification('Removed from favorites!', 'remove');
    if (buttonElement) {
      buttonElement.classList.remove('active');
    }
  } else {
    // Add to favorites
    favorites.push(recipe);
    showNotification('Added to favorites!', 'add');
    if (buttonElement) {
      buttonElement.classList.add('active');
    }
  }
  
  // Save back to localStorage with user-specific key
  localStorage.setItem(userFavoritesKey, JSON.stringify(favorites));
}

// Show login required modal
function showLoginRequiredModal() {
  // Create modal overlay
  const modalHTML = `
    <div class="login-required-modal" id="loginModal">
      <div class="login-modal-overlay" onclick="closeLoginModal()"></div>
      <div class="login-modal-content">
        <button class="login-modal-close" onclick="closeLoginModal()">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="login-modal-icon">
          <i class="bi bi-lock-fill"></i>
        </div>
        <h3 class="login-modal-title">Login Required</h3>
        <p class="login-modal-text">
          You need to be logged in to add recipes to your favorites.
        </p>
        <div class="login-modal-buttons">
          <button class="btn btn-primary" onclick="window.location.href='login.html'">
            Login / Sign Up
          </button>
          <button class="btn btn-outline-secondary" onclick="closeLoginModal()">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

// Close login modal
function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  
  let bgColor = '#28a745';
  if (type === 'remove') {
    bgColor = '#dc3545';
  }
  
  toast.textContent = message;
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
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animation styles
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    /* Login Required Modal Styles */
    .login-required-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }
    
    .login-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    
    .login-modal-content {
      position: relative;
      background: white;
      border-radius: 16px;
      padding: 2.5rem 2rem;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .login-modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #999;
      cursor: pointer;
      padding: 0.5rem;
      line-height: 1;
      transition: color 0.3s ease;
    }
    
    .login-modal-close:hover {
      color: #333;
    }
    
    .login-modal-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: white;
      box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
    }
    
    .login-modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.75rem;
    }
    
    .login-modal-text {
      color: #666;
      font-size: 1rem;
      margin-bottom: 2rem;
      line-height: 1.5;
    }
    
    .login-modal-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    
    .login-modal-buttons .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .login-modal-buttons .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .login-modal-buttons .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    
    .login-modal-buttons .btn-outline-secondary {
      background: transparent;
      border: 2px solid #e0e0e0;
      color: #666;
    }
    
    .login-modal-buttons .btn-outline-secondary:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }
    
    @media (max-width: 576px) {
      .login-modal-content {
        padding: 2rem 1.5rem;
      }
      
      .login-modal-buttons {
        flex-direction: column;
      }
      
      .login-modal-buttons .btn {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}
