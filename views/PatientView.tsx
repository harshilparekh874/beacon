
import React, { useState } from 'react';
import { store, formatClinicalTime, formatClinicalDate } from '../db';
import { ApptStatus, TransportStatus, User, AppState } from '../types';

interface PatientViewProps {
  user: User;
  state: AppState;
}

const PatientView: React.FC<PatientViewProps> = ({ user, state }) => {
  const patient = state.patients.find(p => p.id === user.patientId) || state.patients[0];
  
  const activeAppts = state.appointments.filter(a => 
    a.patientId === patient.id && 
    (a.status === ApptStatus.SCHEDULED || a.status === ApptStatus.CONFIRMED)
  );
  
  const activeRides = state.transportRequests.filter(t => 
    t.patientId === patient.id && 
    t.status !== TransportStatus.COMPLETED && 
    t.status !== TransportStatus.FAILED
  );
  
  const nextRide = activeRides.find(r => r.isEmergency) || activeRides[0];
  const isEmergencyActive = nextRide?.isEmergency;
  
  const [requestStatus, setRequestStatus] = useState<'idle' | 'calling' | 'help_requested' | 'ride_requested'>('idle');

  const handleRequestRide = () => {
    store.requestRide(patient.id);
    setRequestStatus('ride_requested');
    setTimeout(() => setRequestStatus('idle'), 3000);
  };

  const handleResolveEmergency = () => {
    store.resolveEmergency(patient.id);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 senior-mode pb-40">
      <header className="border-b-2 border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Beacon Patient Care</h1>
          <p className="text-slate-500 font-medium mt-2">Personal Care Record • {patient.name}</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beacon ID</p>
          <p className="text-lg font-bold text-slate-900">#BC-{patient.id.toUpperCase()}</p>
        </div>
      </header>

      {isEmergencyActive && (
        <div className="bg-rose-600 text-white p-8 rounded-2xl shadow-2xl animate-pulse flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-rose-300">
           <div className="text-center md:text-left">
             <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Emergency Help En Route</h2>
             <p className="text-rose-100 font-bold mt-1 text-lg">Help is on the way to {patient.address.split(',')[0]}. Stay calm.</p>
           </div>
           <div className="flex gap-4">
             <div className="bg-white text-rose-600 px-6 py-4 rounded-xl font-black text-xl uppercase shadow-lg">
               EST 4-6 MIN
             </div>
             <button 
               onClick={handleResolveEmergency}
               className="bg-rose-900 text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-black transition-colors"
             >
               Help Arrived
             </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-8 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Scheduled Services</h2>
          </div>
          
          {activeAppts.map(appt => (
            <div key={appt.id} className="medical-card border-2 border-slate-200 overflow-hidden shadow-lg bg-white">
              <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-black">{appt.status}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Record ID: {appt.id}</span>
              </div>
              <div className="p-8">
                <div className="mb-8 border-l-4 border-l-amber-500 pl-6">
                  <h3 className="text-3xl font-bold text-slate-900 italic">{appt.location}</h3>
                  <p className="text-slate-500 text-xl font-medium mt-1 uppercase tracking-tight">Provider: {appt.provider}</p>
                </div>
                
                {/* LARGE TIME DISPLAY */}
                <div className="bg-slate-50 p-10 rounded-2xl border border-slate-200 mb-8 flex flex-col items-center justify-center text-center shadow-inner">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Your Arrival Time</p>
                    <p className="text-7xl font-black text-amber-700 tracking-tighter tabular-nums drop-shadow-sm leading-none">
                      {formatClinicalTime(appt.datetime)}
                    </p>
                    <p className="text-xl font-bold text-slate-500 mt-4 uppercase tracking-widest">
                      {formatClinicalDate(appt.datetime)}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => store.confirmAppt(appt.id)}
                    className="bg-slate-900 text-white py-5 px-6 rounded font-black text-lg hover:bg-slate-800 transition-colors shadow-md uppercase tracking-widest"
                  >
                    Confirm Visit
                  </button>
                  <button 
                    onClick={() => store.requestRide(patient.id, appt.id)}
                    className={`py-5 px-6 rounded font-black text-lg border-2 transition-colors uppercase tracking-widest ${nextRide ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-800 hover:bg-slate-50'}`}
                  >
                    {nextRide ? 'Fleet Dispatched' : 'Beacon Pickup'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {activeAppts.length === 0 && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded p-12 text-center shadow-inner">
              <p className="text-slate-400 font-medium italic text-lg mb-8 uppercase tracking-widest opacity-60">No Clinical Visits Found</p>
              <button 
                 onClick={handleRequestRide}
                 className="bg-amber-600 text-white px-8 py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all beacon-glow"
              >
                {requestStatus === 'ride_requested' ? 'Fleet Notified!' : 'Request Beacon Fleet Now'}
              </button>
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8">
             <h3 className="text-indigo-900 font-black italic mb-2 uppercase tracking-tight">Crisis Assistance</h3>
             <p className="text-sm text-slate-600 mb-6 font-medium">If you are in immediate distress or need to talk, clinical resources are available 24/7.</p>
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-widest">National Crisis Line:</span>
                <span className="text-4xl font-black text-indigo-900 tracking-tighter tabular-nums drop-shadow-sm">DIAL 988</span>
             </div>
          </div>
        </section>

        <div className="lg:col-span-5 space-y-12">
          {nextRide && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-slate-900 rounded-full" />
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Fleet Status</h2>
              </div>
              <div className={`rounded-lg p-8 shadow-2xl border-b-8 transition-colors ${isEmergencyActive ? 'bg-rose-900 border-rose-500 text-white' : 'bg-slate-900 border-amber-500 text-white'}`}>
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isEmergencyActive ? 'text-rose-300' : 'text-amber-400'}`}>
                       {isEmergencyActive ? 'Emergency Dispatch' : 'Operator Assigned'}
                     </p>
                     <h3 className="text-2xl font-black mt-1 leading-tight italic uppercase">{nextRide.driverName || 'Manifesting Unit...'}</h3>
                   </div>
                   <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${isEmergencyActive ? 'bg-rose-700 text-rose-100 border-rose-500 animate-pulse' : 'bg-amber-500 text-slate-900 border-amber-400'}`}>
                     {nextRide.status}
                   </span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-4 items-center opacity-80 border-b border-white/10 pb-2">
                    <div className={`w-2 h-2 rounded-full ${isEmergencyActive ? 'bg-rose-400' : 'bg-amber-400'}`} />
                    <p className="text-xs font-bold uppercase tracking-tight">Origin: {nextRide.pickupLocation}</p>
                  </div>
                  <div className="flex gap-4 items-center opacity-80">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-tight">Dest: {nextRide.destination}</p>
                  </div>
                </div>
                {nextRide.driverName ? (
                  <button 
                    onClick={() => store.callDriver(nextRide.id)}
                    className="w-full bg-white text-slate-900 py-4 rounded font-black text-sm hover:bg-slate-100 transition-colors uppercase tracking-widest shadow-lg"
                  >
                    Call {isEmergencyActive ? 'Emergency Unit' : 'Fleet Dispatch'}
                  </button>
                ) : (
                  <div className="text-center p-6 border border-white/20 rounded bg-white/5 animate-pulse">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Beacon unit dispatch in progress.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-rose-600 rounded-full" />
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Urgent Support</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { store.requestMedicalHelp(patient.id); setRequestStatus('help_requested'); }}
                className={`p-10 rounded border-2 text-center transition-all ${requestStatus === 'help_requested' || isEmergencyActive ? 'bg-rose-700 border-rose-700 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-200 text-rose-600 hover:border-rose-300 shadow-sm'}`}
              >
                <p className="text-4xl font-black mb-2 uppercase italic">{isEmergencyActive ? 'HELP COMING' : 'Request SOS'}</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60 italic">{isEmergencyActive ? 'Unit Dispatched' : 'Clinical Support Required'}</p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientView;
