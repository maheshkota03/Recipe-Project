// js/auth.js - Enhanced Authentication Logic with Animations

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkLoginStatus();
  
  // Handle login form submission
  document.getElementById('loginSubmitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    handleLogin(this);
  });
  
  // Handle register form submission
  document.getElementById('registerSubmitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    handleRegister(this);
  });
  
  // Password strength checker
  const registerPassword = document.getElementById('registerPassword');
  if (registerPassword) {
    registerPassword.addEventListener('input', checkPasswordStrength);
  }
  
  // Real-time password match validation
  const confirmPassword = document.getElementById('registerConfirmPassword');
  if (confirmPassword) {
    confirmPassword.addEventListener('input', validatePasswordMatch);
  }
});

// Check if user is logged in
function checkLoginStatus() {
  const currentUser = localStorage.getItem('currentUser');
  
  if (currentUser) {
    const user = JSON.parse(currentUser);
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loggedInView').style.display = 'block';
    document.getElementById('userDisplayName').textContent = user.name;
  } else {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('loggedInView').style.display = 'none';
  }
}

// Toggle between login and register forms with animation
function toggleForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm.style.display === 'none') {
    // Switching to login
    registerForm.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
      loginForm.style.animation = 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    }, 300);
  } else {
    // Switching to register
    loginForm.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      registerForm.style.animation = 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    }, 300);
  }
}

// Handle login with loading state
function handleLogin(form) {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const submitBtn = form.querySelector('.auth-submit-btn');
  
  // Validation
  if (!email || !password) {
    showAlert('Please fill in all fields', 'warning');
    return;
  }
  
  if (!email.includes('@')) {
    showAlert('Please enter a valid email address', 'warning');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  // Simulate API call delay
  setTimeout(() => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      setButtonLoading(submitBtn, false);
      showAlert('Invalid email or password', 'danger');
      shakeElement(form);
      return;
    }
    
    // Login successful
    const currentUser = {
      name: user.name,
      email: user.email,
      loginTime: new Date().toLocaleString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAlert('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }, 1000);
}

// Handle registration with loading state
function handleRegister(form) {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
  const agreeTerms = document.getElementById('agreeTerms').checked;
  const submitBtn = form.querySelector('.auth-submit-btn');
  
  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showAlert('Please fill in all fields', 'warning');
    shakeElement(form);
    return;
  }
  
  if (name.length < 3) {
    showAlert('Name must be at least 3 characters long', 'warning');
    return;
  }
  
  if (!email.includes('@')) {
    showAlert('Please enter a valid email address', 'warning');
    return;
  }
  
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters long', 'warning');
    return;
  }
  
  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'warning');
    shakeElement(document.getElementById('registerConfirmPassword').parentElement);
    return;
  }
  
  if (!agreeTerms) {
    showAlert('Please agree to the Terms and Conditions', 'warning');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  // Simulate API call delay
  setTimeout(() => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(u => u.email === email)) {
      setButtonLoading(submitBtn, false);
      showAlert('This email is already registered. Please login instead.', 'warning');
      return;
    }
    
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toLocaleString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    const currentUser = {
      name: newUser.name,
      email: newUser.email,
      loginTime: new Date().toLocaleString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAlert('Account created successfully! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }, 1000);
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + '-icon');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  }
}

// Check password strength
function checkPasswordStrength() {
  const password = this.value;
  const strengthBar = document.getElementById('passwordStrength');
  
  if (!strengthBar) return;
  
  let strength = 0;
  
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  
  strengthBar.className = 'password-strength';
  
  if (strength <= 2) {
    strengthBar.classList.add('weak');
  } else if (strength <= 4) {
    strengthBar.classList.add('medium');
  } else {
    strengthBar.classList.add('strong');
  }
}

// Validate password match
function validatePasswordMatch() {
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = this.value;
  
  if (confirmPassword && password !== confirmPassword) {
    this.setCustomValidity('Passwords do not match');
    this.style.borderColor = '#ff6b6b';
  } else {
    this.setCustomValidity('');
    this.style.borderColor = '#6bcf7f';
  }
}

// Set button loading state
function setButtonLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoader = button.querySelector('.btn-loader');
  
  if (isLoading) {
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    button.disabled = true;
  } else {
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    button.disabled = false;
  }
}

// Shake animation for errors
function shakeElement(element) {
  element.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    element.style.animation = '';
  }, 500);
}

// Add shake animation to styles
if (!document.getElementById('shake-animation')) {
  const style = document.createElement('style');
  style.id = 'shake-animation';
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    @keyframes slideOut {
      to {
        opacity: 0;
        transform: translateY(-40px) scale(0.95);
      }
    }
  `;
  document.head.appendChild(style);
}

// Logout user
function logoutUser() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('currentUser');
    showAlert('Logged out successfully! Redirecting...', 'info');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Show alert message with animation
function showAlert(message, type = 'info') {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';
  alertDiv.role = 'alert';
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'danger') icon = 'x-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  alertDiv.innerHTML = `
    <i class="bi bi-${icon} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}
