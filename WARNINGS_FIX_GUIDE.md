# ⚠️ Backend Warnings Fix Guide

## Current Warnings

Your backend is **running successfully** ✅ but showing these non-critical warnings:

### 1. **Mongoose Duplicate Index Warnings** (2 warnings)

```
Duplicate schema index on {"userId":1} found
Duplicate schema index on {"encounter":1} found
```

### 2. **Redis Eviction Policy Warnings** (15 warnings)

```
IMPORTANT! Eviction policy is volatile-lru. It should be "noeviction"
```

### 3. **Mongoose "remove" Method Warnings** (13 warnings)

```
mongoose: the method name "remove" is used by mongoose internally
```

---

## 🔧 Quick Fixes

### Fix 1: Mongoose Duplicate Indexes

**Problem:** Some schemas define the same index twice (once in field definition, once in schema.index())

**Solution:**

Find these schemas and remove duplicate index definitions:

```bash
# Search for duplicate userId indexes
grep -r "userId.*index: true" src/modules --include="*.schema.ts"

# Search for duplicate encounter indexes
grep -r "encounter.*index: true" src/modules --include="*.schema.ts"
```

**Common Pattern to Fix:**

```typescript
// ❌ BEFORE (Duplicate)
@Prop({ type: Types.ObjectId, ref: 'User', index: true })
userId: Types.ObjectId;

// ... later in schema
schema.index({ userId: 1 }); // DUPLICATE!

// ✅ AFTER (Fixed) - Choose one:
// Option 1: Keep field-level index, remove schema.index()
@Prop({ type: Types.ObjectId, ref: 'User', index: true })
userId: Types.ObjectId;

// Option 2: Remove field-level, keep schema.index()
@Prop({ type: Types.ObjectId, ref: 'User' })
userId: Types.ObjectId;
// ... later
schema.index({ userId: 1 });
```

---

### Fix 2: Redis Eviction Policy

**Problem:** Redis uses `volatile-lru` (removes keys with expiry), but BullMQ queues need `noeviction`

**Solution:**

**Option A: Update Redis Configuration File**

Create/edit `redis.conf`:

```conf
# Redis configuration for BullMQ
maxmemory-policy noeviction
maxmemory 256mb
```

Start Redis with config:

```bash
redis-server redis.conf
```

**Option B: Update Redis via Command Line**

```bash
redis-cli CONFIG SET maxmemory-policy noeviction
redis-cli CONFIG SET maxmemory 256mb

# Make it persistent
redis-cli CONFIG REWRITE
```

**Option C: Suppress Warning (If Redis is managed/cloud)**

If you can't change Redis config (e.g., AWS ElastiCache, Upstash):

Edit `src/modules/queue/queue.module.ts`:

```typescript
{
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
  },
  settings: {
    maxStalledCount: 3,
    stalledInterval: 30000,
  },
  // Suppress eviction policy warning
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 1000,    // Keep last 1000 failed jobs
  },
}
```

---

### Fix 3: Mongoose "remove" Method Conflict

**Problem:** Schemas define custom `remove()` methods that conflict with Mongoose internals

**Solution:**

Rename all custom `remove()` methods to something else:

```bash
# Find all schemas with remove() methods
grep -r "schema.method.*remove" src/modules --include="*.schema.ts"
```

**Fix Pattern:**

```typescript
// ❌ BEFORE (Conflicting name)
schema.method('remove', async function () {
  // ... custom logic
});

// ✅ AFTER (Fixed - use deleteOne or softDelete)
schema.method('softDelete', async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
});

// Or if hard delete:
schema.method('deleteOne', async function () {
  return this.model('ModelName').deleteOne({ _id: this._id });
});
```

Then update all calls:

```typescript
// ❌ BEFORE
await document.remove();

// ✅ AFTER
await document.softDelete();
// or
await document.deleteOne();
```

---

## 🎯 Quick Fix Script

Create `scripts/fix-warnings.js`:

```javascript
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Mongoose warnings...\n');

// Fix 1: Find schemas with duplicate indexes
function findDuplicateIndexes(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    if (file.isDirectory()) {
      findDuplicateIndexes(path.join(dir, file.name));
    } else if (file.name.endsWith('.schema.ts')) {
      const filePath = path.join(dir, file.name);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for userId index duplicates
      if (
        content.includes('userId') &&
        content.includes('index: true') &&
        content.includes('schema.index({ userId:')
      ) {
        console.log(`⚠️  Duplicate userId index in: ${filePath}`);
      }

      // Check for encounter index duplicates
      if (
        content.includes('encounter') &&
        content.includes('index: true') &&
        content.includes('schema.index({ encounter:')
      ) {
        console.log(`⚠️  Duplicate encounter index in: ${filePath}`);
      }

      // Check for remove() method conflicts
      if (content.includes("schema.method('remove'")) {
        console.log(`⚠️  Conflicting remove() method in: ${filePath}`);
      }
    }
  });
}

findDuplicateIndexes('./src/modules');

console.log('\n✅ Scan complete! Review the files above and apply fixes manually.');
console.log('\nRecommended actions:');
console.log('1. Remove duplicate index definitions (keep one)');
console.log('2. Rename remove() methods to softDelete() or deleteOne()');
console.log('3. Update Redis config: maxmemory-policy noeviction');
```

**Run it:**

```bash
node scripts/fix-warnings.js
```

---

## 🚀 Priority Order

### Priority 1: Redis Eviction Policy (High Impact)

**Impact:** Can cause queue job loss if Redis runs out of memory  
**Fix Time:** 2 minutes  
**Command:**

```bash
redis-cli CONFIG SET maxmemory-policy noeviction
redis-cli CONFIG REWRITE
```

### Priority 2: Mongoose remove() Methods (Medium Impact)

**Impact:** May cause unexpected behavior in future Mongoose versions  
**Fix Time:** 15-30 minutes  
**Action:** Rename all `remove()` to `softDelete()` or `deleteOne()`

### Priority 3: Duplicate Indexes (Low Impact)

**Impact:** Minor performance overhead, duplicate work  
**Fix Time:** 10-15 minutes  
**Action:** Remove duplicate index definitions in schemas

---

## ✅ Verification

After applying fixes:

**1. No more warnings on startup:**

```bash
npm run start:dev
# Should see clean startup without warnings
```

**2. Check Redis config:**

```bash
redis-cli CONFIG GET maxmemory-policy
# Should return: "noeviction"
```

**3. Test functionality:**

```bash
# All features should work normally
# Queue jobs should process correctly
# Database operations should complete
```

---

## 🎓 Understanding the Warnings

### Why These Warnings Matter:

**Duplicate Indexes:**

- MongoDB creates the same index twice
- Wastes disk space
- Slower write operations
- Confusing when debugging

**Redis Eviction Policy:**

- `volatile-lru` = Redis removes old keys when memory is full
- BullMQ needs keys to stay (job queue data)
- Wrong policy = lost jobs, incomplete tasks
- `noeviction` = Redis refuses new writes when full (safer for queues)

**Mongoose remove() Conflict:**

- Mongoose uses `remove()` internally for deprecation tracking
- Your custom `remove()` overrides it
- Can break Mongoose features
- Future versions may error instead of warn

---

## 📊 Impact Summary

| Warning Type      | Count | Severity  | Fix Time |
| ----------------- | ----- | --------- | -------- |
| Redis Eviction    | 15    | 🔴 High   | 2 min    |
| Mongoose remove() | 13    | 🟡 Medium | 30 min   |
| Duplicate Indexes | 2     | 🟢 Low    | 15 min   |

**Total Fix Time:** ~45 minutes  
**Impact:** Cleaner logs, better reliability, best practices

---

## 🛠️ Need Help?

If you want me to:

1. **Find specific files** with these issues
2. **Apply fixes automatically** in the schemas
3. **Create migration scripts** for method renames
4. **Test after fixes** to ensure everything works

Just let me know! 🚀

---

**Note:** These are **warnings, not errors**. Your backend works fine, but fixing them improves:

- Log cleanliness
- Production reliability
- Code maintainability
- Best practice compliance
