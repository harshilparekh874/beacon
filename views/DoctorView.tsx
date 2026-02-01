
import React, { useState } from 'react';
import { store } from '../db';
import { ApptStatus, User } from '../types';

interface DoctorViewProps {
  user: User;
}

const DoctorView: React.FC<DoctorViewProps> = ({ user }) => {
  const state = store.getState();
  const appts = state.appointments.filter(a => a.status === ApptStatus.SCHEDULED);
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;
    store.sendMessage(user.id, message, 'u1');
    setMessage('');
    store.addNotification(`Beacon Provider ${user.name} recorded a clinical note.`);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-10 gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Beacon Attending Portal</h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-[0.3em]">Beacon Medical Center • Provider: {user.name}</p>
        </div>
        <div className="flex items-center gap-6 bg-white border border-slate-200 p-4 rounded shadow-sm border-t-4 border-t-slate-800">
           <div className="text-right">
             <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Beacon Referrals</p>
             <p className="text-2xl font-black text-amber-700">{state.referrals.length}</p>
           </div>
           <div className="w-px h-10 bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Verifications</p>
             <p className="text-2xl font-black text-slate-900">{appts.length}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Verification Queue */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-slate-900" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Encounter Verification Queue</h2>
          </div>
          
          <div className="space-y-4">
            {appts.map(appt => (
              <div key={appt.id} className="medical-card p-6 flex items-center justify-between group hover:border-amber-300 transition-colors shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tight">{appt.patientName}</h3>
                    <span className="text-[8px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 uppercase">Provider Auth Req</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold italic uppercase tracking-widest">
                    {new Date(appt.datetime).toLocaleDateString()} • {new Date(appt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => store.confirmAppt(appt.id)}
                    className="bg-slate-900 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md"
                  >
                    Authorize
                  </button>
                  <button className="bg-white border border-slate-200 text-slate-400 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">
                    Defer
                  </button>
                </div>
              </div>
            ))}
            {appts.length === 0 && (
              <div className="p-20 text-center medical-card opacity-30 bg-slate-50 border-dashed">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">All services verified in Beacon.</p>
              </div>
            )}
          </div>
        </section>

        {/* Clinical Note Dispatcher */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-amber-500" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dispatch Notes</h2>
          </div>
          <div className="medical-card p-8 space-y-6 border-l-4 border-l-amber-500">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Clinical Observation</label>
               <textarea 
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Enter observations for coordination team..." 
                 className="w-full h-40 p-4 bg-slate-50 rounded border border-slate-200 focus:border-amber-500 outline-none text-sm text-slate-700 placeholder:text-slate-300 shadow-inner transition-all font-medium"
               />
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-full bg-amber-600 text-white py-4 rounded text-xs font-black uppercase tracking-widest shadow-xl hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all beacon-glow"
            >
              Dispatch to Care Team
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorView;
