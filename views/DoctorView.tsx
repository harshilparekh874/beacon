
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
    store.addNotification(`${user.name} recorded a clinical note.`);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-10 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Attending Portal</h1>
          <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">Institution: Clearwater Ridge • Provider: {user.name}</p>
        </div>
        <div className="flex items-center gap-6 bg-white border border-slate-200 p-4 rounded shadow-sm">
           <div className="text-right">
             <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Active Referrals</p>
             <p className="text-2xl font-bold text-blue-800">{state.referrals.length}</p>
           </div>
           <div className="w-px h-10 bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Tasks Pending</p>
             <p className="text-2xl font-bold text-amber-600">{appts.length}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Verification Queue */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-blue-800" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visit Authorization Queue</h2>
          </div>
          
          <div className="space-y-4">
            {appts.map(appt => (
              <div key={appt.id} className="medical-card p-6 flex items-center justify-between group hover:border-blue-300 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{appt.patientName}</h3>
                    <span className="text-[8px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 uppercase">Verification Required</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium italic">
                    {new Date(appt.datetime).toLocaleDateString()} at {new Date(appt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => store.confirmAppt(appt.id)}
                    className="bg-blue-800 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-900"
                  >
                    Authenticate
                  </button>
                  <button className="bg-white border border-slate-200 text-slate-400 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
            {appts.length === 0 && (
              <div className="p-20 text-center medical-card opacity-50 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">All scheduled services verified.</p>
              </div>
            )}
          </div>
        </section>

        {/* Clinical Notes Feed */}
        <section className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-slate-900" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Liaison Log</h2>
          </div>
          <div className="medical-card p-8 space-y-6">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Dispatch to Care Coordination Team</label>
               <textarea 
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Record clinical observations, referral adjustments, or provider notes..." 
                 className="w-full h-40 p-4 bg-slate-50 rounded border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-700 placeholder:text-slate-300 shadow-inner transition-all font-medium"
               />
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-full bg-slate-900 text-white py-3 rounded text-xs font-bold uppercase tracking-widest shadow hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all"
            >
              Dispatch Note
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorView;
