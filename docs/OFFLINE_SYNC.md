# Offline Sync System Documentation

## Overview

The offline sync system enables healthcare workers in rural areas with unstable internet to continue working offline. All operations are queued locally and automatically synced when connection is restored.

## Architecture

### Client-Side (Frontend)

1. **Local Storage**: IndexedDB or SQLCipher for encrypted offline data
2. **Sync Queue**: Track pending operations (CREATE, UPDATE, DELETE)
3. **Version Control**: Track data versions for conflict detection
4. **Background Sync**: Automatic sync when connection restored

### Server-Side (Backend)

1. **Sync Queue Schema**: MongoDB collection tracking sync operations
2. **Conflict Resolution**: Version-based conflict detection
3. **Retry Logic**: Automatic retry with exponential backoff
4. **Audit Trail**: All sync operations logged

## API Endpoints

### 1. Queue Operation (Offline)

```http
POST /api/v1/sync/queue
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "deviceId": "device-123-abc-456",
  "operation": "CREATE",
  "resourceType": "encounter",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "diagnosis": "Common cold",
    "prescription": "Rest and fluids"
  },
  "createdAtClient": "2025-11-30T10:00:00.000Z",
  "version": 1
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439030",
  "status": "PENDING",
  "message": "Operation queued for sync"
}
```

### 2. Get Pending Sync Items

```http
GET /api/v1/sync/pending?deviceId=device-123&userId=507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": "507f1f77bcf86cd799439030",
    "operation": "CREATE",
    "resourceType": "encounter",
    "data": {...},
    "status": "PENDING",
    "retryCount": 0,
    "createdAtClient": "2025-11-30T10:00:00.000Z"
  }
]
```

### 3. Process Sync Queue

```http
POST /api/v1/sync/process/507f1f77bcf86cd799439030
Authorization: Bearer <token>
```

**Success Response:**

```json
{
  "status": "SYNCED",
  "message": "Operation synced successfully",
  "result": {
    "id": "507f1f77bcf86cd799439040",
    ...
  }
}
```

**Conflict Response:**

```json
{
  "status": "CONFLICT",
  "message": "Version conflict detected",
  "error": "Resource was modified on server",
  "resolutionOptions": ["CLIENT_WINS", "SERVER_WINS", "MANUAL"]
}
```

### 4. Resolve Conflict

```http
PATCH /api/v1/sync/resolve/507f1f77bcf86cd799439030?resolution=SERVER_WINS
Authorization: Bearer <token>
```

**Resolution Strategies:**

- **CLIENT_WINS**: Use offline data, overwrite server
- **SERVER_WINS**: Discard offline data, keep server version
- **MANUAL**: Flag for manual review by admin

### 5. Retry Failed Operations

```http
POST /api/v1/sync/retry?deviceId=device-123&userId=507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

### 6. Get Sync Statistics

```http
GET /api/v1/sync/stats?userId=507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "total": 150,
  "pending": 5,
  "synced": 140,
  "failed": 3,
  "conflicts": 2,
  "syncRate": "93.33%"
}
```

## Client Implementation Guide

### React/React Native Example

```typescript
// sync-manager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncOperation {
  id: string;
  userId: string;
  deviceId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId?: string;
  data: any;
  createdAtClient: Date;
  version: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
}

class SyncManager {
  private syncQueue: SyncOperation[] = [];
  private syncInterval: NodeJS.Timer | null = null;
  private isOnline: boolean = true;

  async initialize() {
    // Load queued operations from local storage
    const stored = await AsyncStorage.getItem('syncQueue');
    if (stored) {
      this.syncQueue = JSON.parse(stored);
    }

    // Monitor connectivity
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected || false;
      if (this.isOnline) {
        this.startSync();
      }
    });

    // Auto-sync every 5 minutes if online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncAll();
      }
    }, 300000);
  }

  async queueOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: string,
    data: any,
    resourceId?: string,
  ) {
    const syncOp: SyncOperation = {
      id: generateUUID(),
      userId: getCurrentUserId(),
      deviceId: await getDeviceId(),
      operation,
      resourceType,
      resourceId,
      data,
      createdAtClient: new Date(),
      version: 1,
      status: 'PENDING',
    };

    this.syncQueue.push(syncOp);
    await this.saveQueue();

    // Try immediate sync if online
    if (this.isOnline) {
      await this.syncOperation(syncOp);
    }

    return syncOp.id;
  }

  async syncAll() {
    const pending = this.syncQueue.filter(
      (op) => op.status === 'PENDING' || op.status === 'FAILED',
    );

    for (const operation of pending) {
      await this.syncOperation(operation);
    }
  }

  private async syncOperation(operation: SyncOperation) {
    try {
      operation.status = 'SYNCING';
      await this.saveQueue();

      // Step 1: Queue on server
      const queueResponse = await fetch('/api/v1/sync/queue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: operation.userId,
          deviceId: operation.deviceId,
          operation: operation.operation,
          resourceType: operation.resourceType,
          resourceId: operation.resourceId,
          data: operation.data,
          createdAtClient: operation.createdAtClient,
          version: operation.version,
        }),
      });

      const queueResult = await queueResponse.json();

      // Step 2: Process sync
      const processResponse = await fetch(`/api/v1/sync/process/${queueResult.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const processResult = await processResponse.json();

      if (processResult.status === 'SYNCED') {
        operation.status = 'SYNCED';
        await this.removeFromQueue(operation.id);
      } else if (processResult.status === 'CONFLICT') {
        // Handle conflict
        await this.handleConflict(operation, processResult);
      }
    } catch (error) {
      operation.status = 'FAILED';
      await this.saveQueue();
      console.error('Sync failed:', error);
    }
  }

  private async handleConflict(operation: SyncOperation, conflictInfo: any) {
    // Show user conflict resolution dialog
    const resolution = await showConflictDialog({
      localData: operation.data,
      conflictInfo,
    });

    if (resolution) {
      await fetch(`/api/v1/sync/resolve/${operation.id}?resolution=${resolution}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (resolution === 'SERVER_WINS') {
        operation.status = 'SYNCED';
        await this.removeFromQueue(operation.id);
      }
    }
  }

  private async saveQueue() {
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  private async removeFromQueue(id: string) {
    this.syncQueue = this.syncQueue.filter((op) => op.id !== id);
    await this.saveQueue();
  }

  getSyncStatus() {
    const pending = this.syncQueue.filter((op) => op.status === 'PENDING').length;
    const failed = this.syncQueue.filter((op) => op.status === 'FAILED').length;
    return { total: this.syncQueue.length, pending, failed };
  }
}

export const syncManager = new SyncManager();
```

### Usage in App

```typescript
// When creating an encounter offline
async function createEncounterOffline(encounterData) {
  // Save to local database first
  const localId = await localDB.encounters.add(encounterData);

  // Queue for sync
  await syncManager.queueOperation(
    'CREATE',
    'encounter',
    encounterData,
    undefined // no resourceId for CREATE
  );

  return localId;
}

// When updating patient info offline
async function updatePatientOffline(patientId, updates) {
  // Update local database
  await localDB.patients.update(patientId, updates);

  // Queue for sync
  await syncManager.queueOperation(
    'UPDATE',
    'patient',
    updates,
    patientId
  );
}

// Display sync status in UI
function SyncStatusBadge() {
  const [status, setStatus] = useState(syncManager.getSyncStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(syncManager.getSyncStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (status.pending === 0 && status.failed === 0) {
    return <Badge color="success">All synced ✓</Badge>;
  }

  return (
    <Badge color="warning">
      Pending: {status.pending}, Failed: {status.failed}
    </Badge>
  );
}
```

## Conflict Resolution Strategies

### 1. Last-Write-Wins (Simple)

- Server timestamp determines winner
- Easy to implement, may lose data
- Good for non-critical fields

### 2. Client-Wins (Emergency)

- Offline data takes precedence
- Use for emergency situations
- Requires admin approval

### 3. Server-Wins (Safe)

- Server data always wins
- Discard offline changes
- Safest option, may frustrate users

### 4. Manual Review (Complex)

- Flag for human review
- Admin compares both versions
- Merges manually
- Best for critical data

## Testing Offline Sync

### 1. Simulate Offline Mode

```typescript
// Disable network in DevTools
// Or use library like MSW to intercept requests
```

### 2. Create Test Operations

```bash
# Create encounter offline
curl -X POST http://localhost:3000/api/v1/sync/queue \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "deviceId": "test-device-1",
    "operation": "CREATE",
    "resourceType": "encounter",
    "data": {...},
    "createdAtClient": "2025-11-30T10:00:00.000Z"
  }'
```

### 3. Check Pending Sync

```bash
curl -X GET "http://localhost:3000/api/v1/sync/pending?deviceId=test-device-1&userId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Process Sync

```bash
curl -X POST http://localhost:3000/api/v1/sync/process/SYNC_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Conflict

```bash
# Create same resource on server
# Then try to sync offline version
# Should return CONFLICT status
```

## Monitoring Sync Health

### MongoDB Queries

```javascript
// Count pending operations by user
db.syncqueues.aggregate([
  { $match: { status: 'PENDING' } },
  { $group: { _id: '$userId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

// Find devices with high failure rate
db.syncqueues.aggregate([
  {
    $group: {
      _id: '$deviceId',
      total: { $sum: 1 },
      failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
    },
  },
  {
    $project: {
      deviceId: '$_id',
      failureRate: { $multiply: [{ $divide: ['$failed', '$total'] }, 100] },
    },
  },
  { $match: { failureRate: { $gt: 10 } } },
]);

// Operations taking longest to sync
db.syncqueues
  .find({
    status: 'SYNCED',
    syncedAt: { $exists: true },
  })
  .forEach((doc) => {
    const delay = doc.syncedAt - doc.createdAtClient;
    print(doc._id + ': ' + delay + 'ms');
  });
```

## Performance Optimization

### 1. Batch Sync

- Process multiple operations in single request
- Reduce HTTP overhead
- Faster sync completion

### 2. Delta Sync

- Only sync changed fields
- Reduce payload size
- Faster network transfer

### 3. Compression

- Compress large payloads
- Use gzip for JSON data
- Saves bandwidth

### 4. Background Sync

- Use service workers (PWA)
- Sync during idle time
- Don't block UI

## Security Considerations

### 1. Encrypted Local Storage

```typescript
// Use SQLCipher for encrypted SQLite
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'health_records.db',
  location: 'default',
  createFromLocation: 1,
  key: getUserEncryptionKey(), // AES-256
});
```

### 2. Secure Sync Token

```typescript
// Rotate tokens during sync
const syncToken = await refreshAuthToken();
```

### 3. Audit Trail

- Log all sync operations
- Track device IDs
- Monitor for suspicious patterns

## Troubleshooting

**Q: Operations stuck in PENDING**

- Check network connectivity
- Verify auth token validity
- Check server logs for errors
- Retry failed operations manually

**Q: High conflict rate**

- Multiple devices editing same data
- Implement pessimistic locking
- Use field-level conflict resolution

**Q: Slow sync performance**

- Reduce batch size
- Enable compression
- Check network speed
- Optimize payload size

**Q: Data loss after sync**

- Check conflict resolution strategy
- Review audit logs
- Restore from backup if needed

## Production Checklist

- [ ] Client-side encryption enabled
- [ ] Background sync configured
- [ ] Conflict resolution strategy defined
- [ ] Retry logic with exponential backoff
- [ ] Monitoring dashboard set up
- [ ] Alert thresholds configured
- [ ] User training on offline mode
- [ ] Backup strategy for sync queue
- [ ] Network optimization tested
- [ ] Stress testing completed
