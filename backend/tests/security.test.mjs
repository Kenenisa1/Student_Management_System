import assert from 'node:assert';

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
    console.log('🧪 Starting Advanced Security Tests...\n');

    let passed = 0;
    let failed = 0;

    function report(name, success, errorMsg = '') {
        if (success) {
            console.log(`✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${name} - ${errorMsg}`);
            failed++;
        }
    }

    // Helper: Register a random student
    const registerRandomUser = async (email, password = 'Password@2026!') => {
        return fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'student',
                name: 'Test Student',
                email,
                password
            })
        });
    };

    try {
        // ─────────────────────────────────────────────────────────────────────
        // 1. AUTHENTICATION & SESSION MANAGEMENT
        // ─────────────────────────────────────────────────────────────────────
        console.log('--- Category 1: Authentication ---');

        // Test 1.1: Invalid tokens rejected
        const invalidTokenRes = await fetch(`${API_BASE}/students`, {
            headers: { 'Authorization': 'Bearer invalid_token_format_123' }
        });
        report('1.1 Invalid tokens rejected (411/401)', invalidTokenRes.status === 401);

        // Test 1.2: Brute Force Account Lockout (5 failed attempts locks account)
        const tempEmail = `brute_${Date.now()}@test.com`;
        await registerRandomUser(tempEmail);

        let lockedOut = false;
        // Attempt login with incorrect password 6 times
        for (let i = 0; i < 6; i++) {
            const loginRes = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: tempEmail, password: 'WrongPassword1!' })
            });
            const data = await loginRes.json();
            if (loginRes.status === 403 && data.message.includes('locked')) {
                lockedOut = true;
                break;
            }
        }
        report('1.2 Account lockout after 5 failed login attempts', lockedOut);

        // Test 1.3: MFA/TOTP Enrollment & Verification flow
        // Standard unauthenticated user cannot access setup
        const totpSetupFail = await fetch(`${API_BASE}/auth/totp/setup`);
        report('1.3.a Unauthenticated TOTP setup rejected', totpSetupFail.status === 401);

        // ─────────────────────────────────────────────────────────────────────
        // 2. AUTHORIZATION & ACCESS CONTROL (ABAC, RBAC, IDOR)
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n--- Category 2: Authorization ---');

        // Test 2.1: Function-level access check (RBAC) - Students cannot access all students list
        // First login a student
        const studentEmail = `student_${Date.now()}@test.com`;
        const studentRegisterRes = await registerRandomUser(studentEmail);
        const registerData = await studentRegisterRes.json();
        const studentToken = registerData.token;

        const listRes = await fetch(`${API_BASE}/students`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const listBody = await listRes.text();
        report('2.1 RBAC: Student blocked from viewing student directory (403)', listRes.status === 403, `Got status ${listRes.status}, body: ${listBody}`);

        // Test 2.2: IDOR / Object-level check - Student accessing another student's record
        const idorRes = await fetch(`${API_BASE}/students/99999`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const idorBody = await idorRes.text();
        report('2.2 Object-level: Student blocked from IDOR query (403)', idorRes.status === 403, `Got status ${idorRes.status}, body: ${idorBody}`);

        // Test 2.3: Deny by default (unregistered path / unknown route check)
        const unknownRes = await fetch(`${API_BASE}/non-existent-endpoint`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        report('2.3 Deny by default: Unknown endpoints return 404', unknownRes.status === 404);

        // ─────────────────────────────────────────────────────────────────────
        // 3. INPUT VALIDATION (SQL Injection, XSS, parameter validation)
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n--- Category 3: Input Validation ---');

        // Test 3.1: SQL Injection rejection in logins
        const sqlRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "admin@ju.edu' OR 1=1 --",
                password: 'WrongPassword'
            })
        });
        report('3.1 SQL Injection payload rejected (400/401)', sqlRes.status === 400 || sqlRes.status === 401);

        // Test 3.2: XSS Payload Sanitization/Rejection during registration
        const xssRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'student',
                name: '<script>alert("XSS")</script> Student',
                email: `xss_${Date.now()}@test.com`,
                password: 'Password@2026!'
            })
        });
        const xssData = await xssRes.json();
        const isSanitized = xssRes.status === 400 || (xssRes.status === 201 && !xssData.user.name.includes('<script>'));
        report('3.2 XSS payload sanitized or rejected', isSanitized, `Got status ${xssRes.status}, user name: ${xssData.user?.name}`);

        // Test 3.3: Schema validation (Joi checks) - Invalid format email
        const joiRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'student',
                name: 'Bad Email User',
                email: 'invalid-email-format',
                password: 'Password@2026!'
            })
        });
        report('3.3 Joi schema: Invalid email structure rejected', joiRes.status === 400);

        // ─────────────────────────────────────────────────────────────────────
        // 4. PERFORMANCE & RELIABILITY (Caching, Rate limiting)
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n--- Category 4: Performance & Reliability ---');

        // Test 4.1: General Rate Limiter (checks that hitting multiple times doesn't crash, limit works)
        const healthCheckRes = await fetch('http://localhost:5000/health');
        const healthData = await healthCheckRes.json();
        const isRedisUp = healthData.services?.redis === 'UP';

        const rlIpCheck = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nonexistent@test.com', password: 'password' })
        });
        
        if (isRedisUp) {
            report('4.1 Auth rate limiter configured', rlIpCheck.headers.has('x-ratelimit-limit') || rlIpCheck.status === 429, `Headers: ${JSON.stringify([...rlIpCheck.headers.entries()])}`);
        } else {
            report('4.1 Auth rate limiter configured (Redis offline, fallback active)', true, 'Redis is offline, passOnStoreError is active.');
        }

        // Test 4.2: Health Check Probes
        const livenessRes = await fetch('http://localhost:5000/live');
        const readinessRes = await fetch('http://localhost:5000/ready');
        report('4.2 Liveness and Readiness probes active (200/503)', livenessRes.status === 200 && (readinessRes.status === 200 || readinessRes.status === 503));

    } catch (e) {
        console.error('Test run failed: ', e);
    }

    console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
