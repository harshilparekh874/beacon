
import React, { useState } from 'react';
import { store } from '../db';
import { RiskLevel, ApptStatus, TaskPriority } from '../types';
import { COLORS, SvgIcons } from '../constants';

const NurseView: React.FC = () => {
  const state = store.getState();
  const [activeTab, setActiveTab] = useState<'QUEUES' | 'REFERRALS'>('QUEUES');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const missedAppts = state.appointments.filter(a => a.status === ApptStatus.MISSED);
  const pendingTasks = state.tasks.filter(t => t.status === 'PENDING');
  const referrals = state.referrals;

  const handleReschedule = (id: string) => {
    store.rescheduleOneWeek(id);
    setReschedulingId(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Ops Command</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Clearwater Ridge Network</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto shadow-inner">
          <button 
            onClick={() => setActiveTab('QUEUES')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs md:text-sm active:scale-95 transition-all ${activeTab === 'QUEUES' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
          >
            Queues
          </button>
          <button 
            onClick={() => setActiveTab('REFERRALS')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs md:text-sm active:scale-95 transition-all ${activeTab === 'REFERRALS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
          >
            Referrals
          </button>
        </div>
      </header>

      {activeTab === 'QUEUES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <section className="bg-white rounded-3xl border border-slate-100 flex flex-col h-[500px] md:h-[700px] overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-rose-50/10">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Tasks</h2>
              <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black">{pendingTasks.length}</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              {pendingTasks.map(task => (
                <div key={task.id} className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl hover:bg-white transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-800 text-sm md:text-base leading-tight pr-2 tracking-tight">{task.title}</h3>
                    <span className={`px-2 py-1 text-[8px] font-black rounded-lg uppercase ${COLORS.risk.HIGH}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100/50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Due {task.dueDate}</span>
                    <button 
                      onClick={() => store.resolveTask(task.id)}
                      className="bg-white text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-xl text-[10px] font-black active:scale-90"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 flex flex-col h-[500px] md:h-[700px] overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-amber-50/10">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Alert Hub</h2>
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black">{missedAppts.length}</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              {missedAppts.map(appt => (
                <div key={appt.id} className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl space-y-4 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                      <SvgIcons.Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-none mb-1 tracking-tight">{appt.patientName}</h3>
                      <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-lg inline-block">Missed visit</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setReschedulingId(appt.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black active:scale-95">Reschedule</button>
                    <button className="flex-1 bg-white border border-slate-200 text-slate-400 py-2 rounded-xl text-[10px] font-black">Notes</button>
                  </div>
                  {reschedulingId === appt.id && (
                    <div className="bg-white p-3 rounded-xl border border-indigo-100 animate-in fade-in zoom-in-95">
                      <p className="text-[10px] font-black mb-2">Reschedule for next week?</p>
                      <button onClick={() => handleReschedule(appt.id)} className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-black">Confirm</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 flex flex-col h-[500px] md:h-[700px] overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-indigo-50/10">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Risk List</h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {state.patients.map(patient => (
                <div key={patient.id} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-sm">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-xs tracking-tight leading-none mb-1">{patient.name}</h3>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${COLORS.risk[patient.riskLevel]}`}>
                        {patient.riskLevel}
                      </span>
                    </div>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 bg-slate-50">
                    <SvgIcons.Calendar className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
          {referrals.map(ref => (
            <div key={ref.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between h-[250px] shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">{state.patients.find(p => p.id === ref.patientId)?.name}</h3>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">{ref.specialty}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${COLORS.risk[ref.urgency]}`}>
                    {ref.urgency}
                  </span>
                </div>
                <p className="text-slate-500 font-bold text-sm leading-tight">{ref.provider}</p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                 <span className="font-black text-indigo-600 text-sm uppercase">{ref.status}</span>
                 <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Process</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseView;
