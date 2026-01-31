
export enum Role {
  NURSE = 'NURSE',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  DRIVER = 'DRIVER'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ApptStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED'
}

export enum ReferralStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED'
}

export enum TransportStatus {
  REQUESTED = 'REQUESTED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  phone: string;
  patientId?: string; // Linked patient profile
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  phone: string;
  address: string;
  riskLevel: RiskLevel;
  notes: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  datetime: string;
  location: string;
  status: ApptStatus;
  referralId?: string;
  provider: string;
}

export interface TransportRequest {
  id: string;
  patientId: string;
  appointmentId?: string;
  pickupLocation: string;
  destination: string;
  scheduledTime: string;
  status: TransportStatus;
  driverId?: string;
  driverName?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  specialty: string;
  provider: string;
  urgency: RiskLevel;
  status: ReferralStatus;
  requestedDate: string;
}

export interface FollowUpTask {
  id: string;
  patientId: string;
  title: string;
  priority: TaskPriority;
  status: 'PENDING' | 'COMPLETED';
  dueDate: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface AppState {
  users: User[];
  patients: Patient[];
  appointments: Appointment[];
  transportRequests: TransportRequest[];
  referrals: Referral[];
  tasks: FollowUpTask[];
  messages: Message[];
  notifications: Notification[];
}
