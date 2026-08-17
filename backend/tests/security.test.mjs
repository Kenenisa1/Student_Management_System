import assert from 'node:assert';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
    console.log('🧪 Starting Security Tests...\n');

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

    try {
        // Test 1: XSS payload in registration name
        console.log('--- Test 1: XSS Sanitization ---');
        const xssRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'student',
                name: '<script>alert("xss")</script> Bad Actor',
                email: 'xss@test.com',
                password: 'Password@123'
            })
        });
        const xssData = await xssRes.json();
        // The validator.escape might sanitize or reject it.
        // If it rejects or creates the user with sanitized name, it's a pass.
        if (xssRes.status === 400 || (xssRes.status === 201 && !xssData.user.name.includes('<script>'))) {
            report('XSS payload sanitized or rejected', true);
        } else {
            report('XSS payload sanitized or rejected', false, 'Payload was accepted un-sanitized');
        }

        // Test 2: SQL Injection payload in login
        console.log('\n--- Test 2: SQL Injection Prevention ---');
        const sqlRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "admin@ju.edu' OR '1'='1",
                password: 'wrongpassword'
            })
        });
        // Should be rejected by email validator or parameterized query (returning 400 or 401)
        if (sqlRes.status === 400 || sqlRes.status === 401) {
            report('SQL Injection rejected', true);
        } else {
            report('SQL Injection rejected', false, `Status ${sqlRes.status}`);
        }

        // Test 3: Password Complexity
        console.log('\n--- Test 3: Password Complexity Enforcement ---');
        const pwRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'student',
                name: 'Weak Pass User',
                email: 'weakpass@test.com',
                password: 'password' // too weak
            })
        });
        if (pwRes.status === 400) {
            report('Weak password rejected', true);
        } else {
            report('Weak password rejected', false, `Status ${pwRes.status}`);
        }

        // Test 4: Rate Limiting (hit auth endpoint 11 times)
        console.log('\n--- Test 4: Auth Rate Limiting ---');
        let rateLimitHit = false;
        for (let i = 0; i < 15; i++) {
            const rlRes = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@test.com', password: 'password' })
            });
            if (rlRes.status === 429) {
                rateLimitHit = true;
                break;
            }
        }
        report('Auth rate limiter active (429 status)', rateLimitHit, 'Did not receive 429');

        // Test 5: Broken Access Control (Unauthenticated request to /api/students)
        console.log('\n--- Test 5: Access Control ---');
        const bacRes = await fetch(`${API_BASE}/students`, {
            method: 'GET'
        });
        if (bacRes.status === 401) {
            report('Unauthenticated request rejected', true);
        } else {
            report('Unauthenticated request rejected', false, `Status ${bacRes.status}`);
        }

    } catch (e) {
        console.error('Test execution failed:', e);
    }

    console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
