# Monitoring and Alerting Setup Guide

## Overview

This guide covers production monitoring setup for the National Health Record System using Winston logging, custom metrics, and optional ELK stack or CloudWatch integration.

## Built-in Monitoring

### 1. Health Check Endpoint

```bash
GET /health
```

Returns:

- Database connectivity status
- Memory usage (heap and RSS)
- Overall system health

### 2. Pino Logger

Structured JSON logging with PII sanitization:

- Request/response logging
- Error tracking
- Performance metrics
- Audit trail

### 3. Audit Logging

All authenticated requests logged to MongoDB:

- User ID and action
- Resource and resource ID
- IP address and user agent
- Request body (sanitized)
- Execution time
- Timestamp

## Metrics Tracking

### Key Performance Indicators (KPIs)

1. **API Response Time**
   - Average: < 200ms
   - 95th percentile: < 500ms
   - 99th percentile: < 1000ms

2. **Error Rate**
   - Target: < 1%
   - Alert threshold: > 5%

3. **Uptime**
   - Target: 99.9%
   - Monthly downtime budget: 43 minutes

4. **Database Queries**
   - Average query time: < 50ms
   - Slow query threshold: > 500ms

### Custom Metrics Service

Create `src/modules/metrics/metrics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MetricsService {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    responseTimeSum: 0,
    slowQueries: 0,
  };

  recordRequest(responseTime: number, isError: boolean) {
    this.metrics.requestCount++;
    this.metrics.responseTimeSum += responseTime;
    if (isError) this.metrics.errorCount++;
    if (responseTime > 500) this.metrics.slowQueries++;
  }

  getMetrics() {
    const avgResponseTime =
      this.metrics.requestCount > 0 ? this.metrics.responseTimeSum / this.metrics.requestCount : 0;

    const errorRate =
      this.metrics.requestCount > 0
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100
        : 0;

    return {
      totalRequests: this.metrics.requestCount,
      totalErrors: this.metrics.errorCount,
      errorRate: errorRate.toFixed(2) + '%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      slowQueries: this.metrics.slowQueries,
    };
  }

  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimeSum: 0,
      slowQueries: 0,
    };
  }
}
```

Add metrics endpoint:

```typescript
@Get('/metrics')
@ApiOperation({ summary: 'Get system metrics' })
@Roles(UserRole.SUPER_ADMIN)
getMetrics() {
  return this.metricsService.getMetrics();
}
```

## Option 1: ELK Stack (Self-Hosted)

### Installation

#### 1. Install Elasticsearch

```bash
# Windows
choco install elasticsearch

# Start Elasticsearch
elasticsearch
```

#### 2. Install Logstash

```bash
# Windows
choco install logstash

# Start Logstash
logstash -f logstash.conf
```

#### 3. Install Kibana

```bash
# Windows
choco install kibana

# Start Kibana
kibana
```

### Logstash Configuration

Create `logstash.conf`:

```conf
input {
  file {
    path => "D:/Projects/FlutterProjects/my/helthCareRecordSystem/national-health-record-system/logs/*.log"
    start_position => "beginning"
    codec => json
  }
}

filter {
  json {
    source => "message"
  }

  # Add custom fields
  mutate {
    add_field => { "service" => "national-health-record-system" }
  }

  # Parse timestamps
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "health-records-%{+YYYY.MM.dd}"
  }

  # Also output to stdout for debugging
  stdout {
    codec => rubydebug
  }
}
```

### Kibana Dashboards

1. **System Overview**
   - Total requests per hour
   - Error rate trend
   - Average response time
   - Top 5 slowest endpoints

2. **Security Dashboard**
   - Failed login attempts
   - Unauthorized access attempts
   - Emergency consent overrides
   - Patient data access patterns

3. **Performance Dashboard**
   - API response time distribution
   - Database query performance
   - Memory and CPU usage
   - Active connections

4. **Audit Dashboard**
   - User activity timeline
   - Data access by role
   - CRUD operations by resource
   - Compliance report

### Alerts Configuration

Create alerts in Kibana:

1. **High Error Rate Alert**
   - Condition: Error rate > 5% in last 5 minutes
   - Action: Send email to ops team
   - Priority: High

2. **Slow Response Time Alert**
   - Condition: Average response time > 1000ms
   - Action: Send Slack notification
   - Priority: Medium

3. **Emergency Consent Alert**
   - Condition: Emergency consent override created
   - Action: Send SMS to compliance officer
   - Priority: Critical

4. **Failed Authentication Alert**
   - Condition: > 10 failed logins from same IP
   - Action: Block IP temporarily
   - Priority: High

## Option 2: AWS CloudWatch

### Setup

#### 1. Install CloudWatch Agent

```bash
npm install @aws-sdk/client-cloudwatch-logs
```

#### 2. Configure AWS Credentials

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### 3. Create CloudWatch Service

`src/common/cloudwatch.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

@Injectable()
export class CloudWatchService {
  private client: CloudWatchLogsClient;
  private logGroupName = 'national-health-record-system';
  private logStreamName = `instance-${Date.now()}`;

  constructor() {
    this.client = new CloudWatchLogsClient({
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  async logEvent(message: string, level: string, metadata?: any) {
    const command = new PutLogEventsCommand({
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      logEvents: [
        {
          message: JSON.stringify({ message, level, metadata, timestamp: Date.now() }),
          timestamp: Date.now(),
        },
      ],
    });

    await this.client.send(command);
  }
}
```

#### 4. Create CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorRate \
  --namespace HealthRecordSystem \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Slow response time alarm
aws cloudwatch put-metric-alarm \
  --alarm-name slow-response-time \
  --alarm-description "Alert when response time exceeds 1000ms" \
  --metric-name ResponseTime \
  --namespace HealthRecordSystem \
  --statistic Average \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### CloudWatch Dashboard

Create custom dashboard JSON:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["HealthRecordSystem", "RequestCount"],
          [".", "ErrorCount"],
          [".", "ResponseTime"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-south-1",
        "title": "API Metrics"
      }
    }
  ]
}
```

## Option 3: Simple File-Based Monitoring (Zero Cost)

### Winston File Logger

Already configured in the project. Logs stored in `logs/` directory:

- `logs/application.log` - All logs
- `logs/error.log` - Error logs only
- `logs/audit.log` - Audit trail

### Log Rotation

Add rotation with `winston-daily-rotate-file`:

```bash
npm install winston-daily-rotate-file
```

Update logger configuration:

```typescript
import DailyRotateFile from 'winston-daily-rotate-file';

const transport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
});
```

### Simple Monitoring Script

Create `scripts/monitor.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Read latest log file
const logsDir = path.join(__dirname, '../logs');
const latestLog = fs.readFileSync(path.join(logsDir, 'application.log'), 'utf8');

// Parse logs
const lines = latestLog.split('\n').filter(Boolean);
const logs = lines
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

// Calculate metrics
const errorCount = logs.filter((log) => log.level === 'error').length;
const totalCount = logs.length;
const errorRate = ((errorCount / totalCount) * 100).toFixed(2);

const responseTimes = logs.filter((log) => log.responseTime).map((log) => log.responseTime);
const avgResponseTime =
  responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
    : 0;

console.log('📊 System Metrics (Last hour)');
console.log('─'.repeat(40));
console.log(`Total Requests: ${totalCount}`);
console.log(`Error Count: ${errorCount}`);
console.log(`Error Rate: ${errorRate}%`);
console.log(`Avg Response Time: ${avgResponseTime}ms`);
console.log('─'.repeat(40));

// Alert if error rate is high
if (parseFloat(errorRate) > 5) {
  console.error('🚨 HIGH ERROR RATE DETECTED!');
  console.error('Action required: Check error.log for details');
}
```

Run periodically:

```bash
# Windows Task Scheduler (every hour)
node scripts/monitor.js
```

## Alerting Options

### 1. Email Alerts (Free with Gmail)

```typescript
async sendAlert(subject: string, message: string) {
  await this.emailService.sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `[ALERT] ${subject}`,
    html: `<h2>Alert Triggered</h2><p>${message}</p>`,
  });
}
```

### 2. Slack Webhooks (Free)

```bash
npm install @slack/webhook
```

```typescript
import { IncomingWebhook } from '@slack/webhook';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

async sendSlackAlert(message: string) {
  await webhook.send({
    text: `🚨 Alert: ${message}`,
  });
}
```

### 3. SMS Alerts (with Twilio)

```bash
npm install twilio
```

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async sendSMSAlert(message: string) {
  await client.messages.create({
    body: message,
    to: process.env.ADMIN_PHONE,
    from: process.env.TWILIO_PHONE,
  });
}
```

## Production Checklist

- [ ] Health check endpoint responding
- [ ] Pino logger configured with proper levels
- [ ] Audit logging enabled and writing to MongoDB
- [ ] Log rotation configured (30-day retention)
- [ ] Error tracking with stack traces
- [ ] Performance metrics collection
- [ ] Alert rules configured
- [ ] Admin notification emails set
- [ ] Monitoring dashboard accessible
- [ ] Backup monitoring in place
- [ ] Database slow query logging enabled
- [ ] Memory leak detection active
- [ ] Rate limiting monitored
- [ ] Security events tracked

## Monitoring Queries

### MongoDB Audit Query Examples

```javascript
// Get failed login attempts in last hour
db.auditLogs
  .find({
    action: 'LOGIN_FAILED',
    timestamp: { $gte: new Date(Date.now() - 3600000) },
  })
  .count();

// Get emergency overrides today
db.auditLogs.find({
  action: 'CREATE_EMERGENCY_CONSENT',
  timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
});

// Get most active users
db.auditLogs.aggregate([
  { $group: { _id: '$userId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);

// Get slowest API endpoints
db.auditLogs.aggregate([
  {
    $group: {
      _id: '$action',
      avgTime: { $avg: '$executionTime' },
      count: { $sum: 1 },
    },
  },
  { $sort: { avgTime: -1 } },
  { $limit: 10 },
]);
```

## Maintenance

### Daily Tasks

- Check error logs for anomalies
- Review failed login attempts
- Monitor disk space usage
- Verify backup completion

### Weekly Tasks

- Review performance metrics trends
- Analyze slow query reports
- Check emergency override justifications
- Update alert thresholds if needed

### Monthly Tasks

- Generate compliance report from audit logs
- Archive old logs (>30 days)
- Review and optimize slow endpoints
- Capacity planning based on growth trends

## Cost Comparison

| Solution                        | Monthly Cost (Approx)           |
| ------------------------------- | ------------------------------- |
| **File-based + Email**          | ₹0 (Free)                       |
| **CloudWatch**                  | ₹500-2000 (based on log volume) |
| **Self-hosted ELK**             | ₹0 (compute cost only)          |
| **Managed ELK (Elastic Cloud)** | ₹3000-10000                     |
| **Datadog**                     | ₹5000-15000                     |
| **New Relic**                   | ₹4000-12000                     |

**Recommendation for MVP:** Start with file-based monitoring + email alerts (free), upgrade to CloudWatch or ELK when scaling.
