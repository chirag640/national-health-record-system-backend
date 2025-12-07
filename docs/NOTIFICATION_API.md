# Notification System API Documentation

Comprehensive multi-channel notification system with user preferences, smart delivery, and delivery tracking.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [API Endpoints](#api-endpoints)
  - [Notification Management](#notification-management)
  - [User Preferences](#user-preferences)
  - [Admin Operations](#admin-operations)
- [Data Models](#data-models)
- [Notification Types](#notification-types)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The Notification System provides a robust, scalable solution for delivering notifications across multiple channels (in-app, email, SMS, push) with comprehensive user preference management and delivery tracking.

### Key Capabilities

- **34 Notification Types** covering appointments, prescriptions, lab results, consents, and system alerts
- **5 Delivery Channels**: In-app, Email, SMS, Push Notifications, Webhooks
- **Smart Delivery**: User preferences, quiet hours, scheduled sending, auto-expiry
- **Rich Content**: Interactive action buttons, deep links, images, grouping
- **Tracking & Analytics**: Per-channel delivery status, retry mechanism, statistics

---

## Features

### ✅ Multi-Channel Delivery

- **In-App** - Stored in database, real-time updates
- **Email** - Integrated with EmailService
- **SMS** - Ready for Twilio/AWS SNS integration
- **Push** - FCM/APNs ready with device token management
- **Webhook** - Custom callback support

### ✅ User Preferences

- Master notification toggle
- Per-type and per-channel preferences
- Quiet hours with exclusions
- Notification grouping and digest mode
- Language and timezone support

### ✅ Smart Delivery

- Respects user quiet hours
- Scheduled notifications
- Auto-expiry with cleanup
- Retry mechanism for failed deliveries
- Delivery result tracking per channel

### ✅ Rich Notifications

- Interactive action buttons
- Deep links for mobile apps
- Web links for desktop
- Images and icons
- Related entity references

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1/notifications`

All endpoints require authentication via JWT Bearer token.

### Notification Management

#### 1. Create Notification

```http
POST /api/v1/notifications
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "type": "prescription_expiring",
  "priority": "high",
  "recipientId": "507f1f77bcf86cd799439011",
  "recipientEmail": "user@example.com",
  "recipientPhone": "+919876543210",
  "title": "Prescription Expiring Soon",
  "message": "Your prescription for Amoxicillin will expire in 3 days. Please renew it.",
  "shortMessage": "Prescription expiring in 3 days",
  "channels": ["in_app", "email", "sms"],
  "category": "prescriptions",
  "relatedEntityId": "507f1f77bcf86cd799439012",
  "relatedEntityModel": "Prescription",
  "relatedEntityData": {
    "prescriptionNumber": "RX-2024-000123",
    "medicationName": "Amoxicillin"
  },
  "actions": [
    {
      "label": "Renew Now",
      "action": "renew_prescription",
      "data": { "prescriptionId": "507f1f77bcf86cd799439012" },
      "style": "primary"
    }
  ],
  "deepLink": "healthapp://prescription/123",
  "webLink": "https://app.example.com/prescriptions/123",
  "scheduledFor": "2024-12-08T10:00:00Z",
  "expiresAt": "2024-12-15T10:00:00Z"
}
```

**Response:** `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "type": "prescription_expiring",
  "priority": "high",
  "status": "sent",
  "recipientId": "507f1f77bcf86cd799439011",
  "title": "Prescription Expiring Soon",
  "message": "Your prescription for Amoxicillin will expire in 3 days.",
  "channels": ["in_app", "email", "sms"],
  "deliveryResults": [
    {
      "channel": "email",
      "status": "success",
      "sentAt": "2024-12-07T14:30:00Z"
    }
  ],
  "createdAt": "2024-12-07T14:30:00Z",
  "isExpired": false,
  "isRead": false
}
```

**Access:** Doctor, Hospital Admin, Super Admin

---

#### 2. Create Bulk Notifications

```http
POST /api/v1/notifications/bulk
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "recipientIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "type": "system_maintenance",
  "priority": "normal",
  "title": "Scheduled Maintenance",
  "message": "System will be under maintenance from 2 AM to 4 AM on Sunday.",
  "channels": ["in_app", "email"],
  "category": "system"
}
```

**Response:** `201 Created`

```json
{
  "created": 2,
  "failed": 0
}
```

**Access:** Hospital Admin, Super Admin

---

#### 3. Get All Notifications (with filters)

```http
GET /api/v1/notifications?page=1&limit=20&status=sent&type=prescription_expiring&priority=high&isRead=false
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `recipientId` (string): Filter by recipient
- `type` (enum): Notification type
- `status` (enum): pending, sent, delivered, read, failed, expired
- `priority` (enum): low, normal, high, critical
- `channel` (enum): in_app, email, sms, push, webhook
- `category` (string): Category for grouping
- `isRead` (boolean): Filter by read status
- `isExpired` (boolean): Filter by expired status
- `createdAfter` (date): Filter by creation date
- `createdBefore` (date): Filter by creation date
- `sortBy` (string): Field to sort by (default: createdAt)
- `sortOrder` (string): asc or desc (default: desc)

**Response:** `200 OK`

```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

**Access:** All roles (users see only their own)

---

#### 4. Get My Unread Notifications

```http
GET /api/v1/notifications/me/unread?limit=50
Authorization: Bearer <token>
```

**Response:** `200 OK` - Array of unread notifications

**Access:** All authenticated users

---

#### 5. Get My Notification Statistics

```http
GET /api/v1/notifications/me/stats
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "total": 50,
  "unread": 15,
  "read": 35,
  "pending": 2,
  "failed": 1,
  "byType": {
    "prescription_expiring": 10,
    "appointment_reminder": 8,
    "lab_result_available": 5
  },
  "byPriority": {
    "high": 8,
    "normal": 40,
    "low": 2
  }
}
```

**Access:** All authenticated users

---

#### 6. Mark All My Notifications as Read

```http
POST /api/v1/notifications/me/mark-all-read
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "modifiedCount": 15
}
```

**Access:** All authenticated users

---

#### 7. Mark Many Notifications as Read

```http
POST /api/v1/notifications/mark-many-read
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ids": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
}
```

**Response:** `200 OK`

```json
{
  "modifiedCount": 2
}
```

**Access:** All authenticated users

---

#### 8. Get Notification by ID

```http
GET /api/v1/notifications/{id}
Authorization: Bearer <token>
```

**Response:** `200 OK` - Notification object

**Access:** All authenticated users

---

#### 9. Update Notification

```http
PATCH /api/v1/notifications/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "status": "read",
  "readAt": "2024-12-07T14:35:00Z"
}
```

**Response:** `200 OK` - Updated notification

**Access:** Hospital Admin, Super Admin

---

#### 10. Mark Notification as Read

```http
POST /api/v1/notifications/{id}/mark-read
Authorization: Bearer <token>
```

**Response:** `200 OK` - Updated notification with readAt timestamp

**Access:** All authenticated users

---

#### 11. Acknowledge Notification

```http
POST /api/v1/notifications/{id}/acknowledge
Authorization: Bearer <token>
```

**Response:** `200 OK` - Updated notification with acknowledgedAt timestamp

**Access:** All authenticated users

---

#### 12. Delete Notification

```http
DELETE /api/v1/notifications/{id}
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Access:** Hospital Admin, Super Admin

---

#### 13. Bulk Delete Notifications

```http
DELETE /api/v1/notifications/bulk/delete
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ids": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
}
```

**Response:** `200 OK`

```json
{
  "deletedCount": 2
}
```

**Access:** Hospital Admin, Super Admin

---

### User Preferences

#### 14. Get My Preferences

```http
GET /api/v1/notifications/preferences/me
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "enabled": true,
  "preferredChannels": ["in_app", "email"],
  "typePreferences": [
    {
      "type": "prescription_expiring",
      "enabled": true,
      "channels": [
        { "channel": "email", "enabled": true },
        { "channel": "sms", "enabled": false }
      ]
    }
  ],
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "excludeTypes": ["security_alert", "lab_result_critical"]
  },
  "enableGrouping": true,
  "language": "en",
  "timezone": "Asia/Kolkata"
}
```

**Access:** All authenticated users

---

#### 15. Update My Preferences

```http
PATCH /api/v1/notifications/preferences/me
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "enabled": true,
  "preferredChannels": ["in_app", "email", "sms"],
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "excludeTypes": ["security_alert", "lab_result_critical"]
  },
  "enableDigest": false,
  "enableGrouping": true,
  "groupingThreshold": 5,
  "language": "en",
  "timezone": "Asia/Kolkata"
}
```

**Response:** `200 OK` - Updated preferences

**Access:** All authenticated users

---

#### 16. Add Device Token

```http
POST /api/v1/notifications/preferences/me/device-token
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "token": "fcm-device-token-abc123xyz"
}
```

**Response:** `200 OK` - Updated preferences with new token

**Access:** All authenticated users

---

#### 17. Remove Device Token

```http
DELETE /api/v1/notifications/preferences/me/device-token/{token}
Authorization: Bearer <token>
```

**Response:** `200 OK` - Updated preferences without removed token

**Access:** All authenticated users

---

### Admin Operations

#### 18. Process Scheduled Notifications

```http
POST /api/v1/notifications/admin/process-scheduled
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "message": "Processed 5 scheduled notifications"
}
```

**Access:** Super Admin

---

#### 19. Process Expired Notifications

```http
POST /api/v1/notifications/admin/process-expired
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "message": "Marked 10 notifications as expired"
}
```

**Access:** Super Admin

---

#### 20. Cleanup Old Notifications

```http
POST /api/v1/notifications/admin/cleanup?daysOld=90
Authorization: Bearer <token>
```

**Query Parameters:**

- `daysOld` (number): Delete notifications older than X days (default: 90)

**Response:** `200 OK`

```json
{
  "message": "Deleted 150 old notifications"
}
```

**Access:** Super Admin

---

## Data Models

### Notification

```typescript
{
  _id: ObjectId,
  type: NotificationType,
  priority: NotificationPriority,
  status: NotificationStatus,
  recipientId: ObjectId,
  recipientEmail?: string,
  recipientPhone?: string,
  recipientDeviceTokens?: string[],
  title: string,
  message: string,
  shortMessage?: string,
  relatedEntityId?: ObjectId,
  relatedEntityModel?: string,
  relatedEntityData?: object,
  channels: NotificationChannel[],
  deliveryResults?: DeliveryResult[],
  actions?: ActionButton[],
  deepLink?: string,
  webLink?: string,
  scheduledFor?: Date,
  sentAt?: Date,
  readAt?: Date,
  expiresAt?: Date,
  category?: string,
  groupKey?: string,
  metadata?: object,
  imageUrl?: string,
  iconUrl?: string,
  retryCount?: number,
  failureReason?: string,
  canDismiss?: boolean,
  requiresAcknowledgment?: boolean,
  acknowledgedAt?: Date,
  senderId?: ObjectId,
  senderName?: string,
  createdAt: Date,
  updatedAt: Date,
  isExpired: boolean (virtual),
  isRead: boolean (virtual)
}
```

### NotificationPreference

```typescript
{
  userId: ObjectId,
  enabled: boolean,
  preferredChannels: NotificationChannel[],
  typePreferences: TypePreference[],
  quietHours: QuietHours,
  enableDigest?: boolean,
  digestFrequency?: 'daily' | 'weekly',
  digestTime?: string,
  enableGrouping?: boolean,
  groupingThreshold?: number,
  language?: string,
  timezone?: string,
  email?: string,
  phone?: string,
  deviceTokens?: string[]
}
```

---

## Notification Types

### Appointment Notifications

- `appointment_reminder` - Remind user of upcoming appointment
- `appointment_confirmed` - Appointment confirmed by doctor/hospital
- `appointment_cancelled` - Appointment cancelled
- `appointment_rescheduled` - Appointment rescheduled to new time

### Prescription Notifications

- `prescription_expiring` - Prescription expiring soon
- `prescription_expired` - Prescription has expired
- `prescription_refill_due` - Time to refill prescription
- `prescription_dispensed` - Prescription dispensed by pharmacy
- `prescription_cancelled` - Prescription cancelled by doctor

### Lab Result Notifications

- `lab_result_available` - New lab results available
- `lab_result_critical` - Critical lab results requiring immediate attention

### Health Document Notifications

- `health_document_shared` - Document shared with you
- `health_document_uploaded` - New document uploaded

### Consent Notifications

- `consent_request` - New consent request
- `consent_approved` - Consent approved
- `consent_revoked` - Consent revoked
- `consent_expiring` - Consent expiring soon

### Encounter Notifications

- `encounter_created` - New medical encounter created
- `encounter_updated` - Encounter updated

### System Notifications

- `system_alert` - System-wide alert
- `system_maintenance` - Scheduled maintenance notice
- `security_alert` - Security-related alert

### Account Notifications

- `account_verification` - Account verification required
- `password_changed` - Password changed notification
- `login_detected` - Login from new device/location

### Generic

- `generic` - Catch-all for custom notifications

---

## Usage Examples

### Example 1: Prescription Expiry Notification

```typescript
await notificationService.createHelper({
  type: NotificationType.PRESCRIPTION_EXPIRING,
  priority: NotificationPriority.HIGH,
  recipientId: patient.userId,
  title: 'Prescription Expiring Soon',
  message: `Your prescription for ${prescription.medicationName} will expire in 3 days. Please contact your doctor to renew it.`,
  channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
  relatedEntityId: prescription._id,
  relatedEntityModel: 'Prescription',
  relatedEntityData: {
    prescriptionNumber: prescription.prescriptionNumber,
    medicationName: prescription.medicationName,
    expiryDate: prescription.validityPeriodEnd,
  },
  category: 'prescriptions',
  deepLink: `healthapp://prescription/${prescription._id}`,
  webLink: `https://app.example.com/prescriptions/${prescription._id}`,
  actions: [
    {
      label: 'Renew Prescription',
      action: 'renew_prescription',
      data: { prescriptionId: prescription._id.toString() },
      style: 'primary',
    },
  ],
});
```

### Example 2: Critical Lab Result Alert

```typescript
await notificationService.createHelper({
  type: NotificationType.LAB_RESULT_CRITICAL,
  priority: NotificationPriority.CRITICAL,
  recipientId: patient.userId,
  title: '🚨 Critical Lab Result',
  message:
    'Your blood glucose level is critically high (280 mg/dL). Please contact your doctor immediately.',
  shortMessage: 'Critical: Blood glucose 280 mg/dL',
  channels: [
    NotificationChannel.IN_APP,
    NotificationChannel.EMAIL,
    NotificationChannel.SMS,
    NotificationChannel.PUSH,
  ],
  relatedEntityId: labReport._id,
  relatedEntityModel: 'HealthDocument',
  category: 'lab_results',
  requiresAcknowledgment: true,
  canDismiss: false,
  actions: [
    {
      label: 'Call Doctor',
      action: 'call_doctor',
      data: { doctorId: doctor._id.toString(), phone: doctor.phone },
      style: 'danger',
    },
  ],
});
```

### Example 3: System Maintenance Broadcast

```typescript
await notificationService.createBulk({
  recipientIds: allActiveUserIds,
  type: NotificationType.SYSTEM_MAINTENANCE,
  priority: NotificationPriority.NORMAL,
  title: 'Scheduled System Maintenance',
  message:
    'Our system will be under maintenance on Sunday, Dec 10, from 2:00 AM to 4:00 AM IST. During this time, the platform will be unavailable.',
  channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  category: 'system',
  scheduledFor: new Date('2024-12-09T20:00:00Z'), // Send day before
  imageUrl: 'https://cdn.example.com/maintenance-notice.png',
});
```

---

## Best Practices

### 1. **Choose Appropriate Notification Types**

- Use specific types rather than `generic` for better filtering and analytics
- Critical health information should use `lab_result_critical` or `security_alert`

### 2. **Set Correct Priority Levels**

- **Critical**: Immediate action required (security breaches, critical lab results)
- **High**: Important but not emergency (prescription expiring, appointment reminders)
- **Normal**: Regular updates (document uploads, consent requests)
- **Low**: Informational only (system updates, tips)

### 3. **Multi-Channel Strategy**

- **In-App Only**: Low-priority, non-urgent updates
- **In-App + Email**: Most notifications (standard approach)
- **In-App + Email + SMS**: High-priority (appointments, prescription expiries)
- **All Channels**: Critical alerts (security, critical lab results)

### 4. **Respect User Preferences**

- Always honor quiet hours for non-critical notifications
- Exclude critical types (security, critical results) from quiet hours
- Allow users to customize per-type preferences

### 5. **Use Rich Content Wisely**

- Add action buttons for actionable notifications
- Include deep links for mobile app navigation
- Use images sparingly (important announcements only)
- Group similar notifications using `groupKey`

### 6. **Handle Delivery Failures**

- System automatically retries failed deliveries
- Monitor `deliveryResults` for troubleshooting
- Implement fallback channels for critical notifications

### 7. **Scheduled Notifications**

- Use `scheduledFor` for future delivery
- Set `expiresAt` for time-sensitive notifications
- Run cleanup job regularly to remove old notifications

### 8. **Performance Optimization**

- Use bulk create for mass notifications
- Set appropriate `limit` for list queries
- Filter by `isRead=false` for efficiency
- Use pagination for large result sets

---

## Error Codes

| Code | Description                                  |
| ---- | -------------------------------------------- |
| 400  | Bad Request - Invalid input data             |
| 401  | Unauthorized - Missing or invalid auth token |
| 403  | Forbidden - Insufficient permissions         |
| 404  | Not Found - Notification doesn't exist       |
| 500  | Internal Server Error - Contact support      |

---

## Support

For issues or questions:

- **Email**: support@national-health-record-system.com
- **Documentation**: [API.md](./API.md)
- **Swagger UI**: http://localhost:3000/api/docs

---

**Version**: 1.0.0  
**Last Updated**: December 7, 2024  
**Endpoints**: 20 total (13 user, 4 preference, 3 admin)
