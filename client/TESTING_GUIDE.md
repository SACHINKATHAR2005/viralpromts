# 🚀 Quick Start Guide - Testing Viral Prompts

## Prerequisites
- Node.js installed
- MongoDB running
- Redis running (optional, for caching)

---

## Step 1: Start Backend Server

```bash
cd c:\backed2025\viralPromts\server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
MongoDB Connected
```

---

## Step 2: Start Frontend

Open a **new terminal**:

```bash
cd c:\backed2025\viralPromts\client
npm run dev
```

**Expected Output:**
```
Ready on http://localhost:3000
```

---

## Step 3: Test the Application

### 1️⃣ **Register a New Account**
- Visit: `http://localhost:3000/register`
- Fill in:
  - Username: `testuser`
  - Email: `test@example.com`
  - Password: `password123`
  - Confirm Password: `password123`
- Click "Create Account"
- ✅ You should be redirected to `/explore`

### 2️⃣ **Login (if already registered)**
- Visit: `http://localhost:3000/login`
- Enter email and password
- Click "Sign In"
- ✅ Redirected to `/explore`

### 3️⃣ **Create a Prompt**
- Click "Create" button in navbar
- Or visit: `http://localhost:3000/prompts/create`
- Fill in:
  - Title: "Create Amazing Product Photos"
  - Description: "Generate professional product photography with AI"
  - Prompt Text: "Create a professional product photo of [product] on a clean white background with studio lighting..."
  - Category: "AI Art"
  - AI Platform: Select "Midjourney" and "DALL-E"
  - Tags: Add "product-photography", "ecommerce"
- Click "Publish"
- ✅ Redirected to prompt detail page

### 4️⃣ **Browse Prompts**
- Visit: `http://localhost:3000/explore`
- ✅ See your created prompt in the masonry grid
- Click on any prompt card to view details

### 5️⃣ **View Profile**
- Click your username in navbar
- Or visit: `http://localhost:3000/profile`
- ✅ See your stats, prompts, and profile info
- Try editing your profile

### 6️⃣ **Test Social Features**
- On a prompt detail page:
  - Click ❤️ Like button
  - Click 🔖 Save button
  - Add a comment
  - Copy the prompt
- ✅ All buttons should work

---

## 🐛 Common Issues & Fixes

### Issue: "ERR_CONNECTION_REFUSED"
**Fix:** Backend server is not running
```bash
cd c:\backed2025\viralPromts\server
npm run dev
```

### Issue: "Hydration mismatch"
**Fix:** Already fixed! Just refresh the page. This was caused by browser extensions (Grammarly).

### Issue: "Cannot read property of null"
**Fix:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongod --version
```

### Issue: Cookies not working
**Fix:** Make sure both frontend and backend are running on the correct ports:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## 📋 API Endpoints Summary

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/profile` - Update profile

### Prompts
- `GET /api/prompts` - Get all prompts
- `GET /api/prompts/my` - Get my prompts
- `GET /api/prompts/:id` - Get single prompt
- `POST /api/prompts` - Create prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `POST /api/prompts/:id/copy` - Copy/purchase prompt

### Social
- `POST /api/social/like/:promptId` - Like prompt
- `DELETE /api/social/like/:promptId` - Unlike prompt
- `POST /api/social/comment/:promptId` - Add comment
- `GET /api/social/comments/:promptId` - Get comments
- `POST /api/social/save/:promptId` - Save prompt
- `POST /api/social/follow/:userId` - Follow user
- `DELETE /api/social/follow/:userId` - Unfollow user

---

## ✅ What's Working

✅ User Registration & Login  
✅ Cookie-based Authentication  
✅ Protected Routes  
✅ Create Prompts  
✅ View Prompts (Detail & Grid)  
✅ Like & Save Prompts  
✅ Comments System  
✅ User Profile  
✅ Edit Profile  
✅ Pinterest-style Masonry Grid  
✅ Responsive Design  
✅ Dark Mode Support  

---

## 🎯 Next Steps

1. Test all features thoroughly
2. Add more prompts to see the grid layout
3. Test social interactions (like, comment, save)
4. Try the monetization features
5. Upload proof images when creating prompts

Happy Testing! 🚀
