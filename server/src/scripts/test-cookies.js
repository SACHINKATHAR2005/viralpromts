/**
 * Cookie Authentication Test Script
 * This script demonstrates how to test cookie-based authentication
 */

const API_BASE = 'http://localhost:6000/api';

// Test data
const testUser = {
    username: 'cookietest',
    email: 'cookietest@example.com',
    password: 'password123'
};

console.log('🍪 Cookie Authentication Test Guide');
console.log('=====================================\n');

console.log('1. Register with cookies:');
console.log(`curl -X POST ${API_BASE}/auth/register \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '${JSON.stringify(testUser)}' \\`);
console.log(`  -c cookies.txt`);
console.log('');

console.log('2. Login with cookies:');
console.log(`curl -X POST ${API_BASE}/auth/login \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"email":"${testUser.email}","password":"${testUser.password}"}' \\`);
console.log(`  -c cookies.txt`);
console.log('');

console.log('3. Access protected route using cookies:');
console.log(`curl -X GET ${API_BASE}/auth/me \\`);
console.log(`  -b cookies.txt`);
console.log('');

console.log('4. Access admin route (if user has admin role):');
console.log(`curl -X GET ${API_BASE}/admin/stats \\`);
console.log(`  -b cookies.txt`);
console.log('');

console.log('5. Logout (clears cookies):');
console.log(`curl -X POST ${API_BASE}/auth/logout \\`);
console.log(`  -b cookies.txt \\`);
console.log(`  -c cookies.txt`);
console.log('');

console.log('📝 Benefits of Cookie-based Authentication:');
console.log('✅ HTTP-only cookies prevent XSS attacks');
console.log('✅ Secure flag ensures HTTPS-only transmission in production');
console.log('✅ SameSite=strict prevents CSRF attacks');
console.log('✅ Automatic cookie management by browser');
console.log('✅ No need to manually handle token storage');
console.log('');

console.log('🔄 Fallback Support:');
console.log('✅ Still supports Authorization header for mobile apps');
console.log('✅ Cookies take priority when both are present');
console.log('✅ Graceful fallback for environments that don\'t support cookies');
console.log('');

console.log('🚀 Frontend Implementation (JavaScript):');
console.log(`
// Login with cookies
fetch('${API_BASE}/auth/login', {
  method: 'POST',
  credentials: 'include', // Important: Include cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: '${testUser.email}',
    password: '${testUser.password}'
  })
});

// Make authenticated requests
fetch('${API_BASE}/auth/me', {
  credentials: 'include' // Automatically sends cookies
});

// Logout
fetch('${API_BASE}/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
`);

console.log('⚙️  Production Considerations:');
console.log('✅ Set NODE_ENV=production for secure cookies');
console.log('✅ Use HTTPS in production');
console.log('✅ Configure CLIENT_URL for your domain');
console.log('✅ Consider cookie expiration policies');