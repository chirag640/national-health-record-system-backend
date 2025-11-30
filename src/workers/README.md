# Queue Workers

This directory contains worker entry points for processing background jobs.

## Worker Modes

### 1. Single Process (Default)

All processors run within the main API application.

**Start:**

```bash
npm run start:dev
```

**Pros:**

- Simpler deployment
- Shared resources (database connections, cache)
- Good for small-medium scale

**Cons:**

- Heavy jobs can impact API performance
- Limited horizontal scaling

---

### 2. Dedicated Workers

Separate processes dedicated to queue processing.

**Start API:**

```bash
npm run start:prod
```

**Start Worker:**

```bash
npm run worker:start
```

**Or with PM2:**

```bash
pm2 start ecosystem.config.js
```

**Pros:**

- API remains responsive
- Scale workers independently
- Better fault isolation
- Can run on different machines

**Cons:**

- More complex deployment
- Need separate monitoring

---

## Worker Configuration

### Concurrency Settings (`.env`)

```bash
# How many jobs each processor handles simultaneously
QUEUE_NOTIFICATION_CONCURRENCY=5
QUEUE_DOCUMENT_CONCURRENCY=3
QUEUE_SYNC_CONCURRENCY=2
QUEUE_ANALYTICS_CONCURRENCY=1
QUEUE_CLEANUP_CONCURRENCY=1
```

### Rate Limiting

```bash
QUEUE_RATE_LIMIT_MAX=100          # Max jobs per duration
QUEUE_RATE_LIMIT_DURATION=60000   # Duration in ms (1 minute)
```

---

## PM2 Ecosystem

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'national-health-record-system-api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'national-health-record-system-worker',
      script: 'dist/workers/dedicated-worker.main.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

**Start all:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Docker Deployment

### docker-compose.yml

```yaml
services:
  api:
    build: .
    command: npm run start:prod
    ports:
      - '3000:3000'
    depends_on:
      - redis
      - mongodb

  worker:
    build: .
    command: npm run worker:start
    depends_on:
      - redis
      - mongodb
    deploy:
      replicas: 2 # Scale workers
```

---

## Monitoring

### BullBoard UI

Access at: `http://localhost:3000/admin/queues`

View:

- Active jobs
- Completed jobs
- Failed jobs
- Queue metrics
- Retry jobs manually

### Health Checks

```bash
# Check queue status
curl http://localhost:3000/health

# Check specific queue
curl http://localhost:3000/admin/queues/api/queues/notifications
```

---

## Best Practices

1. **Use Dedicated Workers for Production**
   - Better performance
   - Easier scaling
   - Fault isolation

2. **Monitor Queue Length**
   - Alert if queue grows too large
   - Indicates processing bottleneck

3. **Set Appropriate Concurrency**
   - Start low, increase gradually
   - Monitor CPU/memory usage

4. **Handle Failed Jobs**
   - Review dead letter queue regularly
   - Implement retry logic
   - Alert on persistent failures

5. **Graceful Shutdown**
   - Workers finish current jobs
   - No job loss on restart

---

## Scaling

### Horizontal Scaling

Run multiple worker processes:

```bash
# Different machines
worker-1: npm run worker:start
worker-2: npm run worker:start
worker-3: npm run worker:start
```

BullMQ automatically distributes jobs across all workers.

### Queue-Specific Workers

Create workers for specific queues:

```javascript
// notification-worker.ts
const app = await NestFactory.createApplicationContext(NotificationWorkerModule);
```

Deploy separately for fine-grained control.

---

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection
2. Verify queue names match
3. Check processor registration
4. Review logs for errors

### Jobs stuck in "waiting"

1. Check if workers are running
2. Verify concurrency settings
3. Check rate limits
4. Review processor errors

### High memory usage

1. Reduce concurrency
2. Implement job pagination
3. Clear completed jobs more frequently
4. Check for memory leaks in processors

---

## Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "worker:start": "node dist/workers/dedicated-worker.main.js",
    "worker:dev": "nodemon --watch src --exec 'ts-node' src/workers/dedicated-worker.main.ts",
    "worker:debug": "node --inspect=0.0.0.0:9230 dist/workers/dedicated-worker.main.js"
  }
}
```
