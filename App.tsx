
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role, ApptStatus, User } from './types';
import { store } from './db';
import { SvgIcons } from './constants';
import PatientView from './views/PatientView';
import NurseView from './views/NurseView';
import DriverView from './views/DriverView';
import DoctorView from './views/DoctorView';
import InboxView from './views/InboxView';
import VoiceAssistant from './components/VoiceAssistant';

const LoginView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const users = store.getState().users;
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 z-[200]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[48px] p-10 shadow-2xl space-y-10"
      >
        <div className="text-center space-y-2">
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Clearwater</h1>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Care Coordinator Login</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {users.map(user => (
            <button 
              key={user.id} 
              onClick={() => onLogin(user)}
              className="group flex items-center justify-between p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all active:scale-95 text-left"
            >
              <div>
                <p className="text-xl font-black text-slate-900 tracking-tight">{user.name}</p>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 font-black transition-colors">
                {user.name.charAt(0)}
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-tight">Select your profile to continue</p>
      </motion.div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'MAIN' | 'INBOX'>('MAIN');
  const [isSeniorMode, setIsSeniorMode] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const handleVoiceAction = (data: any) => {
    const action = data.action?.toUpperCase();
    const state = store.getState();

    switch (action) {
      case "GETPATIENTINFO":
        const name = data.patientName?.toLowerCase() || "";
        const patient = state.patients.find(p => p.name.toLowerCase().includes(name));
        if (patient) {
          const appt = state.appointments.find(a => a.patientId === patient.id && a.status !== ApptStatus.COMPLETED);
          const ride = state.transportRequests.find(t => t.patientId === patient.id && t.status !== 'COMPLETED');
          return `Patient: ${patient.name}. Status: ${appt ? `Next visit at ${appt.location}` : 'No upcoming visits'}. Transportation: ${ride ? ride.status : 'None scheduled'}.`;
        }
        return "I couldn't find that patient.";

      case "ADDAPPOINTMENT":
        const { patientName, datetime, location } = data;
        const res = store.addAppointment(patientName, datetime, location);
        return res ? `Appointment booked for ${patientName} on ${new Date(res.datetime).toLocaleDateString()}.` : "Could not book appointment.";

      case "REMOVEAPPOINTMENT":
        const removeResult = store.removeAppointment(data.patientName, data.location);
        return removeResult ? "Appointment successfully cancelled." : "No matching appointment found to cancel.";

      case "UPDATEAPPOINTMENTTIME":
        const updateResult = store.updateAppointmentTime(data.patientName, data.newDatetime, data.location);
        return updateResult ? "The visit has been rescheduled." : "I couldn't change the time.";

      case "NAVIGATE":
        if (data.target?.toLowerCase().includes("inbox")) setCurrentView('INBOX');
        else setCurrentView('MAIN');
        return "Navigating.";

      case "REPORTMEDICALHELP":
        store.requestMedicalHelp(state.patients[0].id);
        return "Emergency alert sent to nurses.";

      default:
        return "Understood.";
    }
  };

  const renderView = () => {
    if (!currentUser) return null;
    if (currentView === 'INBOX') return <InboxView />;
    switch (currentUser.role) {
      case Role.PATIENT: return <PatientView />;
      case Role.NURSE: return <NurseView />;
      case Role.DRIVER: return <DriverView />;
      case Role.DOCTOR: return <DoctorView />;
      default: return <PatientView />;
    }
  };

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  const notificationsCount = store.getNotifications().filter(n => n.status === 'unread').length;

  return (
    <div className={`h-screen-safe transition-all duration-300 ${isSeniorMode ? 'senior-mode' : ''} bg-slate-50 flex flex-col`}>
      <nav className="flex bg-white text-slate-900 border-b border-slate-100 p-4 justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="flex gap-4 items-center">
          <span className="font-black tracking-tighter text-indigo-600 text-xl uppercase italic">Clearwater</span>
          <div className="hidden md:flex gap-4">
            <button onClick={() => setCurrentView('MAIN')} className={`font-black uppercase text-[10px] tracking-widest ${currentView === 'MAIN' ? 'text-indigo-600' : 'text-slate-400'}`}>Dashboard</button>
            <button onClick={() => setCurrentView('INBOX')} className={`font-black uppercase text-[10px] tracking-widest ${currentView === 'INBOX' ? 'text-indigo-600' : 'text-slate-400'}`}>Inbox</button>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{currentUser.role}</p>
            <p className="text-sm font-black text-slate-900 leading-none mt-1">{currentUser.name}</p>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={`${currentUser.id}-${currentView}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Voice Assistant knows who is logged in */}
      <VoiceAssistant onAction={handleVoiceAction} role={currentUser.role} />
    </div>
  );
};

export default App;
