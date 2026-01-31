
import { 
  AppState, Role, RiskLevel, ApptStatus, ReferralStatus, 
  TransportStatus, TaskPriority, FollowUpTask, TransportRequest, Notification, Message, Appointment, User, Referral
} from './types';

interface ExtendedAppState extends AppState {
  systemConfig: {
    seniorMode: boolean;
    virtualDoctorActive: boolean;
    theme: 'clinical' | 'emergency';
  };
}

const ensureValidDate = (dateInput: any): string => {
  if (!dateInput) return new Date().toISOString();
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const INITIAL_DATA: ExtendedAppState = {
  users: [
    { id: 'u1', name: 'Nurse Sarah', role: Role.NURSE, phone: '555-0101' },
    { id: 'u2', name: 'Dr. James Wilson', role: Role.DOCTOR, phone: '555-0102' },
    { id: 'u3', name: 'Bill Driver', role: Role.DRIVER, phone: '555-0103' },
    { id: 'u4', name: 'Margaret Smith', role: Role.PATIENT, phone: '555-0104', patientId: 'p1' },
  ],
  patients: [
    { id: 'p1', name: 'Margaret Smith', dob: '1942-05-12', phone: '555-0104', address: '123 Ridge Rd, Clearwater', riskLevel: RiskLevel.HIGH, notes: 'Requires wheelchair access, post-hip surgery.' },
    { id: 'p2', name: 'Arthur Penhaligon', dob: '1938-11-20', phone: '555-0105', address: '45 Oak Ave', riskLevel: RiskLevel.MEDIUM, notes: 'Type 2 Diabetes management.' },
    { id: 'p3', name: 'Evelyn Reed', dob: '1945-02-15', phone: '555-0106', address: '78 Pine St', riskLevel: RiskLevel.LOW, notes: 'Bilateral cataracts.' },
  ],
  appointments: [
    { id: 'a1', patientId: 'p1', patientName: 'Margaret Smith', datetime: ensureValidDate('2025-05-20T09:00:00Z'), location: 'Clearwater Hospital', status: ApptStatus.SCHEDULED, provider: 'Dr. Heart' },
    { id: 'a2', patientId: 'p2', patientName: 'Arthur Penhaligon', datetime: ensureValidDate('2025-05-18T14:30:00Z'), location: 'Clearwater Hospital', status: ApptStatus.CONFIRMED, provider: 'Dr. Diabetes' },
    { id: 'a3', patientId: 'p1', patientName: 'Margaret Smith', datetime: ensureValidDate('2025-05-15T10:00:00Z'), location: 'Clearwater Hospital', status: ApptStatus.MISSED, provider: 'PT Jane' },
  ],
  transportRequests: [
    { id: 't1', patientId: 'p1', appointmentId: 'a1', pickupLocation: '123 Ridge Rd', destination: 'Clearwater Hospital', scheduledTime: ensureValidDate('2025-05-20T08:15:00Z'), status: TransportStatus.REQUESTED },
    { id: 't2', patientId: 'p2', appointmentId: 'a2', pickupLocation: '45 Oak Ave', destination: 'Clearwater Hospital', scheduledTime: ensureValidDate('2025-05-18T13:45:00Z'), status: TransportStatus.ASSIGNED, driverId: 'u3', driverName: 'Bill Driver' },
  ],
  referrals: [
    { id: 'r1', patientId: 'p1', specialty: 'Cardiology', provider: 'Clearwater Hospital', urgency: RiskLevel.HIGH, status: ReferralStatus.SENT, requestedDate: '2025-05-10' },
  ],
  tasks: [
    { id: 'k1', patientId: 'p1', title: 'Follow-up on missed PT appointment', priority: TaskPriority.URGENT, status: 'PENDING', dueDate: '2025-05-16' },
  ],
  messages: [],
  notifications: [
    { id: 'n-init', userId: 'u1', message: 'Welcome to Clearwater Ridge Care Coordinator.', status: 'unread', createdAt: new Date().toISOString() }
  ],
  systemConfig: {
    seniorMode: true,
    virtualDoctorActive: false,
    theme: 'clinical'
  }
};

class Store {
  private data: ExtendedAppState = INITIAL_DATA;
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = localStorage.getItem('clearwater_state_v8');
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
  }

  getState() { return { ...this.data }; }
  
  setState(newData: Partial<ExtendedAppState>) {
    this.data = { ...this.data, ...newData };
    localStorage.setItem('clearwater_state_v8', JSON.stringify(this.data));
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  toggleVirtualDoctor(active: boolean) {
    this.setState({ systemConfig: { ...this.data.systemConfig, virtualDoctorActive: active } });
    this.addNotification(active ? "VIRTUAL DOCTOR MODE ENGAGED" : "COORDINATION ASSISTANT ENGAGED");
  }

  setTheme(theme: 'clinical' | 'emergency') {
    this.setState({ systemConfig: { ...this.data.systemConfig, theme } });
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

  addAppointment(patientName: string, datetime: string, location: string = 'Clearwater Hospital', provider: string = 'Staff Physician') {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return null;

    const fixedLocation = 'Clearwater Hospital';
    const filteredAppts = this.data.appointments.filter(a => 
      !(a.patientId === patient.id && a.status === ApptStatus.SCHEDULED)
    );

    const newAppt: Appointment = {
      id: `a-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      datetime: ensureValidDate(datetime),
      location: fixedLocation,
      status: ApptStatus.SCHEDULED,
      provider
    };
    
    this.setState({ appointments: [newAppt, ...filteredAppts] });
    this.addNotification(`Scheduled: Clearwater Hospital visit for ${patient.name}.`);
    return newAppt;
  }

  removeAppointment(patientName: string) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;
    const appts = this.data.appointments.filter(a => a.patientId !== patient.id);
    this.setState({ appointments: appts });
    this.addNotification(`Cancelled all visits for ${patient.name}.`);
    return true;
  }

  cancelAppointmentById(id: string) {
    this.setState({ 
      appointments: this.data.appointments.map(a => a.id === id ? { ...a, status: ApptStatus.CANCELLED } : a) 
    });
  }

  completeAppointment(id: string) {
    this.setState({ 
      appointments: this.data.appointments.map(a => a.id === id ? { ...a, status: ApptStatus.COMPLETED } : a) 
    });
    this.addNotification("Clinical encounter completed and recorded.");
  }

  updateAppointmentTime(patientName: string, newDatetime: string) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;
    const appts = this.data.appointments.map(a => 
      (a.patientId === patient.id && a.status === ApptStatus.SCHEDULED)
      ? { ...a, datetime: ensureValidDate(newDatetime) }
      : a
    );
    this.setState({ appointments: appts });
    return true;
  }

  rescheduleByHours(apptId: string, hours: number) {
    this.setState({
      appointments: this.data.appointments.map(a => {
        if (a.id === apptId) {
          const d = new Date(a.datetime);
          d.setHours(d.getHours() + hours);
          return { ...a, datetime: d.toISOString(), status: ApptStatus.SCHEDULED };
        }
        return a;
      })
    });
  }

  manageTask(action: 'CREATE' | 'RESOLVE', patientName: string, title?: string, priority: TaskPriority = TaskPriority.MEDIUM) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;
    if (action === 'CREATE') {
      const newTask: FollowUpTask = {
        id: `k-${Date.now()}`,
        patientId: patient.id,
        title: title || 'Care Review',
        priority,
        status: 'PENDING',
        dueDate: new Date().toISOString().split('T')[0]
      };
      this.setState({ tasks: [newTask, ...this.data.tasks] });
    } else {
      const task = this.data.tasks.find(t => t.patientId === patient.id && t.status === 'PENDING');
      if (task) this.setState({ tasks: this.data.tasks.filter(t => t.id !== task.id) });
    }
    return true;
  }

  manageTransport(action: 'REQUEST' | 'CANCEL' | 'ASSIGN', patientName: string, driverName?: string) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;
    if (action === 'REQUEST') {
      // Check for existing uncompleted ride to avoid duplicates
      const existing = this.data.transportRequests.find(r => r.patientId === patient.id && r.status === TransportStatus.REQUESTED);
      if (existing) return true;

      const newRide: TransportRequest = {
        id: `t-${Date.now()}`,
        patientId: patient.id,
        pickupLocation: patient.address,
        destination: 'Clearwater Hospital',
        scheduledTime: new Date().toISOString(),
        status: TransportStatus.REQUESTED
      };
      this.setState({ transportRequests: [newRide, ...this.data.transportRequests] });
      this.addNotification(`NEW PICKUP REQUEST: ${patient.name} needs a ride to the hospital.`);
    } else if (action === 'ASSIGN' && driverName) {
      const driver = this.data.users.find(u => u.name.toLowerCase().includes(driverName.toLowerCase()));
      const ride = this.data.transportRequests.find(r => r.patientId === patient.id && r.status === TransportStatus.REQUESTED);
      if (ride && driver) {
        this.setState({ transportRequests: this.data.transportRequests.map(r => r.id === ride.id ? { ...r, driverId: driver.id, driverName: driver.name, status: TransportStatus.ASSIGNED } : r) });
      }
    } else {
      this.setState({ transportRequests: this.data.transportRequests.filter(r => r.patientId !== patient.id || r.status === TransportStatus.COMPLETED) });
    }
    return true;
  }

  claimRide(rideId: string, driverId: string, driverName: string) {
    this.setState({
      transportRequests: this.data.transportRequests.map(r => 
        r.id === rideId ? { ...r, driverId, driverName, status: TransportStatus.ASSIGNED } : r
      )
    });
    this.addNotification(`Ride ${rideId} claimed by ${driverName}.`);
  }

  requestRide(patientId: string, appointmentId?: string) {
    const patient = this.data.patients.find(p => p.id === patientId);
    if (!patient) return false;
    
    const appt = appointmentId ? this.data.appointments.find(a => a.id === appointmentId) : null;
    
    const newRide: TransportRequest = {
      id: `t-${Date.now()}`,
      patientId: patient.id,
      appointmentId: appt?.id,
      pickupLocation: patient.address,
      destination: appt?.location || 'Clearwater Hospital',
      scheduledTime: appt ? ensureValidDate(new Date(new Date(appt.datetime).getTime() - 45 * 60000)) : new Date().toISOString(),
      status: TransportStatus.REQUESTED
    };
    this.setState({ transportRequests: [newRide, ...this.data.transportRequests] });
    this.addNotification(`Pickup requested for ${patient.name}.`);
    return true;
  }

  confirmAppt(apptId: string) {
    this.setState({ 
      appointments: this.data.appointments.map(a => a.id === apptId ? { ...a, status: ApptStatus.CONFIRMED } : a) 
    });
  }

  rescheduleOneWeek(apptId: string) {
    const appts = this.data.appointments.map(a => {
      if (a.id === apptId) {
        const nextWeek = new Date(a.datetime);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return { ...a, datetime: ensureValidDate(nextWeek), status: ApptStatus.SCHEDULED };
      }
      return a;
    });
    this.setState({ appointments: appts });
    this.addNotification("Rescheduled missed appointment for one week from original date.");
  }

  requestMedicalHelp(patientId: string) {
    this.addNotification(`EMERGENCY ALERT: Patient ${patientId} requested help.`);
    this.setTheme('emergency');
  }

  requestPrivateSupport(patientId: string) {
    this.addNotification(`SUPPORT REQUEST: Patient ${patientId} is requesting a team member talk.`);
  }

  callDriver(rideId: string) {
    this.addNotification(`Connecting to transportation center for ride ${rideId}...`);
  }

  sendMessage(senderId: string, text: string, receiverId: string) {
    const msg: Message = { id: `m-${Date.now()}`, senderId, receiverId, text, timestamp: new Date().toISOString() };
    this.setState({ messages: [...this.data.messages, msg] });
  }

  resolveTask(taskId: string) {
    this.setState({ tasks: this.data.tasks.filter(t => t.id !== taskId) });
  }

  updateTransportStatus(rideId: string, status: TransportStatus) {
    this.setState({ transportRequests: this.data.transportRequests.map(r => r.id === rideId ? { ...r, status } : r) });
  }

  failRide(rideId: string, reason: string) {
    this.setState({
      transportRequests: this.data.transportRequests.map(r => 
        r.id === rideId ? { ...r, status: TransportStatus.FAILED } : r
      )
    });
  }
}

export const store = new Store();
