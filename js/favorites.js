// js/favorites.js - User-Specific Favorites Page Logic

document.addEventListener('DOMContentLoaded', function() {
  checkAuthAndLoadFavorites();
});

function checkAuthAndLoadFavorites() {
  // Check if user is logged in
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    // User not logged in - show login required message
    showLoginRequiredMessage();
    return;
  }
  
  // User is logged in - load their favorites
  loadFavorites();
}

function showLoginRequiredMessage() {
  const container = document.getElementById('favoritesContainer');
  const emptyState = document.getElementById('emptyFavorites');
  const countElement = document.getElementById('favoritesCount');
  
  countElement.textContent = 'Login Required';
  container.style.display = 'none';
  emptyState.innerHTML = `
    <div class="login-required-favorites">
      <div class="login-required-icon">
        <i class="bi bi-lock-fill"></i>
      </div>
      <h3>Login Required</h3>
      <p>Please log in to view and manage your favorite recipes</p>
      <a href="login.html" class="btn btn-primary mt-3">
        <i class="bi bi-box-arrow-in-right me-2"></i>Login / Sign Up
      </a>
    </div>
  `;
  emptyState.style.display = 'block';
}

function loadFavorites() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userFavoritesKey = `favorites_${currentUser.email}`;
  const favorites = JSON.parse(localStorage.getItem(userFavoritesKey)) || [];
  
  const container = document.getElementById('favoritesContainer');
  const emptyState = document.getElementById('emptyFavorites');
  const countElement = document.getElementById('favoritesCount');
  
  if (favorites.length === 0) {
    countElement.textContent = 'No favorites saved yet';
    container.style.display = 'none';
    emptyState.innerHTML = `
      <h3>No favorites yet</h3>
      <p>Start adding recipes to your favorites from the home page!</p>
      <a href="index.html" class="btn btn-primary mt-3">Browse Recipes</a>
    `;
    emptyState.style.display = 'block';
    return;
  }
  
  countElement.textContent = `You have ${favorites.length} favorite ${favorites.length === 1 ? 'recipe' : 'recipes'}`;
  container.style.display = 'flex';
  emptyState.style.display = 'none';
  
  container.innerHTML = '';
  
  favorites.forEach(recipe => {
    const card = createFavoriteCard(recipe);
    container.appendChild(card);
  });
}

function createFavoriteCard(recipe) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  
  const calories = Math.round(recipe.calories);
  const caloriesPerServing = Math.round(calories / recipe.yield);
  
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
          <button class="btn btn-view" onclick="viewFavoriteRecipe('${encodeURIComponent(JSON.stringify(recipe))}')">
            View Recipe
          </button>
          <button class="btn btn-danger" onclick="removeFavorite('${recipe.uri}')">
            Remove
          </button>
        </div>
      </div>
    </div>
  `;
  
  return col;
}

function viewFavoriteRecipe(encodedRecipe) {
  const recipe = JSON.parse(decodeURIComponent(encodedRecipe));
  sessionStorage.setItem('currentRecipe', JSON.stringify(recipe));
  window.location.href = 'recipe.html';
}

function removeFavorite(recipeUri) {
  if (!confirm('Are you sure you want to remove this recipe from favorites?')) {
    return;
  }
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userFavoritesKey = `favorites_${currentUser.email}`;
  let favorites = JSON.parse(localStorage.getItem(userFavoritesKey)) || [];
  
  favorites = favorites.filter(fav => fav.uri !== recipeUri);
  
  localStorage.setItem(userFavoritesKey, JSON.stringify(favorites));
  
  showNotification('Recipe removed from favorites!');
  
  loadFavorites();
}

function showNotification(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
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
    
    .login-required-favorites {
      text-align: center;
      padding: 3rem 1rem;
    }
    
    .login-required-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: white;
      box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
    }
    
    .login-required-favorites h3 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.75rem;
    }
    
    .login-required-favorites p {
      color: #666;
      font-size: 1.05rem;
      margin-bottom: 1.5rem;
    }
  `;
  document.head.appendChild(style);
}
