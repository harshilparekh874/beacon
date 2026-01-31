
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role, ApptStatus } from './types';
import { store } from './db';
// Fix: Import SvgIcons from constants
import { SvgIcons } from './constants';
import PatientView from './views/PatientView';
import NurseView from './views/NurseView';
import DriverView from './views/DriverView';
import DoctorView from './views/DoctorView';
import InboxView from './views/InboxView';
import VoiceAssistant from './components/VoiceAssistant';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role>(Role.PATIENT);
  const [currentView, setCurrentView] = useState<'MAIN' | 'INBOX'>('MAIN');
  const [isSeniorMode, setIsSeniorMode] = useState(true);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
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
          return `Patient: ${patient.name}. Risk: ${patient.riskLevel}. Next Appointment: ${appt ? `${appt.location} at ${new Date(appt.datetime).toLocaleTimeString()}` : 'None'}. Ride Status: ${ride ? ride.status : 'No ride booked'}.`;
        }
        return "Patient not found.";

      case "NAVIGATE":
        const target = data.target?.toLowerCase() || "";
        if (target.includes("inbox")) setCurrentView('INBOX');
        else if (target.includes("nurse")) { setCurrentRole(Role.NURSE); setCurrentView('MAIN'); }
        else if (target.includes("driver")) { setCurrentRole(Role.DRIVER); setCurrentView('MAIN'); }
        else if (target.includes("doctor")) { setCurrentRole(Role.DOCTOR); setCurrentView('MAIN'); }
        else { setCurrentRole(Role.PATIENT); setCurrentView('MAIN'); }
        return "Navigating now.";

      case "REPORTMEDICALHELP":
        const pid = data.patientId || state.patients[0].id;
        store.requestMedicalHelp(pid);
        return "Help alert sent to the nurse station.";

      default:
        return "Command received.";
    }
  };

  const renderView = () => {
    if (currentView === 'INBOX') return <InboxView />;
    switch (currentRole) {
      case Role.PATIENT: return <PatientView />;
      case Role.NURSE: return <NurseView />;
      case Role.DRIVER: return <DriverView />;
      case Role.DOCTOR: return <DoctorView />;
      default: return <PatientView />;
    }
  };

  const notificationsCount = store.getNotifications().filter(n => n.status === 'unread').length;

  return (
    <div className={`h-screen-safe transition-all duration-300 ${isSeniorMode ? 'senior-mode' : ''} bg-slate-50 flex flex-col`}>
      <nav className="hidden md:flex bg-white text-slate-900 border-b border-slate-100 p-4 text-sm justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="flex gap-8 items-center">
          <span className="font-black tracking-tighter text-indigo-600 text-2xl mr-4 uppercase italic">Clearwater</span>
          <button onClick={() => { setCurrentRole(Role.PATIENT); setCurrentView('MAIN'); }} className={`font-black uppercase tracking-widest text-[10px] ${currentRole === Role.PATIENT && currentView === 'MAIN' ? 'text-indigo-600' : 'text-slate-400'}`}>Patient</button>
          <button onClick={() => { setCurrentRole(Role.NURSE); setCurrentView('MAIN'); }} className={`font-black uppercase tracking-widest text-[10px] ${currentRole === Role.NURSE && currentView === 'MAIN' ? 'text-indigo-600' : 'text-slate-400'}`}>Nurse</button>
          <button onClick={() => { setCurrentRole(Role.DRIVER); setCurrentView('MAIN'); }} className={`font-black uppercase tracking-widest text-[10px] ${currentRole === Role.DRIVER && currentView === 'MAIN' ? 'text-indigo-600' : 'text-slate-400'}`}>Driver</button>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setCurrentView('INBOX')} className="relative font-black uppercase text-[10px] text-slate-500">
            Inbox {notificationsCount > 0 && <span className="ml-1 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{notificationsCount}</span>}
          </button>
          <button onClick={() => setIsSeniorMode(!isSeniorMode)} className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-500">Senior Mode</button>
        </div>
      </nav>

      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b sticky top-0 z-50">
        <span onClick={() => setShowRoleMenu(true)} className="font-black tracking-tighter text-indigo-600 text-xl uppercase italic">Clearwater</span>
        <button onClick={() => setCurrentView('INBOX')} className="relative text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          {notificationsCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">{notificationsCount}</span>}
        </button>
      </div>

      <AnimatePresence>
        {showRoleMenu && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-0 z-[101] bg-white p-6 flex flex-col gap-4 shadow-2xl">
            <button onClick={() => setShowRoleMenu(false)} className="self-end p-2 text-slate-400">Close</button>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Select View</h2>
            {[Role.PATIENT, Role.NURSE, Role.DRIVER, Role.DOCTOR].map(r => (
              <button key={r} onClick={() => { setCurrentRole(r); setCurrentView('MAIN'); setShowRoleMenu(false); }} className={`p-6 rounded-3xl text-left font-black uppercase tracking-widest border-2 ${currentRole === r ? 'bg-indigo-600 text-white border-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{r}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={`${currentRole}-${currentView}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t p-4 flex justify-around items-center z-[90]">
        {[Role.PATIENT, Role.NURSE, Role.DRIVER].map(r => (
          <button key={r} onClick={() => { setCurrentRole(r); setCurrentView('MAIN'); }} className={`flex flex-col items-center gap-1 ${currentRole === r ? 'text-indigo-600' : 'text-slate-300'}`}>
            <div className="w-6 h-6 flex items-center justify-center">
              {/* Fix: Use imported SvgIcons */}
              {r === Role.PATIENT && <SvgIcons.Mic className="w-5 h-5" />}
              {r === Role.NURSE && <SvgIcons.Clock className="w-5 h-5" />}
              {r === Role.DRIVER && <SvgIcons.Car className="w-5 h-5" />}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{r}</span>
          </button>
        ))}
      </nav>

      <VoiceAssistant onAction={handleVoiceAction} role={currentRole} />
    </div>
  );
};

export default App;
