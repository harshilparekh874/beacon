
import React, { useState } from 'react';
import { store } from '../db';
import { ApptStatus } from '../types';
import { SvgIcons } from '../constants';

const DoctorView: React.FC = () => {
  const state = store.getState();
  const doctor = state.users.find(u => u.id === 'u2');
  const appts = state.appointments.filter(a => a.status === ApptStatus.SCHEDULED);
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;
    store.sendMessage('u2', message, 'u1');
    setMessage('');
    store.addNotification(`Doctor Wilson sent a clinical note: "${message.substring(0, 30)}..."`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-100 pb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Clinician</h1>
          <p className="text-slate-400 font-bold italic mt-3 text-lg">Logged in as {doctor?.name}</p>
        </div>
        <div className="flex bg-indigo-50 px-6 py-4 rounded-[32px] border-2 border-indigo-100 items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">R</div>
           <div>
             <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none">Open Referrals</p>
             <p className="text-3xl font-black text-indigo-700 leading-none mt-1">{state.referrals.length}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-8">
          <h2 className="text-2xl font-black flex items-center gap-4 text-slate-800">
            <div className="w-10 h-10 bg-indigo-100 rounded-[14px] flex items-center justify-center">
              <SvgIcons.Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            Pending Confirmation
          </h2>
          <div className="space-y-6">
            {appts.map(appt => (
              <div key={appt.id} className="bg-white p-8 rounded-[40px] border-2 border-slate-50 shadow-sm space-y-6 hover:border-indigo-100 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-none mb-2">{appt.patientName}</h3>
                    <p className="text-base font-bold text-slate-400">
                      {new Date(appt.datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(appt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">New</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    onClick={() => store.confirmAppt(appt.id)}
                    className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-base shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Confirm Visit
                  </button>
                  <button className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black text-base hover:bg-slate-100 transition-all active:scale-95">
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
            {appts.length === 0 && (
              <div className="text-center py-32 bg-slate-100/50 rounded-[50px] border-4 border-dashed border-slate-200">
                <p className="text-slate-300 font-black italic text-xl">All slots verified.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-black flex items-center gap-4 text-slate-800">
            <div className="w-10 h-10 bg-amber-100 rounded-[14px] flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            Clinical Feed
          </h2>
          <div className="bg-white p-8 rounded-[44px] border-2 border-slate-50 shadow-sm space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Secure Message to Nurses</label>
               <textarea 
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Enter clinical observations or care requests..." 
                 className="w-full h-48 p-6 bg-slate-50 rounded-[32px] border-none focus:ring-4 focus:ring-indigo-100 outline-none resize-none font-medium text-slate-700 placeholder:text-slate-300 text-lg shadow-inner transition-all"
               />
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all active:scale-[0.97]"
            >
              Post Note
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorView;
