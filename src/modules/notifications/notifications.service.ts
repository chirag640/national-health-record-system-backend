import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

/**
 * Notification events enum
 */
export enum NotificationEvent {
  // Appointment events
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_REMINDER = 'appointment.reminder',

  // Lab Report events
  LAB_RESULT_READY = 'lab.result.ready',
  LAB_RESULT_UPDATED = 'lab.result.updated',

  // Prescription events
  PRESCRIPTION_NEW = 'prescription.new',
  PRESCRIPTION_UPDATED = 'prescription.updated',
  PRESCRIPTION_DISPENSED = 'prescription.dispensed',

  // Billing events
  INVOICE_GENERATED = 'invoice.generated',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',

  // Message events
  MESSAGE_RECEIVED = 'message.received',

  // System events
  SYSTEM_ALERT = 'system.alert',
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationEvent;
  data?: any;
  userId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Service for managing real-time notifications
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly gateway: NotificationsGateway) {}

  /**
   * Send appointment notification
   */
  sendAppointmentNotification(userId: string, event: NotificationEvent, appointmentData: any) {
    const payload: NotificationPayload = {
      title: this.getEventTitle(event),
      message: this.getAppointmentMessage(event, appointmentData),
      type: event,
      data: appointmentData,
      priority: event === NotificationEvent.APPOINTMENT_REMINDER ? 'high' : 'medium',
    };

    this.gateway.sendToUser(userId, event, payload);
    this.logger.log(`Sent appointment notification to user ${userId}`);
  }

  /**
   * Send lab result notification
   */
  sendLabResultNotification(userId: string, event: NotificationEvent, labData: any) {
    const payload: NotificationPayload = {
      title: 'Lab Results Available',
      message: `Your ${labData.testName} results are ready to view`,
      type: event,
      data: labData,
      priority: 'high',
    };

    this.gateway.sendToUser(userId, event, payload);
    this.logger.log(`Sent lab result notification to user ${userId}`);
  }

  /**
   * Send prescription notification
   */
  sendPrescriptionNotification(userId: string, event: NotificationEvent, prescriptionData: any) {
    const payload: NotificationPayload = {
      title: this.getEventTitle(event),
      message: this.getPrescriptionMessage(event, prescriptionData),
      type: event,
      data: prescriptionData,
      priority: 'medium',
    };

    this.gateway.sendToUser(userId, event, payload);
    this.logger.log(`Sent prescription notification to user ${userId}`);
  }

  /**
   * Send billing notification
   */
  sendBillingNotification(userId: string, event: NotificationEvent, billingData: any) {
    const payload: NotificationPayload = {
      title: this.getEventTitle(event),
      message: this.getBillingMessage(event, billingData),
      type: event,
      data: billingData,
      priority: event === NotificationEvent.PAYMENT_FAILED ? 'high' : 'medium',
    };

    this.gateway.sendToUser(userId, event, payload);
    this.logger.log(`Sent billing notification to user ${userId}`);
  }

  /**
   * Send system alert to role
   */
  sendSystemAlert(role: string, message: string, data?: any) {
    const payload: NotificationPayload = {
      title: 'System Alert',
      message,
      type: NotificationEvent.SYSTEM_ALERT,
      data,
      priority: 'urgent',
    };

    this.gateway.sendToRole(role, NotificationEvent.SYSTEM_ALERT, payload);
    this.logger.log(`Sent system alert to role ${role}`);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return this.gateway.getStats();
  }

  // Helper methods
  private getEventTitle(event: NotificationEvent): string {
    const titles = {
      [NotificationEvent.APPOINTMENT_CREATED]: 'Appointment Scheduled',
      [NotificationEvent.APPOINTMENT_UPDATED]: 'Appointment Updated',
      [NotificationEvent.APPOINTMENT_CANCELLED]: 'Appointment Cancelled',
      [NotificationEvent.APPOINTMENT_REMINDER]: 'Appointment Reminder',
      [NotificationEvent.LAB_RESULT_READY]: 'Lab Results Ready',
      [NotificationEvent.LAB_RESULT_UPDATED]: 'Lab Results Updated',
      [NotificationEvent.PRESCRIPTION_NEW]: 'New Prescription',
      [NotificationEvent.PRESCRIPTION_UPDATED]: 'Prescription Updated',
      [NotificationEvent.PRESCRIPTION_DISPENSED]: 'Prescription Dispensed',
      [NotificationEvent.INVOICE_GENERATED]: 'Invoice Generated',
      [NotificationEvent.PAYMENT_RECEIVED]: 'Payment Received',
      [NotificationEvent.PAYMENT_FAILED]: 'Payment Failed',
      [NotificationEvent.MESSAGE_RECEIVED]: 'New Message',
      [NotificationEvent.SYSTEM_ALERT]: 'System Alert',
    };

    return titles[event] || 'Notification';
  }

  private getAppointmentMessage(event: NotificationEvent, data: any): string {
    const date = new Date(data.startTime).toLocaleDateString();
    const time = new Date(data.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    switch (event) {
      case NotificationEvent.APPOINTMENT_CREATED:
        return `Your appointment is scheduled for ${date} at ${time}`;
      case NotificationEvent.APPOINTMENT_UPDATED:
        return `Your appointment has been rescheduled to ${date} at ${time}`;
      case NotificationEvent.APPOINTMENT_CANCELLED:
        return `Your appointment for ${date} at ${time} has been cancelled`;
      case NotificationEvent.APPOINTMENT_REMINDER:
        return `Reminder: You have an appointment on ${date} at ${time}`;
      default:
        return 'Appointment notification';
    }
  }

  private getPrescriptionMessage(event: NotificationEvent, data: any): string {
    switch (event) {
      case NotificationEvent.PRESCRIPTION_NEW:
        return `New prescription has been issued by Dr. ${data.doctorName || 'your doctor'}`;
      case NotificationEvent.PRESCRIPTION_UPDATED:
        return `Your prescription has been updated`;
      case NotificationEvent.PRESCRIPTION_DISPENSED:
        return `Your prescription has been dispensed`;
      default:
        return 'Prescription notification';
    }
  }

  private getBillingMessage(event: NotificationEvent, data: any): string {
    const amount = data.amount || data.totalAmount;

    switch (event) {
      case NotificationEvent.INVOICE_GENERATED:
        return `Invoice for ₹${amount} has been generated`;
      case NotificationEvent.PAYMENT_RECEIVED:
        return `Payment of ₹${amount} received successfully`;
      case NotificationEvent.PAYMENT_FAILED:
        return `Payment of ₹${amount} failed. Please try again`;
      default:
        return 'Billing notification';
    }
  }
}
