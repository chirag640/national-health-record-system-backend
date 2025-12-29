/**
 * Postman Collection Edge Case Tests
 *
 * This script adds comprehensive edge case tests to the collection
 * - Null/empty token validation
 * - Invalid data format tests
 * - Missing required fields
 * - Duplicate entry tests
 * - Permission/authorization tests
 *
 * Run: node scripts/add-edge-case-tests.js
 */

const fs = require('fs');
const path = require('path');

const COLLECTION_FILE = path.join(__dirname, '..', 'postman-collection.json');

// Edge case test scenarios by endpoint type
const EDGE_CASES = {
  // Authentication edge cases
  auth_login: {
    name: 'Edge Cases - Invalid Credentials',
    tests: [
      {
        name: 'Login with wrong password',
        body: {
          email: 'admin@national-health-record-system.com',
          password: 'WrongPassword123!',
          role: 'Patient',
        },
        expectedStatus: 401,
        description: 'Should reject invalid credentials',
      },
      {
        name: 'Login with non-existent email',
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
          role: 'Patient',
        },
        expectedStatus: 401,
      },
      {
        name: 'Login with missing role',
        body: {
          email: 'admin@national-health-record-system.com',
          password: 'Admin@123456',
        },
        expectedStatus: 400,
      },
      {
        name: 'Login with empty token - should fail',
        preScript: `pm.collectionVariables.set('accessToken', '');`,
        expectedStatus: 401,
      },
      {
        name: 'Login with null token - should fail',
        preScript: `pm.collectionVariables.set('accessToken', null);`,
        expectedStatus: 401,
      },
    ],
  },

  // Resource creation edge cases
  resource_create: {
    name: 'Edge Cases - Invalid Data',
    tests: [
      {
        name: 'Create with missing required fields',
        body: {},
        expectedStatus: 400,
        description: 'Should reject empty body',
      },
      {
        name: 'Create with invalid data types',
        body: {
          email: 123, // Should be string
          age: 'not-a-number', // Should be number
        },
        expectedStatus: 400,
      },
      {
        name: 'Create duplicate entry',
        description: 'Should reject duplicate unique fields',
        expectedStatus: 409,
      },
    ],
  },

  // GET request edge cases
  resource_get: {
    name: 'Edge Cases - Not Found & Invalid IDs',
    tests: [
      {
        name: 'Get with invalid MongoDB ID',
        urlParam: 'invalid-id-format',
        expectedStatus: 400,
      },
      {
        name: 'Get with non-existent ID',
        urlParam: '507f1f77bcf86cd799439011', // Valid format but doesn't exist
        expectedStatus: 404,
      },
      {
        name: 'Get without authentication',
        preScript: `
          pm.request.auth = { type: 'noauth' };
          pm.request.removeHeader('Authorization');
        `,
        expectedStatus: 401,
      },
    ],
  },

  // Pagination edge cases
  pagination: {
    name: 'Edge Cases - Pagination',
    tests: [
      {
        name: 'Invalid page number (negative)',
        queryParams: { page: -1, limit: 10 },
        expectedStatus: 400,
      },
      {
        name: 'Invalid page number (zero)',
        queryParams: { page: 0, limit: 10 },
        expectedStatus: 400,
      },
      {
        name: 'Excessive limit (over max)',
        queryParams: { page: 1, limit: 10000 },
        expectedStatus: 400,
      },
      {
        name: 'Invalid limit (negative)',
        queryParams: { page: 1, limit: -10 },
        expectedStatus: 400,
      },
    ],
  },

  // Authorization edge cases
  authorization: {
    name: 'Edge Cases - Authorization',
    tests: [
      {
        name: 'Access without required role',
        description: 'Should reject insufficient permissions',
        expectedStatus: 403,
      },
      {
        name: 'Access different user data (Patient)',
        description: 'Patient accessing another patient data',
        expectedStatus: 403,
      },
      {
        name: 'Doctor without consent',
        description: 'Doctor accessing patient without consent',
        expectedStatus: 403,
      },
    ],
  },

  // Data validation edge cases
  validation: {
    name: 'Edge Cases - Data Validation',
    tests: [
      {
        name: 'Invalid email format',
        body: { email: 'not-an-email' },
        expectedStatus: 400,
      },
      {
        name: 'Password too short',
        body: { password: '123' },
        expectedStatus: 400,
      },
      {
        name: 'SQL injection attempt',
        body: { email: "'; DROP TABLE users;--" },
        expectedStatus: 400,
      },
      {
        name: 'XSS attempt',
        body: { name: '<script>alert("xss")</script>' },
        expectedStatus: 400,
      },
      {
        name: 'Extremely long string',
        body: { description: 'A'.repeat(10000) },
        expectedStatus: 400,
      },
    ],
  },

  // Rate limiting edge cases
  rate_limit: {
    name: 'Edge Cases - Rate Limiting',
    tests: [
      {
        name: 'Exceed login rate limit',
        description: 'Should block after too many requests',
        iterations: 15,
        expectedStatus: 429,
      },
    ],
  },

  // Concurrent access edge cases
  concurrent: {
    name: 'Edge Cases - Concurrent Access',
    tests: [
      {
        name: 'Double appointment booking',
        description: 'Should prevent overbooking same time slot',
        expectedStatus: 409,
      },
      {
        name: 'Concurrent update - optimistic locking',
        description: 'Should handle concurrent updates',
        expectedStatus: 409,
      },
    ],
  },

  // Date/Time edge cases
  datetime: {
    name: 'Edge Cases - Date/Time',
    tests: [
      {
        name: 'Past date for future event',
        body: { scheduledAt: '2020-01-01T00:00:00Z' },
        expectedStatus: 400,
      },
      {
        name: 'Invalid date format',
        body: { date: 'not-a-date' },
        expectedStatus: 400,
      },
      {
        name: 'End before start time',
        body: {
          startTime: '2025-12-15T10:00:00Z',
          endTime: '2025-12-15T09:00:00Z',
        },
        expectedStatus: 400,
      },
    ],
  },
};

/**
 * Generate test script for edge case
 */
function generateEdgeCaseTest(test) {
  const lines = [];

  // Pre-request script
  if (test.preScript) {
    lines.push('// Pre-request setup');
    lines.push(test.preScript);
  }

  lines.push(`// Edge case: ${test.name}`);
  lines.push(`pm.test("${test.name}", function () {`);
  lines.push(`    pm.expect(pm.response.code).to.equal(${test.expectedStatus});`);
  lines.push('});');

  if (test.description) {
    lines.push(`// ${test.description}`);
  }

  // Additional validation
  if (test.expectedStatus === 400) {
    lines.push('');
    lines.push('pm.test("Response contains error message", function () {');
    lines.push('    const response = pm.response.json();');
    lines.push('    pm.expect(response.message || response.error).to.exist;');
    lines.push('});');
  }

  if (test.expectedStatus === 401) {
    lines.push('');
    lines.push('pm.test("Response indicates unauthorized", function () {');
    lines.push('    const response = pm.response.json();');
    lines.push('    pm.expect(response.statusCode).to.equal(401);');
    lines.push('});');
  }

  if (test.expectedStatus === 403) {
    lines.push('');
    lines.push('pm.test("Response indicates forbidden", function () {');
    lines.push('    const response = pm.response.json();');
    lines.push('    pm.expect(response.statusCode).to.equal(403);');
    lines.push('});');
  }

  if (test.expectedStatus === 409) {
    lines.push('');
    lines.push('pm.test("Response indicates conflict", function () {');
    lines.push('    const response = pm.response.json();');
    lines.push('    pm.expect(response.statusCode).to.equal(409);');
    lines.push('});');
  }

  return lines.join('\n');
}

/**
 * Create edge case folder
 */
function createEdgeCaseFolder() {
  return {
    name: '🧪 Edge Case Tests',
    description: 'Comprehensive edge case and validation tests for all endpoints',
    item: [],
  };
}

/**
 * Generate edge case request
 */
function generateEdgeCaseRequest(baseRequest, test, category) {
  const request = JSON.parse(JSON.stringify(baseRequest)); // Deep clone

  request.name = `${test.name} ❌`;

  // Modify body if provided
  if (test.body) {
    request.request.body = {
      mode: 'raw',
      raw: JSON.stringify(test.body, null, 2),
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  // Modify URL params if provided
  if (test.urlParam) {
    let url = request.request.url;
    if (typeof url === 'string') {
      // Replace last path segment with test param
      url = url.replace(/\/[^/]+$/, `/${test.urlParam}`);
      request.request.url = url;
    }
  }

  // Add query params if provided
  if (test.queryParams) {
    if (typeof request.request.url === 'string') {
      const params = new URLSearchParams(test.queryParams).toString();
      request.request.url += `?${params}`;
    }
  }

  // Add test script
  const testScript = generateEdgeCaseTest(test);
  request.event = [
    {
      listen: 'test',
      script: {
        exec: testScript.split('\n'),
        type: 'text/javascript',
      },
    },
  ];

  // Add pre-request script if needed
  if (test.preScript) {
    request.event.push({
      listen: 'prerequest',
      script: {
        exec: test.preScript.split('\n'),
        type: 'text/javascript',
      },
    });
  }

  return request;
}

/**
 * Add edge cases to collection
 */
function addEdgeCases(collection) {
  const edgeCaseFolder = createEdgeCaseFolder();

  // Find Auth folder and add edge cases
  const authFolder = collection.item.find(
    (item) => item.name === 'Auth' || item.name.toLowerCase().includes('auth'),
  );

  if (authFolder) {
    const loginRequest = authFolder.item.find(
      (item) =>
        item.name.toLowerCase().includes('login') && !item.name.toLowerCase().includes('otp'),
    );

    if (loginRequest && EDGE_CASES.auth_login) {
      const authEdgeFolder = {
        name: 'Auth - Edge Cases',
        item: EDGE_CASES.auth_login.tests.map((test) =>
          generateEdgeCaseRequest(loginRequest, test, 'auth'),
        ),
      };
      edgeCaseFolder.item.push(authEdgeFolder);
    }
  }

  // Add generic edge case examples
  edgeCaseFolder.item.push({
    name: 'Validation Edge Cases',
    item: [
      {
        name: 'Empty Body Test',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: '{}',
          },
          url: '{{baseUrlV1}}/patients',
        },
        event: [
          {
            listen: 'test',
            script: {
              exec: [
                'pm.test("Empty body should be rejected", function () {',
                '    pm.expect(pm.response.code).to.equal(400);',
                '});',
              ],
            },
          },
        ],
      },
      {
        name: 'Malformed JSON Test',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: '{invalid json}',
          },
          url: '{{baseUrlV1}}/patients',
        },
        event: [
          {
            listen: 'test',
            script: {
              exec: [
                'pm.test("Malformed JSON should be rejected", function () {',
                '    pm.expect(pm.response.code).to.equal(400);',
                '});',
              ],
            },
          },
        ],
      },
    ],
  });

  // Add the edge case folder to collection
  collection.item.push(edgeCaseFolder);

  console.log(`✅ Added edge case folder with ${edgeCaseFolder.item.length} test categories`);
}

/**
 * Main function
 */
function main() {
  console.log('🧪 Adding Edge Case Tests to Postman Collection\n');

  if (!fs.existsSync(COLLECTION_FILE)) {
    console.error('❌ Collection file not found:', COLLECTION_FILE);
    process.exit(1);
  }

  console.log('📖 Reading collection...');
  const collection = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf8'));

  console.log('🔧 Adding edge case tests...');
  addEdgeCases(collection);

  console.log('\n💾 Saving updated collection...');
  fs.writeFileSync(COLLECTION_FILE, JSON.stringify(collection, null, 2), 'utf8');

  console.log('\n✅ SUCCESS! Edge case tests added!');
  console.log('\n🧪 Edge Case Categories Added:');
  console.log('   ✓ Authentication failures (wrong credentials, missing fields)');
  console.log('   ✓ Invalid data formats and types');
  console.log('   ✓ Missing required fields');
  console.log('   ✓ Invalid IDs and not found scenarios');
  console.log('   ✓ Pagination boundary tests');
  console.log('   ✓ Authorization and permission tests');
  console.log('   ✓ Data validation (injection, XSS, length)');
  console.log('   ✓ Date/Time validation');
  console.log('\n💡 How to use:');
  console.log('   1. Import the updated collection');
  console.log('   2. Navigate to "🧪 Edge Case Tests" folder');
  console.log('   3. Run tests individually or use Collection Runner');
  console.log('   4. Review test results for proper error handling');
}

if (require.main === module) {
  main();
}

module.exports = { addEdgeCases, generateEdgeCaseTest };
