
import React, { useState } from 'react';
import { store } from '../db';
import { ApptStatus, TransportStatus, User, AppState } from '../types';

interface PatientViewProps {
  user: User;
  state: AppState;
}

const formatDateLabel = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
};

const formatTimeLabel = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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
  
  const nextRide = activeRides[0];
  
  const [requestStatus, setRequestStatus] = useState<'idle' | 'calling' | 'help_requested' | 'support_requested' | 'ride_requested'>('idle');

  const handleRequestRide = () => {
    store.requestRide(patient.id);
    setRequestStatus('ride_requested');
    setTimeout(() => setRequestStatus('idle'), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 senior-mode pb-40">
      <header className="border-b-2 border-slate-200 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Patient Clinical Portal</h1>
          <p className="text-slate-500 font-medium mt-2">Active care record for {patient.name}</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Record Number</p>
          <p className="text-lg font-bold text-slate-900">#CR-{patient.id.toUpperCase()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-8 bg-blue-700 rounded-full" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Scheduled Healthcare Visits</h2>
          </div>
          
          {activeAppts.map(appt => (
            <div key={appt.id} className="medical-card border-2 border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">{appt.status}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Record ID: {appt.id}</span>
              </div>
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-slate-900">{appt.location}</h3>
                  <p className="text-slate-500 text-xl font-medium mt-1">Lead Provider: {appt.provider}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 border-y border-slate-100 py-6 mb-8">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Appointment Date</p>
                    <p className="text-2xl font-bold text-slate-800">{formatDateLabel(appt.datetime)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time of Service</p>
                    <p className="text-2xl font-bold text-slate-800">{formatTimeLabel(appt.datetime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => store.confirmAppt(appt.id)}
                    className="bg-blue-800 text-white py-4 px-6 rounded font-bold text-lg hover:bg-blue-900 transition-colors shadow-md"
                  >
                    Confirm Attendance
                  </button>
                  <button 
                    onClick={() => store.requestRide(patient.id, appt.id)}
                    className={`py-4 px-6 rounded font-bold text-lg border-2 transition-colors ${nextRide ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-800 hover:bg-slate-50'}`}
                  >
                    {nextRide ? 'Logistics In Progress' : 'Request Transport'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {activeAppts.length === 0 && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded p-12 text-center">
              <p className="text-slate-400 font-medium italic text-lg">No clinical visits found in the current period.</p>
              <button 
                 onClick={handleRequestRide}
                 className="mt-6 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                {requestStatus === 'ride_requested' ? 'Request Sent!' : 'Request Pickup Now'}
              </button>
            </div>
          )}
        </section>

        <div className="lg:col-span-5 space-y-12">
          {nextRide && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-slate-900 rounded-full" />
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Current Transit</h2>
              </div>
              <div className="bg-slate-900 text-white rounded-lg p-8 shadow-xl border-b-8 border-blue-600">
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Vehicle Link</p>
                     <h3 className="text-2xl font-bold mt-1 leading-tight">{nextRide.driverName || 'Finding Driver...'}</h3>
                   </div>
                   <span className="bg-blue-800/50 text-blue-200 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-700">
                     {nextRide.status}
                   </span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-4 items-center opacity-80">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-sm font-medium">From: {nextRide.pickupLocation}</p>
                  </div>
                  <div className="flex gap-4 items-center opacity-80">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <p className="text-sm font-medium">Dest: {nextRide.destination}</p>
                  </div>
                </div>
                {nextRide.driverName ? (
                  <button 
                    onClick={() => store.callDriver(nextRide.id)}
                    className="w-full bg-white text-slate-900 py-4 rounded font-bold text-sm hover:bg-slate-100 transition-colors uppercase tracking-widest"
                  >
                    Contact Driver
                  </button>
                ) : (
                  <div className="text-center p-4 border border-white/10 rounded bg-white/5">
                     <p className="text-[10px] font-bold uppercase opacity-50">Drivers have been notified of your request.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-rose-600 rounded-full" />
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Care Assistance</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { store.requestMedicalHelp(patient.id); setRequestStatus('help_requested'); }}
                className={`p-10 rounded border-2 text-center transition-all ${requestStatus === 'help_requested' ? 'bg-rose-700 border-rose-700 text-white' : 'bg-white border-slate-200 text-rose-600 hover:border-rose-300 shadow-sm'}`}
              >
                <p className="text-3xl font-bold mb-2 uppercase italic">Emergency</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Instant Clinical Alert</p>
              </button>
              <button 
                onClick={() => { store.requestPrivateSupport(patient.id); setRequestStatus('support_requested'); }}
                className={`p-10 rounded border-2 text-center transition-all ${requestStatus === 'support_requested' ? 'bg-blue-800 border-blue-800 text-white' : 'bg-white border-slate-200 text-blue-800 hover:border-blue-300 shadow-sm'}`}
              >
                <p className="text-3xl font-bold mb-2 uppercase italic">Talk to Team</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Operational Support Request</p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientView;
