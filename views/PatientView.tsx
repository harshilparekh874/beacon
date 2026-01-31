
import React, { useState } from 'react';
import { store } from '../db';
import { ApptStatus, TransportStatus } from '../types';
import { SvgIcons } from '../constants';

const PatientView: React.FC = () => {
  const state = store.getState();
  const patient = state.patients[0]; // Simulation: Logged in as Margaret
  const nextAppt = state.appointments.find(a => a.patientId === patient.id && (a.status === ApptStatus.SCHEDULED || a.status === ApptStatus.CONFIRMED));
  const nextRide = state.transportRequests.find(t => t.patientId === patient.id && t.status !== TransportStatus.COMPLETED && t.status !== TransportStatus.FAILED);
  
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'calling' | 'help_requested' | 'support_requested' | 'success'>('idle');

  const getOneWeekLaterDate = () => {
    if (!nextAppt) return "";
    const current = new Date(nextAppt.datetime);
    const next = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
    return next.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleRescheduleConfirm = () => {
    if (nextAppt) {
      store.rescheduleOneWeek(nextAppt.id);
      setIsRescheduling(false);
      setRequestStatus('success');
      setTimeout(() => setRequestStatus('idle'), 3000);
    }
  };

  const handleMedicalHelp = () => {
    store.requestMedicalHelp(patient.id);
    setRequestStatus('help_requested');
    setTimeout(() => setRequestStatus('idle'), 5000);
  };

  const handlePrivateSupport = () => {
    store.requestPrivateSupport(patient.id);
    setRequestStatus('support_requested');
    setTimeout(() => setRequestStatus('idle'), 5000);
  };

  const handleCallDriver = () => {
    if (nextRide) {
      store.callDriver(nextRide.id);
      setRequestStatus('calling');
      setTimeout(() => setRequestStatus('idle'), 5000);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 p-4 md:p-6">
      <header className="flex justify-between items-center mb-6 px-2">
        <div className="space-y-0">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Your Care Daily</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Hi, {patient.name.split(' ')[0]}</h1>
        </div>
        <div className="w-14 h-14 bg-indigo-600 shadow-xl rounded-2xl flex items-center justify-center text-white font-black text-xl border-4 border-white shrink-0 -rotate-3 transition-all hover:rotate-0">
          {patient.name.charAt(0)}
        </div>
      </header>

      <section className="space-y-4">
        {nextAppt && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 space-y-6 overflow-hidden relative group">
            {!isRescheduling ? (
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px]">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                    Upcoming Visit
                  </div>
                  <span className="text-[9px] font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full uppercase">
                    {nextAppt.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">{nextAppt.location}</h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      <SvgIcons.Calendar className="w-5 h-5 opacity-60" />
                      <p className="text-lg font-bold tracking-tight">
                        {new Date(nextAppt.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-900">
                      <SvgIcons.Clock className="w-5 h-5 text-indigo-600" />
                      <p className="text-xl font-black uppercase tracking-tighter">
                        {new Date(nextAppt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {nextAppt.status === ApptStatus.SCHEDULED ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => store.confirmAppt(nextAppt.id)}
                      className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setIsRescheduling(true)}
                      className="bg-slate-50 text-slate-500 py-4 rounded-2xl font-black text-sm active:scale-95 border border-slate-100"
                    >
                      Reschedule
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-dashed border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path></svg>
                    </div>
                    <p className="text-emerald-900 font-black text-lg tracking-tighter leading-none">Confirmed!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 py-2">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-black text-slate-900 tracking-tighter">Reschedule</h2>
                   <button onClick={() => setIsRescheduling(false)} className="text-[10px] font-black uppercase text-slate-400">Cancel</button>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                  <p className="text-indigo-900 text-lg font-black leading-tight tracking-tighter">Move to next week?</p>
                  <div className="flex items-center gap-3 text-indigo-600">
                    <SvgIcons.Calendar className="w-6 h-6" />
                    <p className="text-xl font-black tracking-tighter">{getOneWeekLaterDate()}</p>
                  </div>
                </div>
                <button 
                  onClick={handleRescheduleConfirm}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
                >
                  Yes, Move It
                </button>
              </div>
            )}
          </div>
        )}

        {nextRide ? (
          <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-3 text-indigo-400 font-black tracking-widest uppercase text-[9px]">
              <SvgIcons.Car className="w-4 h-4" />
              Your Pickup
            </div>
            <div className="flex justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-black leading-tight tracking-tighter">{nextRide.driverName || 'Assigning...'}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                   <p className="text-[10px] font-black text-indigo-100 uppercase tracking-tighter">{nextRide.status}</p>
                </div>
              </div>
              <button 
                onClick={handleCallDriver}
                className={`h-14 px-6 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all ${requestStatus === 'calling' ? 'bg-emerald-500' : 'bg-white text-slate-900'}`}
              >
                {requestStatus === 'calling' ? 'Calling...' : 'Call Driver'}
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => nextAppt && store.requestRide(patient.id, nextAppt.id)}
            className="w-full bg-white border-2 border-dashed border-slate-200 p-8 rounded-3xl text-slate-400 hover:bg-indigo-50/50 hover:border-indigo-100 hover:text-indigo-600 transition-all flex flex-col items-center gap-4 active:scale-95"
          >
            <SvgIcons.Car className="w-10 h-10 opacity-30" />
            <span className="text-xl font-black tracking-tighter">Request a Pickup</span>
          </button>
        )}
      </section>

      <section className="bg-indigo-600 text-white p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
          <div className="text-center sm:text-left">
            <h3 className="text-3xl font-black tracking-tighter leading-none uppercase italic">Support Now</h3>
            <p className="text-indigo-100 text-sm font-bold opacity-80 mt-1">Tap for immediate help</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleMedicalHelp}
              className={`p-6 rounded-2xl font-black text-sm transition-all border-2 active:scale-95 flex flex-col items-center gap-3 ${requestStatus === 'help_requested' ? 'bg-rose-500 border-rose-400' : 'bg-white/10 border-white/20'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {requestStatus === 'help_requested' ? 'Sent!' : 'Medical'}
            </button>
            <button 
              onClick={handlePrivateSupport}
              className={`p-6 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 border-b-4 border-black/10 flex flex-col items-center gap-3 ${requestStatus === 'support_requested' ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-700'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              {requestStatus === 'support_requested' ? 'Sent!' : 'Private'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientView;
