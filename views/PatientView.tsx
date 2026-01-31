
import React, { useState } from 'react';
import { store } from '../db';
import { ApptStatus, TransportStatus } from '../types';
import { SvgIcons } from '../constants';

const PatientView: React.FC = () => {
  const state = store.getState();
  const patient = state.patients[0]; // Simulation: Margaret Smith
  const activeAppts = state.appointments.filter(a => 
    a.patientId === patient.id && 
    (a.status === ApptStatus.SCHEDULED || a.status === ApptStatus.CONFIRMED)
  );
  
  const nextRide = state.transportRequests.find(t => 
    t.patientId === patient.id && 
    t.status !== TransportStatus.COMPLETED && 
    t.status !== TransportStatus.FAILED
  );
  
  const [requestStatus, setRequestStatus] = useState<'idle' | 'calling' | 'help_requested' | 'support_requested' | 'success'>('idle');

  const handleCancelAppt = (id: string) => {
    store.removeAppointment(patient.name);
    setRequestStatus('success');
    setTimeout(() => setRequestStatus('idle'), 3000);
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
    <div className="max-w-xl mx-auto space-y-6 p-4 md:p-8">
      <header className="flex justify-between items-center mb-4">
        <div className="space-y-0">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Your Dashboard</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Hi, {patient.name.split(' ')[0]}</h1>
        </div>
        <div className="w-16 h-16 bg-slate-900 shadow-2xl rounded-[24px] flex items-center justify-center text-white font-black text-2xl border-4 border-white rotate-3">
          {patient.name.charAt(0)}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Active Care Visits</h2>
        {activeAppts.map(appt => (
          <div key={appt.id} className="bg-white p-8 rounded-[44px] shadow-2xl border-4 border-slate-50 space-y-8 overflow-hidden relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px]">
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />
                Next Appointment
              </div>
              <span className="text-[9px] font-black px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full uppercase tracking-widest">
                {appt.status}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{appt.location}</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 text-slate-400">
                  <SvgIcons.Calendar className="w-6 h-6 opacity-40" />
                  <p className="text-xl font-bold tracking-tight text-slate-600">
                    {new Date(appt.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-slate-900">
                  <SvgIcons.Clock className="w-6 h-6 text-indigo-600" />
                  <p className="text-2xl font-black uppercase tracking-tighter">
                    {new Date(appt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {appt.status === ApptStatus.SCHEDULED ? (
                  <button 
                    onClick={() => store.confirmAppt(appt.id)}
                    className="bg-indigo-600 text-white py-6 rounded-[28px] font-black text-base shadow-xl active:scale-95 transition-all"
                  >
                    Confirm Visit
                  </button>
                ) : (
                  <div className="bg-emerald-50 text-emerald-600 py-6 rounded-[28px] font-black text-base flex items-center justify-center gap-2 border-2 border-dashed border-emerald-200">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path></svg>
                     Verified
                  </div>
                )}
                
                <button 
                  onClick={() => store.requestRide(patient.id, appt.id)}
                  disabled={!!nextRide}
                  className={`py-6 rounded-[28px] font-black text-base transition-all active:scale-95 ${nextRide ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 border-dashed' : 'bg-slate-900 text-white shadow-xl'}`}
                >
                  {nextRide ? 'Ride Booked' : 'Request Ride'}
                </button>
              </div>
              <button 
                onClick={() => handleCancelAppt(appt.id)}
                className="w-full py-4 text-slate-300 font-bold text-sm uppercase tracking-widest hover:text-rose-500 transition-colors"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        ))}
        {activeAppts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
             <p className="text-slate-300 font-black italic text-xl">No visits scheduled.</p>
          </div>
        )}
      </section>

      {nextRide && (
        <section className="bg-indigo-600 text-white p-10 rounded-[44px] space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-3 text-indigo-300 font-black tracking-widest uppercase text-[10px]">
            <SvgIcons.Car className="w-5 h-5" />
            Ride Progress
          </div>
          <div className="flex justify-between items-center gap-6">
            <div>
              <h2 className="text-3xl font-black leading-tight tracking-tighter italic">
                {nextRide.driverName || 'Finding Driver...'}
              </h2>
              <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full inline-block mt-2">
                Status: {nextRide.status}
              </p>
            </div>
            <button 
              onClick={handleCallDriver}
              className={`h-20 px-8 rounded-[32px] font-black text-base shadow-2xl active:scale-95 transition-all flex items-center justify-center ${requestStatus === 'calling' ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900'}`}
            >
              {requestStatus === 'calling' ? 'Calling...' : 'Call Driver'}
            </button>
          </div>
        </section>
      )}

      <section className="bg-white p-10 rounded-[50px] space-y-8 shadow-2xl border-4 border-slate-50">
        <div className="text-center sm:text-left">
          <h3 className="text-4xl font-black tracking-tighter leading-none italic uppercase">Support</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Immediate care coordination</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleMedicalHelp}
            className={`p-10 rounded-[36px] font-black text-xl transition-all border-4 active:scale-95 flex flex-col items-center gap-4 ${requestStatus === 'help_requested' ? 'bg-rose-500 border-rose-400 text-white' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            {requestStatus === 'help_requested' ? 'ALERTED' : 'Medical Help'}
          </button>
          <button 
            onClick={handlePrivateSupport}
            className={`p-10 rounded-[36px] font-black text-xl transition-all border-4 active:scale-95 flex flex-col items-center gap-4 ${requestStatus === 'support_requested' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            {requestStatus === 'support_requested' ? 'SENT' : 'Private Talk'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default PatientView;
