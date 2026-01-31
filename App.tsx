
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role, User, TaskPriority } from './types';
import { store } from './db';
import PatientView from './views/PatientView';
import NurseView from './views/NurseView';
import DriverView from './views/DriverView';
import DoctorView from './views/DoctorView';
import InboxView from './views/InboxView';
import VoiceAssistant from './components/VoiceAssistant';

const LoginView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const users = store.getState().users;
  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4 z-[200]">
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center text-white">
           <div className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Clearwater Ridge Health System</div>
           <h1 className="text-2xl font-bold tracking-tight">Clinical Coordination Portal</h1>
        </div>
        <div className="p-8 space-y-6">
          <p className="text-sm text-slate-500 text-center mb-4">Please select your clinical profile to authenticate.</p>
          <div className="space-y-2">
            {users.map(user => (
              <button 
                key={user.id} 
                onClick={() => onLogin(user)}
                className="w-full flex items-center justify-between p-4 rounded border border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user.role} ACCESS</p>
                </div>
                <div className="text-slate-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized Personnel Only • v3.0.0-PRO</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'MAIN' | 'INBOX'>('MAIN');
  const [appState, setAppState] = useState(store.getState());

  useEffect(() => {
    return store.subscribe(() => {
      setAppState({ ...store.getState() });
    });
  }, []);

  const handleVoiceAction = (data: any) => {
    switch (data.functionName || "") {
      case "consultVirtualDoctor":
        store.toggleVirtualDoctor(data.enable);
        return `Consultation mode ${data.enable ? 'engaged' : 'disengaged'}.`;
      case "manageAppointment":
        if (data.action === 'ADD') store.addAppointment(data.patientName, data.datetime || new Date().toISOString(), data.location || 'Clinic');
        else if (data.action === 'CANCEL') store.removeAppointment(data.patientName, data.location);
        else store.updateAppointmentTime(data.patientName, data.datetime, data.location);
        return "Clinical schedule updated.";
      case "manageTask":
        store.manageTask(data.action, data.patientName, data.title, data.priority as TaskPriority);
        return "Work queue modified.";
      case "manageTransport":
        store.manageTransport(data.action, data.patientName, data.driverName);
        return "Logistics updated.";
      case "navigate":
        setCurrentView(data.target);
        return `Navigation to ${data.target} verified.`;
      case "getPatientInfo":
        const p = appState.patients.find(pt => pt.name.toLowerCase().includes(data.patientName?.toLowerCase() || ''));
        return p ? `${p.name}: Risk ${p.riskLevel}. Notes: ${p.notes}` : "Record not found.";
      default:
        return "Administrative change recorded.";
    }
  };

  if (!currentUser) return <LoginView onLogin={setCurrentUser} />;

  const { systemConfig } = appState;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${systemConfig.theme === 'emergency' ? 'bg-rose-50' : 'bg-slate-50'}`}>
      <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 ${systemConfig.theme === 'emergency' ? 'bg-rose-600' : 'bg-blue-800'} rounded-sm flex items-center justify-center text-white font-bold text-xs`}>C</div>
            <span className="font-bold text-slate-900 tracking-tight">Clearwater Ridge</span>
            {systemConfig.virtualDoctorActive && (
              <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ml-2 animate-pulse">MD ACTIVE</span>
            )}
          </div>
          <div className="hidden lg:flex items-center gap-1">
            <button 
              onClick={() => setCurrentView('MAIN')} 
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'MAIN' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
            >
              System Dashboard
            </button>
            <div className="w-px h-4 bg-slate-200 mx-2" />
            <button 
              onClick={() => setCurrentView('INBOX')} 
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'INBOX' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Operations Stream
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{currentUser.role} SESSION</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{currentUser.name}</p>
          </div>
          <button 
            onClick={() => {
              store.setTheme('clinical');
              setCurrentUser(null);
            }} 
            className="text-[10px] font-bold uppercase text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 px-2 py-1 rounded"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-[1400px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentUser.id}-${currentView}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {currentView === 'INBOX' ? <InboxView user={currentUser} /> : (
                <>
                  {currentUser.role === Role.NURSE && <NurseView user={currentUser} />}
                  {currentUser.role === Role.PATIENT && <PatientView user={currentUser} />}
                  {currentUser.role === Role.DRIVER && <DriverView user={currentUser} />}
                  {currentUser.role === Role.DOCTOR && <DoctorView user={currentUser} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <VoiceAssistant onAction={handleVoiceAction} role={currentUser.role} />
    </div>
  );
};

export default App;
