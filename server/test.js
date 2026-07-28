// A verification script to test local session authentication endpoints
// and inspect the cookie-based session lifecycle.

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/auth`;

async function runTests() {
  console.log('\n==================================================');
  console.log('   STARTING AUTHENTICATION VERIFICATION TESTS     ');
  console.log('==================================================\n');

  let testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'securePassword123'
  };

  // 1. User Registration
  console.log(`[1] Registering user: ${testUser.email}...`);
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  console.log(`Status: ${regRes.status}`);
  console.log('Body:', regData);
  console.log('--------------------------------------------------\n');

  // 2. User Login
  console.log('[2] Logging in user...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const loginData = await loginRes.json();
  console.log(`Status: ${loginRes.status}`);
  console.log('Body:', loginData);
  
  // Extract Session Cookie (connect.sid)
  const rawCookie = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie Header:', rawCookie);

  if (!rawCookie) {
    console.log('\n❌ FAILED: No session cookie (connect.sid) returned in headers!');
    return;
  }

  const cookie = rawCookie.split(';')[0];
  console.log('Extracted Cookie:', cookie);
  console.log('--------------------------------------------------\n');

  // 3. Access Protected Route (/me) with valid session
  console.log('[3] Fetching current user details (/me) WITH session cookie...');
  const meRes = await fetch(`${BASE_URL}/me`, {
    headers: { Cookie: cookie }
  });
  const meData = await meRes.json();
  console.log(`Status: ${meRes.status}`);
  console.log('Body:', meData);
  console.log('--------------------------------------------------\n');

  // 4. Access Protected Route (/me) WITHOUT session cookie
  console.log('[4] Fetching current user details (/me) WITHOUT session cookie...');
  const anonRes = await fetch(`${BASE_URL}/me`);
  const anonData = await anonRes.json();
  console.log(`Status: ${anonRes.status}`);
  console.log('Body (Expected failure):', anonData);
  console.log('--------------------------------------------------\n');

  // 5. User Logout
  console.log('[5] Logging out (destroying session)...');
  const logoutRes = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { Cookie: cookie }
  });
  const logoutData = await logoutRes.json();
  console.log(`Status: ${logoutRes.status}`);
  console.log('Body:', logoutData);
  console.log('--------------------------------------------------\n');

  // 6. Access Protected Route (/me) after session destruction
  console.log('[6] Fetching current user details (/me) AFTER logging out...');
  const postLogoutRes = await fetch(`${BASE_URL}/me`, {
    headers: { Cookie: cookie }
  });
  const postLogoutData = await postLogoutRes.json();
  console.log(`Status: ${postLogoutRes.status}`);
  console.log('Body (Expected failure):', postLogoutData);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Connection Error: Ensure your server is running before executing tests.');
  console.error(err.message);
});
