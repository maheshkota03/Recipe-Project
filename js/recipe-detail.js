// js/recipes.js - Recipe API with Smart Caching & Rate Limit Management

// Edamam API Configuration
const API_CONFIG = {
  APP_ID: 'def844c2',
  APP_KEY: 'efa8d141c733ced8fc144278861ca547',
  BASE_URL: 'https://api.edamam.com/api/recipes/v2'
};

// Rate Limit Management
const RATE_LIMIT = {
  MAX_REQUESTS: 10,
  TIME_WINDOW: 60000, // 1 minute in milliseconds
  requests: [],
  
  canMakeRequest() {
    const now = Date.now();
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => now - time < this.TIME_WINDOW);
    return this.requests.length < this.MAX_REQUESTS;
  },
  
  recordRequest() {
    this.requests.push(Date.now());
  },
  
  getTimeUntilNextRequest() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const timeElapsed = Date.now() - oldestRequest;
    return Math.max(0, this.TIME_WINDOW - timeElapsed);
  },
  
  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.TIME_WINDOW);
    return this.MAX_REQUESTS - this.requests.length;
  }
};

// Cache Management
const CACHE = {
  KEY_PREFIX: 'recipe_cache_',
  EXPIRY_TIME: 3600000, // 1 hour in milliseconds
  
  generateKey(query, filters) {
    return this.KEY_PREFIX + JSON.stringify({ query, filters });
  },
  
  get(query, filters) {
    const key = this.generateKey(query, filters);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    try {
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - data.timestamp > this.EXPIRY_TIME) {
        localStorage.removeItem(key);
        return null;
      }
      
      console.log('✅ Using cached results for:', query);
      return data.results;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },
  
  set(query, filters, results) {
    const key = this.generateKey(query, filters);
    const data = {
      results: results,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 Cached results for:', query);
    } catch (error) {
      console.error('Cache write error:', error);
      // If storage is full, clear old cache
      this.clearOldCache();
    }
  },
  
  clearOldCache() {
    const now = Date.now();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (now - data.timestamp > this.EXPIRY_TIME) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    });
  }
};

// Store current filters
let currentFilters = {
  diet: '',
  health: '',
  cuisine: '',
  mealType: ''
};

// Toggle filters visibility
function toggleFilters() {
  const filtersDiv = document.getElementById('advancedFilters');
  if (filtersDiv.style.display === 'none') {
    filtersDiv.style.display = 'block';
  } else {
    filtersDiv.style.display = 'none';
  }
}

// Apply filters
function applyFilters() {
  currentFilters.diet = document.getElementById('dietFilter').value;
  currentFilters.health = document.getElementById('healthFilter').value;
  currentFilters.cuisine = document.getElementById('cuisineFilter').value;
  currentFilters.mealType = document.getElementById('mealFilter').value;
  
  displayActiveFilters();
  
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    document.getElementById('searchForm').dispatchEvent(new Event('submit'));
  } else {
    showNotification('Please enter a search term first', 'warning');
  }
}

// Clear all filters
function clearFilters() {
  document.getElementById('dietFilter').value = '';
  document.getElementById('healthFilter').value = '';
  document.getElementById('cuisineFilter').value = '';
  document.getElementById('mealFilter').value = '';
  
  currentFilters = {
    diet: '',
    health: '',
    cuisine: '',
    mealType: ''
  };
  
  document.getElementById('activeFilters').style.display = 'none';
  document.getElementById('activeFilters').innerHTML = '';
  
  showNotification('Filters cleared', 'info');
}

// Display active filters
function displayActiveFilters() {
  const activeFiltersDiv = document.getElementById('activeFilters');
  const filters = [];
  
  if (currentFilters.diet) {
    filters.push({ label: `Diet: ${currentFilters.diet}`, key: 'diet' });
  }
  if (currentFilters.health) {
    filters.push({ label: `Health: ${currentFilters.health}`, key: 'health' });
  }
  if (currentFilters.cuisine) {
    filters.push({ label: `Cuisine: ${currentFilters.cuisine}`, key: 'cuisine' });
  }
  if (currentFilters.mealType) {
    filters.push({ label: `Meal: ${currentFilters.mealType}`, key: 'mealType' });
  }
  
  if (filters.length > 0) {
    activeFiltersDiv.innerHTML = filters.map(filter => `
      <span class="filter-badge">
        ${filter.label}
        <i class="bi bi-x-circle" onclick="removeFilter('${filter.key}')"></i>
      </span>
    `).join('');
    activeFiltersDiv.style.display = 'flex';
  } else {
    activeFiltersDiv.style.display = 'none';
  }
}

// Remove individual filter
function removeFilter(key) {
  currentFilters[key] = '';
  const filterMap = {
    diet: 'dietFilter',
    health: 'healthFilter',
    cuisine: 'cuisineFilter',
    mealType: 'mealFilter'
  };
  
  document.getElementById(filterMap[key]).value = '';
  displayActiveFilters();
  
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    document.getElementById('searchForm').dispatchEvent(new Event('submit'));
  }
}

// Search recipes with caching and rate limit management
async function searchRecipes(query) {
  try {
    // Check cache first
    const cachedResults = CACHE.get(query, currentFilters);
    if (cachedResults) {
      showNotification('✅ Loaded from cache (no API call used)', 'success');
      return cachedResults;
    }
    
    // Check rate limit
    if (!RATE_LIMIT.canMakeRequest()) {
      const waitTime = Math.ceil(RATE_LIMIT.getTimeUntilNextRequest() / 1000);
      throw new Error(`Rate limit reached. Please wait ${waitTime} seconds. Try searching for something you've searched before - it will load instantly from cache!`);
    }
    
    // Build API URL
    let url = `${API_CONFIG.BASE_URL}?type=public&q=${encodeURIComponent(query)}&app_id=${API_CONFIG.APP_ID}&app_key=${API_CONFIG.APP_KEY}`;
    
    // Add filters
    if (currentFilters.diet) {
      url += `&diet=${currentFilters.diet}`;
    }
    if (currentFilters.health) {
      url += `&health=${currentFilters.health}`;
    }
    if (currentFilters.cuisine) {
      url += `&cuisineType=${encodeURIComponent(currentFilters.cuisine)}`;
    }
    if (currentFilters.mealType) {
      url += `&mealType=${currentFilters.mealType}`;
    }
    
    console.log('🌐 Making API call for:', query, 'with filters:', currentFilters);
    
    const response = await fetch(url);
    
    // Record the API call
    RATE_LIMIT.recordRequest();
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait 60 seconds before trying again.');
    }
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please check your API credentials.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.hits;
    
    // Cache the results
    CACHE.set(query, currentFilters, results);
    
    // Show remaining requests
    const remaining = RATE_LIMIT.getRemainingRequests();
    console.log(`📊 API calls remaining: ${remaining}/10`);
    showNotification(`✅ Found ${results.length} recipes (${remaining} API calls remaining this minute)`, 'success');
    
    return results;
    
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
          <p>Try searching with different keywords or adjust your filters</p>
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
  
  const currentUser = localStorage.getItem('currentUser');
  
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

// Toggle favorite status
function toggleFavorite(encodedRecipe, buttonElement) {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    showLoginRequiredModal();
    return;
  }
  
  const recipe = JSON.parse(decodeURIComponent(encodedRecipe));
  const user = JSON.parse(currentUser);
  
  const userFavoritesKey = `favorites_${user.email}`;
  let favorites = JSON.parse(localStorage.getItem(userFavoritesKey)) || [];
  
  const index = favorites.findIndex(fav => fav.uri === recipe.uri);
  
  if (index > -1) {
    favorites.splice(index, 1);
    showNotification('Removed from favorites!', 'remove');
    if (buttonElement) {
      buttonElement.classList.remove('active');
    }
  } else {
    favorites.push(recipe);
    showNotification('Added to favorites!', 'add');
    if (buttonElement) {
      buttonElement.classList.add('active');
    }
  }
  
  localStorage.setItem(userFavoritesKey, JSON.stringify(favorites));
}

// Show login required modal
function showLoginRequiredModal() {
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
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
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
  let icon = '✅';
  
  if (type === 'remove') {
    bgColor = '#dc3545';
    icon = '🗑️';
  } else if (type === 'warning') {
    bgColor = '#ffc107';
    icon = '⚠️';
  } else if (type === 'info') {
    bgColor = '#17a2b8';
    icon = 'ℹ️';
  } else if (type === 'success') {
    bgColor = '#28a745';
    icon = '✅';
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
  }, 4000);
}

// Add animation and modal styles
if (!document.getElementById('recipes-animations')) {
  const style = document.createElement('style');
  style.id = 'recipes-animations';
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
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
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
      
      .toast-notification {
        right: 10px !important;
        left: 10px !important;
        max-width: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}
