
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

/**
 * Helper to generate an ISO string for a specific time relative to today.
 * @param daysOffset Number of days from today (0 for today, 1 for tomorrow)
 * @param timeStr "HH:mm" format
 */
const getRelativeISO = (daysOffset: number, timeStr: string): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const [h, m] = timeStr.split(':');
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d.toISOString();
};

/**
 * Formats time for high-visibility UI (e.g. "1:00 PM")
 */
export const formatClinicalTime = (isoString: string) => {
  if (!isoString) return "TBD";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "TBD";
  
  return d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};

/**
 * Formats the full date label (e.g. "Sun, February 1")
 */
export const formatClinicalDate = (isoString: string) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "TBD";
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `Today, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  if (diffDays === 1) return `Tomorrow, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
};

/**
 * Standardizes date strings. 
 * Improved to detect if the input is a full ISO or just a time.
 */
const ensureValidDate = (dateInput: any): string => {
  if (!dateInput) return new Date().toISOString();
  let str = String(dateInput);

  // 1. If it's a full ISO string (contains T and -), use it directly but strip 'Z' to treat as local
  if (str.includes('T') && str.includes('-')) {
    if (str.endsWith('Z')) str = str.slice(0, -1);
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }

  // 2. Handle simple HH:mm (e.g. "13:00") - Default to TODAY
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const [h, m] = str.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return d.toISOString();
  }

  // 3. Last resort fallback
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
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
    { 
      id: 'a1', 
      patientId: 'p1', 
      patientName: 'Margaret Smith', 
      datetime: getRelativeISO(0, '09:00'), // Today
      location: 'Beacon Medical Center', 
      status: ApptStatus.SCHEDULED, 
      provider: 'Dr. Heart' 
    },
    { 
      id: 'a2', 
      patientId: 'p2', 
      patientName: 'Arthur Penhaligon', 
      datetime: getRelativeISO(1, '14:30'), // Tomorrow
      location: 'Beacon Medical Center', 
      status: ApptStatus.CONFIRMED, 
      provider: 'Dr. Diabetes' 
    },
  ],
  transportRequests: [
    { 
      id: 't1', 
      patientId: 'p1', 
      appointmentId: 'a1', 
      pickupLocation: '123 Ridge Rd', 
      destination: 'Beacon Medical Center', 
      scheduledTime: getRelativeISO(0, '08:15'), 
      status: TransportStatus.REQUESTED 
    },
  ],
  referrals: [
    { id: 'r1', patientId: 'p1', specialty: 'Cardiology', provider: 'Beacon Medical Center', urgency: RiskLevel.HIGH, status: ReferralStatus.SENT, requestedDate: new Date().toISOString().split('T')[0] },
  ],
  tasks: [
    { id: 'k1', patientId: 'p1', title: 'Follow-up on missed PT appointment', priority: TaskPriority.URGENT, status: 'PENDING', dueDate: new Date().toISOString().split('T')[0] },
  ],
  messages: [],
  notifications: [
    { id: 'n-init', userId: 'u1', message: 'Welcome to the Beacon Care Coordination Portal.', status: 'unread', createdAt: new Date().toISOString() }
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
    // V10 bump to fix "Feb 1st" vs "Jan 31st" sticky logic
    const saved = localStorage.getItem('beacon_state_v10');
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
    localStorage.setItem('beacon_state_v10', JSON.stringify(this.data));
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
    this.addNotification(active ? "VIRTUAL DOCTOR MODE ENGAGED" : "BEACON ASSISTANT ENGAGED");
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

  addAppointment(patientName: string, datetime: string, location: string = 'Beacon Medical Center', provider: string = 'Staff Physician') {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return null;

    const validDatetime = ensureValidDate(datetime);

    const newAppt: Appointment = {
      id: `a-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      datetime: validDatetime,
      location: 'Beacon Medical Center',
      status: ApptStatus.SCHEDULED,
      provider
    };
    
    // Clear old scheduled/confirmed appointments for this patient before adding new one
    this.setState({ 
      appointments: [newAppt, ...this.data.appointments.filter(a => !(a.patientId === patient.id && (a.status === ApptStatus.SCHEDULED || a.status === ApptStatus.CONFIRMED)))] 
    });
    
    const timeDisplay = formatClinicalTime(validDatetime);
    const dateDisplay = formatClinicalDate(validDatetime);
    this.addNotification(`Scheduled: Visit for ${patient.name} on ${dateDisplay} at ${timeDisplay}.`);
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
    this.addNotification("Clinical encounter completed.");
  }

  updateAppointmentTime(patientName: string, newDatetime: string) {
    const patient = this.data.patients.find(p => p.name.toLowerCase().includes(patientName.toLowerCase()));
    if (!patient) return false;
    const validTime = ensureValidDate(newDatetime);
    const appts = this.data.appointments.map(a => 
      (a.patientId === patient.id && (a.status === ApptStatus.SCHEDULED || a.status === ApptStatus.CONFIRMED))
      ? { ...a, datetime: validTime }
      : a
    );
    this.setState({ appointments: appts });
    this.addNotification(`Updated: ${patient.name}'s visit time changed to ${formatClinicalTime(validTime)}.`);
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
      const existing = this.data.transportRequests.find(r => r.patientId === patient.id && r.status === TransportStatus.REQUESTED);
      if (existing) return true;

      const newRide: TransportRequest = {
        id: `t-${Date.now()}`,
        patientId: patient.id,
        pickupLocation: patient.address,
        destination: 'Beacon Medical Center',
        scheduledTime: new Date().toISOString(),
        status: TransportStatus.REQUESTED
      };
      this.setState({ transportRequests: [newRide, ...this.data.transportRequests] });
      this.addNotification(`Pickup request for ${patient.name} created.`);
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
    this.addNotification(`Ride claimed by ${driverName}.`);
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
      destination: appt?.location || 'Beacon Medical Center',
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
    this.addNotification("Rescheduled for one week from original date.");
  }

  requestMedicalHelp(patientId: string) {
    const patient = this.data.patients.find(p => p.id === patientId);
    if (!patient) return;

    const existingSOS = this.data.transportRequests.find(r => r.patientId === patientId && r.isEmergency && r.status !== TransportStatus.COMPLETED);
    if (existingSOS) return;

    this.setTheme('emergency');
    this.addNotification(`EMERGENCY: DISPATCHING HELP TO ${patient.name.toUpperCase()}.`);

    const emergencyRide: TransportRequest = {
      id: `sos-${Date.now()}`,
      patientId: patient.id,
      pickupLocation: patient.address,
      destination: 'BEACON EMERGENCY ROOM',
      scheduledTime: new Date().toISOString(),
      status: TransportStatus.ASSIGNED,
      driverName: 'AMBULANCE UNIT 01',
      isEmergency: true
    };

    this.setState({ transportRequests: [emergencyRide, ...this.data.transportRequests] });
  }

  resolveEmergency(patientId: string) {
    const sosRide = this.data.transportRequests.find(r => r.patientId === patientId && r.isEmergency && r.status !== TransportStatus.COMPLETED);
    
    this.setTheme('clinical');
    if (sosRide) {
      this.setState({
        transportRequests: this.data.transportRequests.map(r => 
          r.id === sosRide.id ? { ...r, status: TransportStatus.COMPLETED } : r
        )
      });
      this.addNotification(`Emergency resolved for patient.`);
    }
  }

  callDriver(rideId: string) {
    this.addNotification(`Connecting to operator for ride ${rideId}...`);
  }

  sendMessage(senderId: string, text: string, receiverId: string) {
    const msg: Message = { id: `m-${Date.now()}`, senderId, receiverId, text, timestamp: new Date().toISOString() };
    this.setState({ messages: [...this.data.messages, msg] });
  }

  resolveTask(taskId: string) {
    this.setState({ tasks: this.data.tasks.filter(t => t.id !== taskId) });
  }

  updateTransportStatus(rideId: string, status: TransportStatus) {
    const ride = this.data.transportRequests.find(r => r.id === rideId);
    if (ride?.isEmergency && status === TransportStatus.COMPLETED) {
      this.setTheme('clinical');
    }
    this.setState({ transportRequests: this.data.transportRequests.map(r => r.id === rideId ? { ...r, status } : r) });
  }

  failRide(rideId: string, reason: string) {
    const ride = this.data.transportRequests.find(r => r.id === rideId);
    if (ride?.isEmergency) {
      this.setTheme('clinical');
    }
    this.setState({
      transportRequests: this.data.transportRequests.map(r => 
        r.id === rideId ? { ...r, status: TransportStatus.FAILED } : r
      )
    });
  }
}

export const store = new Store();
