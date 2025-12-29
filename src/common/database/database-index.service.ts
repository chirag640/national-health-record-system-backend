import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Database Indexing Service
 * Creates and manages indexes for optimal query performance
 * Run on application startup
 */
@Injectable()
export class DatabaseIndexService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseIndexService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit(): Promise<void> {
    await this.createIndexes();
  }

  async createIndexes(): Promise<void> {
    this.logger.log('Creating database indexes...');

    try {
      const db = this.connection.db;

      // ==========================================
      // Users Collection
      // ==========================================
      await this.createIndexSafe(db, 'users', [
        { key: { email: 1 }, options: { unique: true, name: 'idx_users_email' } },
        { key: { role: 1, emailVerified: 1 }, options: { name: 'idx_users_role_verified' } },
        { key: { createdAt: -1 }, options: { name: 'idx_users_created' } },
        { key: { isLocked: 1, lockUntil: 1 }, options: { name: 'idx_users_lock_status' } },
      ]);

      // ==========================================
      // Patients Collection
      // ==========================================
      await this.createIndexSafe(db, 'patients', [
        { key: { guid: 1 }, options: { unique: true, sparse: true, name: 'idx_patients_guid' } },
        { key: { userId: 1 }, options: { unique: true, name: 'idx_patients_userid' } },
        { key: { phone: 1 }, options: { sparse: true, name: 'idx_patients_phone' } },
        {
          key: { 'address.city': 1, 'address.state': 1 },
          options: { name: 'idx_patients_location' },
        },
        { key: { bloodGroup: 1 }, options: { sparse: true, name: 'idx_patients_bloodgroup' } },
        { key: { createdAt: -1 }, options: { name: 'idx_patients_created' } },
      ]);

      // ==========================================
      // Doctors Collection
      // ==========================================
      await this.createIndexSafe(db, 'doctors', [
        { key: { userId: 1 }, options: { unique: true, name: 'idx_doctors_userid' } },
        { key: { hospitalId: 1 }, options: { name: 'idx_doctors_hospital' } },
        { key: { specialization: 1 }, options: { name: 'idx_doctors_specialization' } },
        { key: { licenseNumber: 1 }, options: { unique: true, name: 'idx_doctors_license' } },
        { key: { isActive: 1, hospitalId: 1 }, options: { name: 'idx_doctors_active_hospital' } },
      ]);

      // ==========================================
      // Prescriptions Collection
      // ==========================================
      await this.createIndexSafe(db, 'prescriptions', [
        { key: { patient: 1, status: 1 }, options: { name: 'idx_prescriptions_patient_status' } },
        { key: { prescriber: 1 }, options: { name: 'idx_prescriptions_prescriber' } },
        { key: { organization: 1 }, options: { name: 'idx_prescriptions_org' } },
        { key: { patientGuid: 1 }, options: { name: 'idx_prescriptions_patientguid' } },
        {
          key: { status: 1, effectivePeriodEnd: 1 },
          options: { name: 'idx_prescriptions_expiring' },
        },
        {
          key: { medicationName: 'text', genericName: 'text' },
          options: { name: 'idx_prescriptions_search' },
        },
        { key: { createdAt: -1 }, options: { name: 'idx_prescriptions_created' } },
        { key: { authoredOn: -1 }, options: { name: 'idx_prescriptions_authored' } },
      ]);

      // ==========================================
      // Appointments Collection
      // ==========================================
      await this.createIndexSafe(db, 'appointments', [
        {
          key: { patientId: 1, appointmentDate: -1 },
          options: { name: 'idx_appointments_patient_date' },
        },
        {
          key: { doctorId: 1, appointmentDate: -1 },
          options: { name: 'idx_appointments_doctor_date' },
        },
        { key: { hospitalId: 1 }, options: { name: 'idx_appointments_hospital' } },
        {
          key: { status: 1, appointmentDate: 1 },
          options: { name: 'idx_appointments_status_date' },
        },
        { key: { appointmentDate: 1 }, options: { name: 'idx_appointments_date' } },
      ]);

      // ==========================================
      // Consents Collection
      // ==========================================
      await this.createIndexSafe(db, 'consents', [
        { key: { patientId: 1, status: 1 }, options: { name: 'idx_consents_patient_status' } },
        { key: { grantedToUserId: 1 }, options: { name: 'idx_consents_grantedto' } },
        { key: { hospitalId: 1 }, options: { name: 'idx_consents_hospital' } },
        { key: { expiresAt: 1 }, options: { name: 'idx_consents_expiry' } },
        { key: { status: 1, expiresAt: 1 }, options: { name: 'idx_consents_active' } },
      ]);

      // ==========================================
      // Health Documents Collection
      // ==========================================
      await this.createIndexSafe(db, 'healthdocuments', [
        { key: { patientId: 1, documentType: 1 }, options: { name: 'idx_docs_patient_type' } },
        { key: { uploadedBy: 1 }, options: { name: 'idx_docs_uploader' } },
        { key: { createdAt: -1 }, options: { name: 'idx_docs_created' } },
        { key: { documentType: 1, createdAt: -1 }, options: { name: 'idx_docs_type_date' } },
      ]);

      // ==========================================
      // Audit Logs Collection
      // ==========================================
      await this.createIndexSafe(db, 'auditlogs', [
        { key: { userId: 1, timestamp: -1 }, options: { name: 'idx_audit_user_time' } },
        { key: { action: 1, timestamp: -1 }, options: { name: 'idx_audit_action_time' } },
        { key: { resourceType: 1, resourceId: 1 }, options: { name: 'idx_audit_resource' } },
        { key: { timestamp: -1 }, options: { name: 'idx_audit_timestamp' } },
        { key: { ipAddress: 1 }, options: { name: 'idx_audit_ip' } },
        // TTL index for auto-cleanup (keep audit logs for 2 years)
        { key: { timestamp: 1 }, options: { expireAfterSeconds: 63072000, name: 'idx_audit_ttl' } },
      ]);

      // ==========================================
      // Notifications Collection
      // ==========================================
      await this.createIndexSafe(db, 'notifications', [
        { key: { recipientId: 1, isRead: 1 }, options: { name: 'idx_notif_recipient_read' } },
        { key: { recipientId: 1, createdAt: -1 }, options: { name: 'idx_notif_recipient_date' } },
        { key: { type: 1 }, options: { name: 'idx_notif_type' } },
        { key: { createdAt: -1 }, options: { name: 'idx_notif_created' } },
        // TTL index (auto-delete after 90 days)
        { key: { createdAt: 1 }, options: { expireAfterSeconds: 7776000, name: 'idx_notif_ttl' } },
      ]);

      // ==========================================
      // OTPs Collection
      // ==========================================
      await this.createIndexSafe(db, 'otps', [
        { key: { email: 1, purpose: 1 }, options: { name: 'idx_otp_email_purpose' } },
        // TTL index (auto-delete expired OTPs)
        { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0, name: 'idx_otp_ttl' } },
      ]);

      // ==========================================
      // Refresh Tokens Collection
      // ==========================================
      await this.createIndexSafe(db, 'refreshtokens', [
        { key: { userId: 1 }, options: { name: 'idx_refresh_user' } },
        { key: { token: 1 }, options: { unique: true, name: 'idx_refresh_token' } },
        { key: { sessionId: 1 }, options: { name: 'idx_refresh_session' } },
        // TTL index
        { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0, name: 'idx_refresh_ttl' } },
      ]);

      // ==========================================
      // Sessions Collection
      // ==========================================
      await this.createIndexSafe(db, 'sessions', [
        { key: { userId: 1, isActive: 1 }, options: { name: 'idx_session_user_active' } },
        { key: { sessionId: 1 }, options: { unique: true, name: 'idx_session_id' } },
        { key: { lastActivityAt: -1 }, options: { name: 'idx_session_activity' } },
      ]);

      // ==========================================
      // Encounters Collection
      // ==========================================
      await this.createIndexSafe(db, 'encounters', [
        { key: { patientId: 1, date: -1 }, options: { name: 'idx_encounter_patient_date' } },
        { key: { doctorId: 1 }, options: { name: 'idx_encounter_doctor' } },
        { key: { hospitalId: 1 }, options: { name: 'idx_encounter_hospital' } },
        { key: { status: 1 }, options: { name: 'idx_encounter_status' } },
      ]);

      // ==========================================
      // Medical History Collections
      // ==========================================
      await this.createIndexSafe(db, 'allergies', [
        { key: { patientId: 1 }, options: { name: 'idx_allergy_patient' } },
        { key: { allergen: 'text' }, options: { name: 'idx_allergy_search' } },
      ]);

      await this.createIndexSafe(db, 'conditions', [
        { key: { patientId: 1, status: 1 }, options: { name: 'idx_condition_patient_status' } },
        { key: { name: 'text', code: 'text' }, options: { name: 'idx_condition_search' } },
      ]);

      await this.createIndexSafe(db, 'labreports', [
        { key: { patientId: 1, testDate: -1 }, options: { name: 'idx_lab_patient_date' } },
        { key: { testType: 1 }, options: { name: 'idx_lab_type' } },
      ]);

      await this.createIndexSafe(db, 'vitals', [
        { key: { patientId: 1, recordedAt: -1 }, options: { name: 'idx_vitals_patient_date' } },
      ]);

      // ==========================================
      // Telemedicine Sessions
      // ==========================================
      await this.createIndexSafe(db, 'telemedicinesessions', [
        { key: { patientId: 1, scheduledAt: -1 }, options: { name: 'idx_tele_patient_date' } },
        { key: { doctorId: 1, scheduledAt: -1 }, options: { name: 'idx_tele_doctor_date' } },
        { key: { status: 1, scheduledAt: 1 }, options: { name: 'idx_tele_status_date' } },
        { key: { roomName: 1 }, options: { unique: true, sparse: true, name: 'idx_tele_room' } },
      ]);

      // ==========================================
      // Billing Collection
      // ==========================================
      await this.createIndexSafe(db, 'bills', [
        { key: { patientId: 1, createdAt: -1 }, options: { name: 'idx_bill_patient_date' } },
        { key: { status: 1 }, options: { name: 'idx_bill_status' } },
        { key: { invoiceNumber: 1 }, options: { unique: true, name: 'idx_bill_invoice' } },
      ]);

      this.logger.log('✅ Database indexes created successfully');
    } catch (error) {
      this.logger.error('Failed to create database indexes', error);
    }
  }

  /**
   * Create index safely (ignore if already exists)
   */
  private async createIndexSafe(
    db: any,
    collectionName: string,
    indexes: Array<{ key: any; options: any }>,
  ): Promise<void> {
    try {
      const collection = db.collection(collectionName);

      for (const { key, options } of indexes) {
        try {
          await collection.createIndex(key, options);
          this.logger.debug(`Created index ${options.name} on ${collectionName}`);
        } catch (err: any) {
          // Ignore "index already exists" errors
          if (err.code !== 85 && err.code !== 86) {
            this.logger.warn(
              `Failed to create index ${options.name} on ${collectionName}: ${err.message}`,
            );
          }
        }
      }
    } catch (err: any) {
      // Collection might not exist yet
      this.logger.debug(`Skipping indexes for ${collectionName}: collection may not exist`);
    }
  }

  /**
   * Get index statistics for monitoring
   */
  async getIndexStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    try {
      const db = this.connection.db;
      if (!db) {
        this.logger.warn('Database connection not available for index stats');
        return stats;
      }

      const collections = await db.listCollections().toArray();

      for (const col of collections) {
        const indexes = await db.collection(col.name).indexes();
        stats[col.name] = {
          indexCount: indexes.length,
          indexes: indexes.map((idx: any) => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique || false,
          })),
        };
      }
    } catch (error) {
      this.logger.error('Failed to get index stats', error);
    }

    return stats;
  }
}
