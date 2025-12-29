/**
 * Postman Collection Validator and Fixer
 *
 * This script validates and fixes common issues in the Postman collection:
 * - Missing access token handling
 * - Incorrect URL variables
 * - Missing test scripts
 * - Inconsistent auth configuration
 *
 * Run: node scripts/fix-postman-collection.js
 */

const fs = require('fs');
const path = require('path');

const COLLECTION_FILE = path.join(__dirname, '..', 'postman-collection.json');
const BACKUP_FILE = path.join(__dirname, '..', 'postman-collection-prefixed.backup.json');

// Common test script for login/auth endpoints
const AUTH_TEST_SCRIPT = `if (pm.response.code === 200 || pm.response.code === 201) {
    try {
        const response = pm.response.json();
        
        // Save access token (handle both direct and nested response)
        const data = response.data || response;
        if (data.accessToken) {
            pm.collectionVariables.set('accessToken', data.accessToken);
            console.log('✅ Access token saved');
        } else if (response.accessToken) {
            pm.collectionVariables.set('accessToken', response.accessToken);
            console.log('✅ Access token saved');
        }
        
        // Save refresh token
        if (data.refreshToken) {
            pm.collectionVariables.set('refreshToken', data.refreshToken);
            console.log('✅ Refresh token saved');
        } else if (response.refreshToken) {
            pm.collectionVariables.set('refreshToken', response.refreshToken);
            console.log('✅ Refresh token saved');
        }
        
        // Save user info
        if (data.userId) {
            pm.collectionVariables.set('userId', data.userId);
        }
        if (data.role) {
            pm.collectionVariables.set('userRole', data.role);
        }
        
        console.log('🔐 Login successful - Tokens saved');
    } catch (e) {
        console.error('❌ Failed to parse auth response:', e.message);
    }
}

// Validate token is not null
pm.test("Access token is not null", function () {
    const token = pm.collectionVariables.get('accessToken');
    pm.expect(token).to.not.be.null;
    pm.expect(token).to.not.equal('');
    pm.expect(token).to.not.equal('null');
});

pm.test("Status code is successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});`;

// Test script for resource creation endpoints
const CREATE_RESOURCE_TEST = `if (pm.response.code === 201 || pm.response.code === 200) {
    try {
        const response = pm.response.json();
        const data = response.data || response;
        
        if (data._id) {
            // Auto-detect resource type from request name
            const requestName = pm.info.requestName.toLowerCase();
            let varName = '';
            
            if (requestName.includes('patient')) varName = 'patientId';
            else if (requestName.includes('doctor')) varName = 'doctorId';
            else if (requestName.includes('hospital')) varName = 'hospitalId';
            else if (requestName.includes('appointment')) varName = 'appointmentId';
            else if (requestName.includes('prescription')) varName = 'prescriptionId';
            else if (requestName.includes('encounter')) varName = 'encounterId';
            else if (requestName.includes('consent')) varName = 'consentId';
            else if (requestName.includes('invoice')) varName = 'invoiceId';
            else if (requestName.includes('payment')) varName = 'paymentId';
            else if (requestName.includes('lab') || requestName.includes('report')) varName = 'labReportId';
            else if (requestName.includes('telemedicine') || requestName.includes('session')) varName = 'telemedicineSessionId';
            else if (requestName.includes('notification')) varName = 'notificationId';
            
            if (varName) {
                pm.collectionVariables.set(varName, data._id);
                console.log(\`✅ \${varName} saved: \${data._id}\`);
            }
        }
    } catch (e) {
        console.error('⚠️ Could not parse response:', e.message);
    }
}

pm.test("Status code is 201 Created", function () {
    pm.expect(pm.response.code).to.equal(201);
});

pm.test("Response has ID", function () {
    const response = pm.response.json();
    const data = response.data || response;
    pm.expect(data._id).to.exist;
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});`;

// Standard test script for GET requests
const GET_REQUEST_TEST = `pm.test("Status code is 200 OK", function () {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test("Response is JSON", function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});`;

/**
 * Fix URL issues - ensure correct base URL usage
 */
function fixUrls(item) {
  if (item.request && item.request.url) {
    let url = typeof item.request.url === 'string' ? item.request.url : item.request.url.raw;

    if (!url) return;

    // Fix common URL issues
    // 1. Auth endpoints should use {{baseUrl}} (no version)
    if (url.includes('/auth/')) {
      url = url.replace('{{baseUrlV1}}', '{{baseUrl}}');
    }
    // 2. Versioned endpoints should use {{baseUrlV1}}
    else if (
      url.includes('/patients') ||
      url.includes('/doctors') ||
      url.includes('/hospitals') ||
      url.includes('/encounters') ||
      url.includes('/appointments') ||
      url.includes('/prescriptions') ||
      url.includes('/consents') ||
      url.includes('/lab-reports') ||
      url.includes('/medical-history')
    ) {
      url = url.replace('{{baseUrl}}', '{{baseUrlV1}}');
    }

    // Update URL
    if (typeof item.request.url === 'string') {
      item.request.url = url;
    } else {
      item.request.url.raw = url;
    }
  }
}

/**
 * Fix authentication configuration
 */
function fixAuth(item) {
  const url = typeof item.request?.url === 'string' ? item.request.url : item.request?.url?.raw;
  if (!url) return;

  // Auth endpoints that don't need bearer token
  const noAuthPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
    '/health',
    '/verify/', // Public verification endpoints
  ];

  const needsNoAuth = noAuthPaths.some((path) => url.includes(path));

  if (needsNoAuth) {
    item.request.auth = { type: 'noauth' };
  } else {
    // Remove auth to inherit from collection
    delete item.request.auth;
  }
}

/**
 * Add or fix test scripts
 */
function fixTestScripts(item) {
  const name = item.name?.toLowerCase() || '';
  const method = item.request?.method?.toUpperCase();

  let script = '';

  // Login/Auth endpoints
  if (
    name.includes('login') ||
    name.includes('register') ||
    name.includes('refresh') ||
    name.includes('verify otp')
  ) {
    script = AUTH_TEST_SCRIPT;
  }
  // Create endpoints
  else if (method === 'POST' && (name.includes('create') || name.startsWith('add'))) {
    script = CREATE_RESOURCE_TEST;
  }
  // GET endpoints
  else if (method === 'GET') {
    script = GET_REQUEST_TEST;
  }
  // Other endpoints - basic tests
  else {
    script = `pm.test("Status code is successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});`;
  }

  if (script) {
    item.event = item.event || [];

    // Remove existing test event
    item.event = item.event.filter((e) => e.listen !== 'test');

    // Add new test event
    item.event.push({
      listen: 'test',
      script: {
        exec: script.split('\n'),
        type: 'text/javascript',
      },
    });
  }
}

/**
 * Recursively process collection items
 */
function processItems(items) {
  if (!items) return;

  for (const item of items) {
    if (item.item) {
      // It's a folder, process recursively
      processItems(item.item);
    } else if (item.request) {
      // It's a request, fix it
      fixUrls(item);
      fixAuth(item);
      fixTestScripts(item);
    }
  }
}

/**
 * Validate collection structure
 */
function validateCollection(collection) {
  const issues = [];

  // Check required fields
  if (!collection.info) {
    issues.push('Missing info object');
  }
  if (!collection.item) {
    issues.push('Missing item array');
  }
  if (!collection.variable) {
    issues.push('Missing variable array');
  }

  // Check for accessToken variable
  const hasAccessToken = collection.variable?.some((v) => v.key === 'accessToken');
  if (!hasAccessToken) {
    issues.push('Missing accessToken variable');
  }

  return issues;
}

/**
 * Add missing variables
 */
function ensureVariables(collection) {
  const requiredVars = [
    { key: 'baseUrl', value: 'http://localhost:3000/api', type: 'string' },
    { key: 'baseUrlV1', value: 'http://localhost:3000/api/v1', type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
    { key: 'refreshToken', value: '', type: 'string' },
    { key: 'userId', value: '', type: 'string' },
    { key: 'userRole', value: '', type: 'string' },
    { key: 'patientId', value: '', type: 'string' },
    { key: 'hospitalId', value: '', type: 'string' },
    { key: 'doctorId', value: '', type: 'string' },
    { key: 'prescriptionId', value: '', type: 'string' },
    { key: 'appointmentId', value: '', type: 'string' },
    { key: 'encounterId', value: '', type: 'string' },
    { key: 'consentId', value: '', type: 'string' },
    { key: 'notificationId', value: '', type: 'string' },
    { key: 'invoiceId', value: '', type: 'string' },
    { key: 'paymentId', value: '', type: 'string' },
    { key: 'labReportId', value: '', type: 'string' },
    { key: 'telemedicineSessionId', value: '', type: 'string' },
    { key: 'documentId', value: '', type: 'string' },
    { key: 'allergyId', value: '', type: 'string' },
  ];

  collection.variable = collection.variable || [];

  const existingKeys = new Set(collection.variable.map((v) => v.key));

  for (const reqVar of requiredVars) {
    if (!existingKeys.has(reqVar.key)) {
      collection.variable.push(reqVar);
      console.log(`✅ Added missing variable: ${reqVar.key}`);
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔧 Postman Collection Fixer\n');

  // Check if collection exists
  if (!fs.existsSync(COLLECTION_FILE)) {
    console.error('❌ Collection file not found:', COLLECTION_FILE);
    process.exit(1);
  }

  // Read collection
  console.log('📖 Reading collection...');
  const collection = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf8'));

  // Validate
  console.log('🔍 Validating collection...');
  const issues = validateCollection(collection);
  if (issues.length > 0) {
    console.warn('⚠️  Found issues:', issues);
  }

  // Backup
  console.log('💾 Creating backup...');
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(collection, null, 2), 'utf8');
  console.log(`✅ Backup saved: ${BACKUP_FILE}\n`);

  // Fix
  console.log('🔧 Fixing issues...');
  ensureVariables(collection);
  processItems(collection.item);

  // Ensure collection-level auth
  if (!collection.auth) {
    collection.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{accessToken}}',
          type: 'string',
        },
      ],
    };
    console.log('✅ Added collection-level auth');
  }

  // Save
  console.log('\n💾 Saving fixed collection...');
  fs.writeFileSync(COLLECTION_FILE, JSON.stringify(collection, null, 2), 'utf8');

  console.log('\n✅ SUCCESS! Collection has been fixed!');
  console.log('\n📊 Summary:');
  console.log(`   - Folders: ${collection.item?.length || 0}`);
  console.log(`   - Variables: ${collection.variable?.length || 0}`);
  console.log(`   - Backup: ${BACKUP_FILE}`);
  console.log('\n🎯 Key Fixes Applied:');
  console.log('   ✓ Fixed access token handling in all login endpoints');
  console.log('   ✓ Corrected URL variable usage (baseUrl vs baseUrlV1)');
  console.log('   ✓ Added comprehensive test scripts');
  console.log('   ✓ Fixed authentication configuration');
  console.log('   ✓ Added missing collection variables');
  console.log('\n💡 Next Steps:');
  console.log('   1. Import the updated collection into Postman');
  console.log('   2. Run the "Login (Default Admin)" request to get tokens');
  console.log('   3. All other requests will automatically use the saved token');
}

// Run
if (require.main === module) {
  main();
}

module.exports = { fixUrls, fixAuth, fixTestScripts, processItems };
