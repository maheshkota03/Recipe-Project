# 🍲 Recipe App

A fully responsive and interactive Recipe Web Application that allows users to search, explore, and save their favorite recipes.  
The application integrates with the Edamam Recipe Search API to fetch real-time recipe data including ingredients, preparation steps, and nutritional information.

---

## 🌍 Live Demo

👉 https://receipe1.netlify.app/

---

## 📌 Project Overview

The Recipe App is a frontend-based web application built using HTML, CSS, Bootstrap, and JavaScript.  
It provides a seamless and user-friendly experience across all devices, enabling users to discover and manage recipes efficiently.

---

## ✨ Features

### 🔐 User Authentication
- Sign up and login functionality
- Client-side input validation
- Login state management using localStorage
- Logout feature

### 🔍 Search Recipes
- Search recipes by ingredients or keywords
- Dynamic API-based results
- Display recipe images, calories, and cooking details

### 📖 View Recipe Details
- Detailed instructions
- Ingredients list
- Nutritional information
- Clean and structured layout

### ❤️ Save Favorite Recipes
- Add recipes to favorites
- Prevent duplicate entries
- Store favorites using localStorage
- Quick access through Favorites page

### ⭐ Recipe Ratings & Reviews
- Users can rate recipes
- Users can submit reviews
- Ratings displayed dynamically
- Reviews stored and rendered on recipe detail page

### 📱 Responsive Design
- Fully responsive layout
- Optimized for mobile, tablet, and desktop
- Built using Bootstrap grid system

---

## 🛠️ Technologies Used

- HTML
- CSS
- Bootstrap
- JavaScript
- Edamam Recipe Search API

---

## 📁 Project Structure

RECIPE APP/
│
├── css/
│ ├── auth.css
│ ├── style.css
│
├── js/
│ ├── app.js
│ ├── auth.js
│ ├── favorites.js
│ ├── recipe-detail.js
│ ├── recipes.js
│
├── images/
├── index.html
├── login.html
├── recipe.html
├── favorite.html
├── package.json
└── README.md


---

## 🔗 API Integration

This project uses the **Edamam Recipe Search API**.

To use the API:
1. Register on the Edamam website.
2. Obtain your `app_id` and `app_key`.
3. Replace them in the JavaScript API request.

Example API Request:

https://api.edamam.com/search?q=chicken&app_id=YOUR_ID&app_key=YOUR_KEY


---

## ⚙️ How to Run the Project

1. Clone the repository
git clone https://github.com/maheshkota03/Recipe-Project.git

2. Open `index.html` in your browser.
3. Ensure you have valid Edamam API credentials.

---

## 🚀 Future Enhancements

- Backend integration (Node.js + MongoDB)
- Secure authentication with JWT
- User profile management
- Dark mode support
- Pagination for search results

---

## 👨‍💻 Author

Mahesh Kota  
GitHub: https://github.com/maheshkota03