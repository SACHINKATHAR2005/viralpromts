# Frontend Debug Guide

## How to Test Registration & Login

### Prerequisites
1. Backend server running on port 6000
2. Frontend server running on port 3000

### Start Frontend Server
```powershell
cd c:\backed2025\viralPromts\client
npm run dev
```

### Testing Registration

1. **Open Browser Console** (F12 → Console tab)
2. **Navigate to**: http://localhost:3000/register
3. **Fill the form** with test data:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `Test@1234`
   - Confirm Password: `Test@1234`

4. **Click Register** and watch the console logs

### Expected Console Logs (Success Flow)

```
🔗 API Base URL: http://localhost:6000/api
📝 REGISTER PAGE - Form submitted
📝 REGISTER PAGE - Form data: { username: "testuser123", email: "test@example.com", passwordLength: 9, confirmPasswordLength: 9 }
🚀 REGISTER PAGE - Calling register function...
🔐 AUTH STORE - Register called with: { username: "testuser123", email: "test@example.com", passwordLength: 9 }
📤 AUTH STORE - Calling authApi.register...
🌐 API REQUEST: {
  method: "POST",
  url: "/auth/register",
  baseURL: "http://localhost:6000/api",
  fullURL: "http://localhost:6000/api/auth/register",
  data: { username: "testuser123", email: "test@example.com", password: "Test@1234" }
}
✅ API RESPONSE: {
  status: 201,
  statusText: "Created",
  data: { success: true, message: "...", data: { user: {...}, token: "..." } }
}
📥 AUTH STORE - Register response: { success: true, ... }
✅ AUTH STORE - Registration successful, user: { _id: "...", username: "testuser123", ... }
✅ REGISTER PAGE - Registration successful, redirecting to /explore
```

### Expected Console Logs (Error Flow)

If you see errors, check:

1. **Network Error (ERR_CONNECTION_REFUSED)**
   ```
   ❌ API RESPONSE ERROR: { message: "Network Error", ... }
   ```
   - **Solution**: Check if backend is running on port 6000
   - **Solution**: Restart frontend server to pick up `.env.local` changes

2. **CORS Error**
   ```
   Access to XMLHttpRequest at 'http://localhost:6000/api/auth/register' from origin 'http://localhost:3000' has been blocked by CORS
   ```
   - **Solution**: Backend CORS is not configured correctly
   - Check `server/src/app.ts` has correct CORS settings

3. **400 Bad Request**
   ```
   ❌ API RESPONSE ERROR: {
     status: 400,
     data: { success: false, message: "Username, email, and password are required" }
   }
   ```
   - **Solution**: Check what data is being sent in the API REQUEST log

4. **401 Unauthorized**
   ```
   ❌ API RESPONSE ERROR: { status: 401, ... }
   ```
   - **Solution**: Invalid credentials (for login)

### Testing Login

1. **Navigate to**: http://localhost:3000/login
2. **Use credentials from registration**:
   - Email: `test@example.com`
   - Password: `Test@1234`
3. **Watch console logs** similar to registration

### Debugging Tips

1. **Check API URL**: First log should show `🔗 API Base URL: http://localhost:6000/api`
   - If it shows port 5000, restart frontend server

2. **Check Request Data**: Look for `🌐 API REQUEST` log
   - Verify `fullURL` is correct
   - Verify `data` contains correct fields

3. **Check Response**: Look for `✅ API RESPONSE` or `❌ API RESPONSE ERROR`
   - Check status code
   - Check response data

4. **Check Cookies**: After successful login/register
   - Open DevTools → Application → Cookies → http://localhost:3000
   - Should see `authToken` cookie with httpOnly flag

### Common Issues

| Issue | Console Log | Solution |
|-------|-------------|----------|
| Wrong API URL | API Base URL: http://localhost:5000/api | Restart frontend server |
| Backend not running | Network Error | Start backend: `npm run dev` in server folder |
| CORS blocked | CORS error in console | Check backend CORS config |
| Invalid data | 400 Bad Request | Check API REQUEST log for data sent |
| Cookie not set | No error but auth fails | Check browser cookies, backend cookie settings |

### Postman Comparison

If Postman works but frontend doesn't:
1. Compare request URL (Postman vs `🌐 API REQUEST` log)
2. Compare request body (Postman vs `data` field in log)
3. Compare response (Postman vs `✅ API RESPONSE` log)
4. Check if cookie is being set in browser DevTools

### Success Criteria

✅ Registration creates user in database
✅ Cookie `authToken` is set in browser
✅ User is redirected to `/explore` page
✅ Navbar shows user as authenticated
✅ Can access protected routes without redirect
