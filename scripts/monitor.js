const fs = require('fs');
const path = require('path');

/**
 * Simple System Monitoring Script
 * Run this periodically (every hour) to check system health
 *
 * Usage: node scripts/monitor.js
 */

const LOGS_DIR = path.join(__dirname, '../logs');
const ERROR_THRESHOLD = 5; // Alert if error rate > 5%
const RESPONSE_TIME_THRESHOLD = 1000; // Alert if avg response time > 1000ms

function readLatestLog() {
  try {
    const logFile = path.join(LOGS_DIR, 'application.log');
    if (!fs.existsSync(logFile)) {
      console.log('⚠️  No log file found. Application may not be running.');
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    // Parse JSON logs
    const logs = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter logs from last hour
    const oneHourAgo = Date.now() - 3600000;
    return logs.filter((log) => {
      const timestamp = new Date(log.timestamp || log.time).getTime();
      return timestamp > oneHourAgo;
    });
  } catch (error) {
    console.error('Error reading logs:', error.message);
    return [];
  }
}

function calculateMetrics(logs) {
  const metrics = {
    totalRequests: 0,
    errorCount: 0,
    errorRate: 0,
    avgResponseTime: 0,
    slowQueries: 0,
    responseTimes: [],
    topErrors: {},
    endpoints: {},
  };

  logs.forEach((log) => {
    // Count total requests
    if (log.method && log.url) {
      metrics.totalRequests++;

      // Track endpoint usage
      const endpoint = `${log.method} ${log.url}`;
      metrics.endpoints[endpoint] = (metrics.endpoints[endpoint] || 0) + 1;
    }

    // Count errors
    if (log.level === 'error' || log.statusCode >= 400) {
      metrics.errorCount++;

      // Track error types
      const errorType = log.message || 'Unknown Error';
      metrics.topErrors[errorType] = (metrics.topErrors[errorType] || 0) + 1;
    }

    // Track response times
    if (log.responseTime || log.executionTime) {
      const responseTime = log.responseTime || log.executionTime;
      metrics.responseTimes.push(responseTime);

      if (responseTime > 500) {
        metrics.slowQueries++;
      }
    }
  });

  // Calculate averages
  if (metrics.totalRequests > 0) {
    metrics.errorRate = ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(2);
  }

  if (metrics.responseTimes.length > 0) {
    const sum = metrics.responseTimes.reduce((a, b) => a + b, 0);
    metrics.avgResponseTime = (sum / metrics.responseTimes.length).toFixed(2);
  }

  return metrics;
}

function printDashboard(metrics) {
  console.log('\n' + '='.repeat(60));
  console.log('📊  NATIONAL HEALTH RECORD SYSTEM - MONITORING DASHBOARD');
  console.log('='.repeat(60));
  console.log(`📅 Report Time: ${new Date().toLocaleString()}`);
  console.log(`⏱️  Time Range: Last 1 hour`);
  console.log('='.repeat(60));

  console.log('\n🔢 REQUEST METRICS');
  console.log('─'.repeat(60));
  console.log(`Total Requests:       ${metrics.totalRequests}`);
  console.log(`Error Count:          ${metrics.errorCount}`);
  console.log(`Error Rate:           ${metrics.errorRate}%`);
  console.log(`Avg Response Time:    ${metrics.avgResponseTime}ms`);
  console.log(`Slow Queries (>500ms): ${metrics.slowQueries}`);

  // Top endpoints
  if (Object.keys(metrics.endpoints).length > 0) {
    console.log('\n📍 TOP 5 ENDPOINTS');
    console.log('─'.repeat(60));
    const sortedEndpoints = Object.entries(metrics.endpoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    sortedEndpoints.forEach(([endpoint, count], index) => {
      console.log(`${index + 1}. ${endpoint.padEnd(40)} ${count} requests`);
    });
  }

  // Top errors
  if (Object.keys(metrics.topErrors).length > 0) {
    console.log('\n⚠️  TOP ERRORS');
    console.log('─'.repeat(60));
    const sortedErrors = Object.entries(metrics.topErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    sortedErrors.forEach(([error, count], index) => {
      const truncated = error.length > 50 ? error.substring(0, 47) + '...' : error;
      console.log(`${index + 1}. ${truncated.padEnd(50)} ${count}x`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

function checkAlerts(metrics) {
  const alerts = [];

  // High error rate alert
  if (parseFloat(metrics.errorRate) > ERROR_THRESHOLD) {
    alerts.push({
      level: 'CRITICAL',
      message: `High error rate detected: ${metrics.errorRate}% (threshold: ${ERROR_THRESHOLD}%)`,
      action: 'Check error.log for details and investigate root cause',
    });
  }

  // Slow response time alert
  if (parseFloat(metrics.avgResponseTime) > RESPONSE_TIME_THRESHOLD) {
    alerts.push({
      level: 'WARNING',
      message: `Slow average response time: ${metrics.avgResponseTime}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)`,
      action: 'Check database indexes and optimize slow queries',
    });
  }

  // High slow query count
  if (metrics.slowQueries > 10) {
    alerts.push({
      level: 'WARNING',
      message: `High number of slow queries: ${metrics.slowQueries} queries > 500ms`,
      action: 'Review database query performance and add indexes',
    });
  }

  // No requests (possible downtime)
  if (metrics.totalRequests === 0) {
    alerts.push({
      level: 'CRITICAL',
      message: 'No requests in the last hour - possible system downtime',
      action: 'Check if application is running and accessible',
    });
  }

  if (alerts.length > 0) {
    console.log('\n🚨 ALERTS');
    console.log('='.repeat(60));
    alerts.forEach((alert) => {
      console.log(`\n[${alert.level}] ${alert.message}`);
      console.log(`→ Action: ${alert.action}`);
    });
    console.log('\n' + '='.repeat(60));
    return true;
  }

  console.log('\n✅ All systems healthy - no alerts triggered');
  console.log('='.repeat(60));
  return false;
}

function main() {
  console.clear();

  const logs = readLatestLog();

  if (logs.length === 0) {
    console.log('\n⚠️  No logs found in the last hour.');
    console.log('This could mean:');
    console.log('  - Application is not running');
    console.log('  - No requests received in last hour');
    console.log('  - Logging is not properly configured');
    return;
  }

  const metrics = calculateMetrics(logs);
  printDashboard(metrics);
  const hasAlerts = checkAlerts(metrics);

  // Exit with error code if alerts detected (useful for CI/CD)
  if (hasAlerts) {
    process.exit(1);
  }
}

// Run monitoring
main();
