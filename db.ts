
import { 
  AppState, Role, RiskLevel, ApptStatus, ReferralStatus, 
  TransportStatus, TaskPriority, FollowUpTask, TransportRequest, Notification, Message, Appointment, User
} from './types';

const INITIAL_DATA: AppState = {
  users: [
    { id: 'u1', name: 'Nurse Sarah', role: Role.NURSE, phone: '555-0101' },
    { id: 'u2', name: 'Dr. James Wilson', role: Role.DOCTOR, phone: '555-0102' },
    { id: 'u3', name: 'Bill Driver', role: Role.DRIVER, phone: '555-0103' },
    { id: 'u4', name: 'Margaret Smith', role: Role.PATIENT, phone: '555-0104' },
  ],
  patients: [
    { id: 'p1', name: 'Margaret Smith', dob: '1942-05-12', phone: '555-0104', address: '123 Ridge Rd, Clearwater', riskLevel: RiskLevel.HIGH, notes: 'Requires wheelchair access, post-hip surgery.' },
    { id: 'p2', name: 'Arthur Penhaligon', dob: '1938-11-20', phone: '555-0105', address: '45 Oak Ave', riskLevel: RiskLevel.MEDIUM, notes: 'Type 2 Diabetes management.' },
    { id: 'p3', name: 'Evelyn Reed', dob: '1945-02-15', phone: '555-0106', address: '78 Pine St', riskLevel: RiskLevel.LOW, notes: 'Bilateral cataracts.' },
  ],
  appointments: [
    { id: 'a1', patientId: 'p1', patientName: 'Margaret Smith', datetime: '2025-05-20T09:00:00', location: 'City Cardiology', status: ApptStatus.SCHEDULED, provider: 'Dr. Heart' },
    { id: 'a2', patientId: 'p2', patientName: 'Arthur Penhaligon', datetime: '2025-05-18T14:30:00', location: 'Clearwater General', status: ApptStatus.CONFIRMED, provider: 'Dr. Diabetes' },
    { id: 'a3', patientId: 'p1', patientName: 'Margaret Smith', datetime: '2025-05-15T10:00:00', location: 'Physical Therapy', status: ApptStatus.MISSED, provider: 'PT Jane' },
  ],
  transportRequests: [
    { id: 't1', patientId: 'p1', appointmentId: 'a1', pickupLocation: '123 Ridge Rd', destination: 'City Cardiology', scheduledTime: '2025-05-20T08:15:00', status: TransportStatus.REQUESTED },
    { id: 't2', patientId: 'p2', appointmentId: 'a2', pickupLocation: '45 Oak Ave', destination: 'Clearwater General', scheduledTime: '2025-05-18T13:45:00', status: TransportStatus.ASSIGNED, driverId: 'u3', driverName: 'Bill Driver' },
  ],
  referrals: [
    { id: 'r1', patientId: 'p1', specialty: 'Cardiology', provider: 'City Cardiology', urgency: RiskLevel.HIGH, status: ReferralStatus.SENT, requestedDate: '2025-05-10' },
  ],
  tasks: [
    { id: 'k1', patientId: 'p1', title: 'Follow-up on missed PT appointment', priority: TaskPriority.URGENT, status: 'PENDING', dueDate: '2025-05-16' },
  ],
  messages: [],
  notifications: [
    { id: 'n-init', userId: 'u1', message: 'Welcome to Clearwater Ridge Care Coordinator.', status: 'unread', createdAt: new Date().toISOString() }
  ]
};

class Store {
  private data: AppState = INITIAL_DATA;
  private listeners: (() => void)[] = [];

  constructor() {
    const savedRides = localStorage.getItem('transport_requests_cache');
    if (savedRides) {
      try {
        this.data.transportRequests = JSON.parse(savedRides);
      } catch (e) {
        console.error("Failed to restore transport cache", e);
      }
    }
  }

  getState() { return this.data; }
  getNotifications() { return this.data.notifications; }
  
  setState(newData: Partial<AppState>) {
    this.data = { ...this.data, ...newData };
    if (newData.transportRequests) {
      localStorage.setItem('transport_requests_cache', JSON.stringify(this.data.transportRequests));
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  addNotification(message: string, userId: string = 'u1') {
    const n: Notification = {
      id: `n-${Date.now()}`,
      userId,
      message,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    this.setState({ notifications: [n, ...this.data.notifications] });
  }

  markNotificationRead(id: string) {
    const notifications = this.data.notifications.map(n => 
      n.id === id ? { ...n, status: 'read' as const } : n
    );
    this.setState({ notifications });
  }

  markMissed(apptId: string) {
    const appts = this.data.appointments.map(a => a.id === apptId ? { ...a, status: ApptStatus.MISSED } : a);
    const appt = appts.find(a => a.id === apptId);
    if (!appt) return;

    const newTask: FollowUpTask = {
      id: `k-${Date.now()}`,
      patientId: appt.patientId,
      title: `URGENT: Missed ${appt.location} appointment`,
      priority: TaskPriority.URGENT,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0]
    };

    this.addNotification(`ALERT: ${appt.patientName} missed an appointment at ${appt.location}`);
    this.setState({ 
      appointments: appts, 
      tasks: [newTask, ...this.data.tasks] 
    });
  }

  confirmAppt(apptId: string) {
    const appts = this.data.appointments.map(a => a.id === apptId ? { ...a, status: ApptStatus.CONFIRMED } : a);
    const appt = appts.find(a => a.id === apptId);
    this.addNotification(`Success: ${appt?.patientName}'s appointment is confirmed.`);
    this.setState({ appointments: appts });
  }

  addAppointment(patientName: string, datetime: string, location: string = 'Clearwater Ridge Main Clinic', provider: string = 'Staff Physician') {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return null;

    let finalDate: string;
    try {
      const d = new Date(datetime);
      if (isNaN(d.getTime())) throw new Error("Invalid Date");
      finalDate = d.toISOString();
    } catch (e) {
      finalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const newAppt: Appointment = {
      id: `a-new-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      datetime: finalDate,
      location,
      status: ApptStatus.SCHEDULED,
      provider
    };

    const updatedAppts = [newAppt, ...this.data.appointments];
    this.addNotification(`New Appointment Scheduled: ${patient.name} at ${location} on ${new Date(finalDate).toLocaleDateString()}.`);
    this.setState({ appointments: updatedAppts });
    
    const newTask: FollowUpTask = {
      id: `k-ride-${Date.now()}`,
      patientId: patient.id,
      title: `COORDINATE RIDE: New visit for ${patient.name} at ${location}`,
      priority: TaskPriority.MEDIUM,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0]
    };
    this.setState({ tasks: [newTask, ...this.data.tasks] });

    return newAppt;
  }

  removeAppointment(patientName: string, location?: string) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;

    const target = this.data.appointments.find(a => 
      a.patientId === patient.id && 
      (location ? a.location.toLowerCase().includes(location.toLowerCase()) : true) &&
      a.status !== ApptStatus.COMPLETED &&
      a.status !== ApptStatus.CANCELLED
    );

    if (!target) return false;

    const updatedAppts = this.data.appointments.map(a => 
      a.id === target.id ? { ...a, status: ApptStatus.CANCELLED } : a
    );

    const updatedRides = this.data.transportRequests.map(r => 
      r.appointmentId === target.id ? { ...r, status: TransportStatus.FAILED } : r
    );

    this.addNotification(`Cancelled: ${patient.name}'s visit to ${target.location} has been removed.`);
    this.setState({ 
      appointments: updatedAppts,
      transportRequests: updatedRides
    });
    return true;
  }

  updateAppointmentTime(patientName: string, newDatetime: string, location?: string) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;

    const target = this.data.appointments.find(a => 
      a.patientId === patient.id && 
      (location ? a.location.toLowerCase().includes(location.toLowerCase()) : true) &&
      a.status !== ApptStatus.COMPLETED
    );

    if (!target) return false;

    let finalDate: string;
    try {
      const d = new Date(newDatetime);
      if (isNaN(d.getTime())) throw new Error("Invalid Date");
      finalDate = d.toISOString();
    } catch (e) {
      return false;
    }

    const updatedAppts = this.data.appointments.map(a => 
      a.id === target.id ? { ...a, datetime: finalDate, status: ApptStatus.SCHEDULED } : a
    );

    const updatedRides = this.data.transportRequests.map(r => 
      r.appointmentId === target.id ? { ...r, scheduledTime: finalDate } : r
    );

    this.addNotification(`Rescheduled: ${patient.name}'s visit to ${target.location} moved to ${new Date(finalDate).toLocaleString()}.`);
    this.setState({ 
      appointments: updatedAppts,
      transportRequests: updatedRides
    });
    return true;
  }

  rescheduleOneWeek(apptId: string) {
    const appt = this.data.appointments.find(a => a.id === apptId);
    if (!appt) return false;

    const currentDate = new Date(appt.datetime);
    const newDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const hour = newDate.getHours();

    if (hour < 9 || hour >= 16) {
      newDate.setHours(10, 0, 0, 0);
    }

    const appts = this.data.appointments.map(a => 
      a.id === apptId ? { ...a, datetime: newDate.toISOString(), status: ApptStatus.SCHEDULED } : a
    );
    
    this.addNotification(`Auto-Rescheduled: ${appt.patientName}'s visit moved to ${newDate.toLocaleDateString()} at ${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    
    const filteredTasks = this.data.tasks.filter(t => !t.title.includes(appt.location));
    
    this.setState({ 
      appointments: appts,
      tasks: filteredTasks
    });
    return true;
  }

  requestRide(patientId: string, apptId: string) {
    const appt = this.data.appointments.find(a => a.id === apptId);
    const patient = this.data.patients.find(p => p.id === patientId);
    if (!appt || !patient) return;

    const newRide: TransportRequest = {
      id: `t-${Date.now()}`,
      patientId,
      appointmentId: apptId,
      pickupLocation: patient.address,
      destination: appt.location,
      scheduledTime: appt.datetime,
      status: TransportStatus.REQUESTED
    };

    this.addNotification(`New Ride Request for ${patient.name}`);
    this.setState({ transportRequests: [newRide, ...this.data.transportRequests] });
  }

  requestMedicalHelp(patientId: string) {
    const patient = this.data.patients.find(p => p.id === patientId);
    if (!patient) return;
    this.addNotification(`URGENT: ${patient.name} requested immediate medical assistance.`);
    const newTask: FollowUpTask = {
      id: `k-med-${Date.now()}`,
      patientId,
      title: `URGENT MEDICAL HELP: ${patient.name}`,
      priority: TaskPriority.URGENT,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0]
    };
    this.setState({ tasks: [newTask, ...this.data.tasks] });
  }

  requestPrivateSupport(patientId: string) {
    const patient = this.data.patients.find(p => p.id === patientId);
    if (!patient) return;
    this.addNotification(`PRIVATE: ${patient.name} requested emotional/private support.`);
    const newTask: FollowUpTask = {
      id: `k-supp-${Date.now()}`,
      patientId,
      title: `PRIVATE SUPPORT: ${patient.name}`,
      priority: TaskPriority.HIGH,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0]
    };
    this.setState({ tasks: [newTask, ...this.data.tasks] });
  }

  callDriver(rideId: string) {
    const ride = this.data.transportRequests.find(r => r.id === rideId);
    if (!ride) return;
    this.addNotification(`Connecting patient with driver...`);
  }

  failRide(rideId: string, reason: string) {
    const ride = this.data.transportRequests.find(r => r.id === rideId);
    if (!ride) return;
    
    const updated = this.data.transportRequests.map(r => r.id === rideId ? { ...r, status: TransportStatus.FAILED } : r);
    this.setState({ transportRequests: updated });
    
    this.addNotification(`TRANSPORT FAILURE: Ride cancelled. Reason: ${reason}`);
    
    const newTask: FollowUpTask = {
      id: `k-fail-${Date.now()}`,
      patientId: ride.patientId,
      title: `RE-COORDINATE RIDE: Transport failed for ${ride.destination}`,
      priority: TaskPriority.URGENT,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0]
    };
    this.setState({ tasks: [newTask, ...this.data.tasks] });
  }

  sendMessage(senderId: string, text: string, receiverId: string = 'u1') {
    const msg: Message = {
      id: `m-${Date.now()}`,
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString()
    };
    this.addNotification(`New message from ${this.data.users.find(u => u.id === senderId)?.name}`);
    this.setState({ messages: [...this.data.messages, msg] });
  }

  resolveTask(taskId: string) {
    this.setState({ tasks: this.data.tasks.filter(t => t.id !== taskId) });
  }

  updateTransportStatus(rideId: string, status: TransportStatus) {
    const updated = this.data.transportRequests.map(r => r.id === rideId ? { ...r, status } : r);
    this.setState({ transportRequests: updated });
    this.addNotification(`Transport update: Ride is now ${status}`);
  }
}

export const store = new Store();
