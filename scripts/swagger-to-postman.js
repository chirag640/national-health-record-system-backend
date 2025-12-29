/**
 * Swagger to Postman Collection Converter
 *
 * This script automatically syncs the NestJS Swagger documentation with Postman collection
 * Run: node scripts/swagger-to-postman.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONFIG = {
  swaggerUrl: process.env.SWAGGER_URL || 'http://localhost:3000/api-json',
  outputFile: path.join(__dirname, '..', 'postman-collection.json'),
  backupFile: path.join(__dirname, '..', 'postman-collection.backup.json'),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000/api',
  baseUrlV1: process.env.BASE_URL_V1 || 'http://localhost:3000/api/v1',
};

/**
 * Fetch Swagger JSON from the API
 */
async function fetchSwaggerJson() {
  return new Promise((resolve, reject) => {
    const client = CONFIG.swaggerUrl.startsWith('https') ? https : http;

    client
      .get(CONFIG.swaggerUrl, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse Swagger JSON: ${error.message}`));
          }
        });
      })
      .on('error', (error) => {
        reject(new Error(`Failed to fetch Swagger: ${error.message}`));
      });
  });
}

/**
 * Convert Swagger path to Postman-compatible path
 */
function convertPath(swaggerPath) {
  // Convert {id} to {{id}} for Postman variables
  return swaggerPath.replace(/{([^}]+)}/g, '{{$1}}');
}

/**
 * Get request body from Swagger schema
 */
function getRequestBody(requestBody) {
  if (!requestBody || !requestBody.content) return null;

  const content = requestBody.content['application/json'];
  if (!content || !content.schema) return null;

  // Generate example from schema
  return {
    mode: 'raw',
    raw: JSON.stringify(generateExample(content.schema), null, 2),
    options: {
      raw: {
        language: 'json',
      },
    },
  };
}

/**
 * Generate example data from schema
 */
function generateExample(schema) {
  if (schema.example) return schema.example;
  if (schema.properties) {
    const example = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (prop.example !== undefined) {
        example[key] = prop.example;
      } else if (prop.type === 'string') {
        example[key] = prop.format === 'email' ? 'user@example.com' : 'string';
      } else if (prop.type === 'number' || prop.type === 'integer') {
        example[key] = 0;
      } else if (prop.type === 'boolean') {
        example[key] = true;
      } else if (prop.type === 'array') {
        example[key] = [];
      } else if (prop.type === 'object') {
        example[key] = {};
      }
    }
    return example;
  }
  return {};
}

/**
 * Generate test script for response
 */
function generateTestScript(operationId, method, path) {
  const scripts = [];

  // Save ID from creation responses
  if (method === 'post' && (path.includes('create') || !path.includes('{'))) {
    scripts.push(
      'if (pm.response.code === 201 || pm.response.code === 200) {',
      '    try {',
      '        const response = pm.response.json();',
      '        const data = response.data || response;',
      '        ',
      '        // Auto-save IDs to collection variables',
      '        if (data._id) {',
      `            const resourceName = '${operationId.replace(/create|Create/i, '')}';`,
      '            pm.collectionVariables.set(resourceName + "Id", data._id);',
      '            console.log("✅ " + resourceName + " ID saved:", data._id);',
      '        }',
      '    } catch (e) {',
      '        console.log("⚠️ Could not parse response");',
      '    }',
      '}',
    );
  }

  // Status code test
  scripts.push(
    '',
    '// Test status code',
    'pm.test("Status code is successful", function () {',
    '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);',
    '});',
  );

  // Response time test
  scripts.push(
    '',
    '// Test response time',
    'pm.test("Response time is acceptable", function () {',
    '    pm.expect(pm.response.responseTime).to.be.below(5000);',
    '});',
  );

  return scripts.join('\n');
}

/**
 * Determine if endpoint needs authentication
 */
function needsAuth(path, method, security) {
  // Check if security is explicitly set
  if (security && security.length > 0) {
    return security.some((s) => s.bearer || s['JWT-auth']);
  }

  // Auth endpoints don't need auth
  if (path.startsWith('/auth/')) {
    return ['login', 'register', 'verify', 'refresh', 'reset', 'forgot'].some((term) =>
      path.includes(term),
    );
  }

  // Public verification endpoint
  if (path.includes('/verify/') || path.includes('/public')) {
    return false;
  }

  // Default: needs auth
  return true;
}

/**
 * Convert Swagger to Postman collection
 */
function convertSwaggerToPostman(swagger) {
  const collection = {
    info: {
      name: swagger.info.title || 'API Collection',
      description: swagger.info.description || '',
      version: swagger.info.version || '1.0.0',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{accessToken}}',
          type: 'string',
        },
      ],
    },
    variable: [
      { key: 'baseUrl', value: CONFIG.baseUrl, type: 'string' },
      { key: 'baseUrlV1', value: CONFIG.baseUrlV1, type: 'string' },
      { key: 'accessToken', value: '', type: 'string' },
      { key: 'refreshToken', value: '', type: 'string' },
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
    ],
    item: [],
  };

  // Group endpoints by tags
  const groups = {};

  for (const [path, pathItem] of Object.entries(swagger.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;

      const tags = operation.tags || ['Other'];
      const tag = tags[0];

      if (!groups[tag]) {
        groups[tag] = {
          name: tag,
          item: [],
        };
      }

      // Determine base URL
      const isVersioned = path.startsWith('/v1/') || operation.tags?.includes('v1');
      const baseUrl = isVersioned ? '{{baseUrlV1}}' : '{{baseUrl}}';
      const cleanPath = path.replace(/^\/v1/, '');

      const request = {
        name: operation.summary || `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
              type: 'text',
            },
          ],
          url: `${baseUrl}${convertPath(cleanPath)}`,
        },
      };

      // Add auth
      if (!needsAuth(path, method, operation.security)) {
        request.request.auth = { type: 'noauth' };
      }

      // Add request body
      if (['post', 'put', 'patch'].includes(method) && operation.requestBody) {
        request.request.body = getRequestBody(operation.requestBody);
      }

      // Add test script
      const testScript = generateTestScript(operation.operationId, method, path);
      if (testScript) {
        request.event = [
          {
            listen: 'test',
            script: {
              exec: testScript.split('\n'),
              type: 'text/javascript',
            },
          },
        ];
      }

      // Add description
      if (operation.description) {
        request.request.description = operation.description;
      }

      groups[tag].item.push(request);
    }
  }

  // Convert groups to array
  collection.item = Object.values(groups);

  return collection;
}

/**
 * Backup existing collection
 */
function backupCollection() {
  if (fs.existsSync(CONFIG.outputFile)) {
    fs.copyFileSync(CONFIG.outputFile, CONFIG.backupFile);
    console.log('✅ Backed up existing collection');
  }
}

/**
 * Merge with existing collection to preserve custom variables and tests
 */
function mergeWithExisting(newCollection) {
  if (!fs.existsSync(CONFIG.outputFile)) {
    return newCollection;
  }

  try {
    const existing = JSON.parse(fs.readFileSync(CONFIG.outputFile, 'utf8'));

    // Preserve custom collection variables
    const existingVars = new Map(existing.variable?.map((v) => [v.key, v.value]) || []);

    newCollection.variable = newCollection.variable.map((v) => ({
      ...v,
      value: existingVars.get(v.key) || v.value,
    }));

    console.log('✅ Merged with existing collection variables');
    return newCollection;
  } catch (error) {
    console.warn('⚠️ Could not merge with existing collection:', error.message);
    return newCollection;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Swagger to Postman conversion...\n');

    console.log(`📥 Fetching Swagger JSON from: ${CONFIG.swaggerUrl}`);
    const swagger = await fetchSwaggerJson();
    console.log(`✅ Fetched Swagger (${Object.keys(swagger.paths).length} endpoints)\n`);

    console.log('🔄 Converting to Postman collection...');
    let collection = convertSwaggerToPostman(swagger);

    console.log('💾 Backing up existing collection...');
    backupCollection();

    console.log('🔗 Merging with existing data...');
    collection = mergeWithExisting(collection);

    console.log('💾 Saving new collection...');
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(collection, null, 2), 'utf8');

    console.log('\n✅ SUCCESS! Postman collection generated successfully!');
    console.log(`📁 Output: ${CONFIG.outputFile}`);
    console.log(`📦 Backup: ${CONFIG.backupFile}`);
    console.log(`\n📊 Statistics:`);
    console.log(`   - Total folders: ${collection.item.length}`);
    console.log(
      `   - Total requests: ${collection.item.reduce((sum, folder) => sum + folder.item.length, 0)}`,
    );
    console.log(`   - Collection variables: ${collection.variable.length}`);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure the NestJS server is running (npm run start:dev)');
    console.error('2. Verify Swagger is accessible at:', CONFIG.swaggerUrl);
    console.error('3. Check if the port is correct');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { convertSwaggerToPostman, fetchSwaggerJson };
