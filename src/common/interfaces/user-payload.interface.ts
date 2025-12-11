/**
 * User payload interface for authenticated requests
 * Used by @CurrentUser() decorator throughout controllers
 */
export interface UserPayload {
  id: string;
  userId: string; // Alias for id, used in controllers
  email: string;
  role: string;
  hospitalId?: string;
  patientId?: string;
  doctorId?: string;
  iat?: number;
  exp?: number;
}
