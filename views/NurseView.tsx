
import React, { useState } from 'react';
import { store } from '../db';
import { ApptStatus, TaskPriority } from '../types';
import { COLORS } from '../constants';

const NurseView: React.FC = () => {
  const state = store.getState();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REFERRALS' | 'PATIENTS'>('OVERVIEW');

  const pendingTasks = state.tasks.filter(t => t.status === 'PENDING');
  const missedAppts = state.appointments.filter(a => a.status === ApptStatus.MISSED);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Operations Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">Institutional Oversight • {new Date().toDateString()}</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded">
          {(['OVERVIEW', 'REFERRALS', 'PATIENTS'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === tab ? 'bg-white shadow-sm text-blue-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: Priority Tasks */}
          <div className="lg:col-span-4 medical-card flex flex-col h-[750px] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Urgent Care Tasks</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {pendingTasks.map(task => (
                <div key={task.id} className="p-4 border border-slate-100 hover:bg-slate-50 transition-colors rounded">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{task.title}</h3>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${COLORS.risk[task.priority === TaskPriority.URGENT ? 'HIGH' : 'LOW']}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Due: {task.dueDate}</span>
                    <button 
                      onClick={() => store.resolveTask(task.id)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline uppercase tracking-widest"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Access Alerts */}
          <div className="lg:col-span-4 medical-card flex flex-col h-[750px] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Access Alerts</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {missedAppts.map(appt => (
                <div key={appt.id} className="p-4 border-l-4 border-l-rose-600 border border-slate-200 bg-white">
                  <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Missed Appointment Trigger</p>
                  <h3 className="font-bold text-slate-900 text-sm">{appt.patientName}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase font-medium">{appt.location}</p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button 
                      onClick={() => store.rescheduleOneWeek(appt.id)}
                      className="bg-slate-800 text-white py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700"
                    >
                      Reschedule
                    </button>
                    <button className="bg-white border border-slate-200 text-slate-600 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">
                      View Chart
                    </button>
                  </div>
                </div>
              ))}
              {missedAppts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-25">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-300 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No Active Alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Logistics & Census */}
          <div className="lg:col-span-4 medical-card flex flex-col h-[750px] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transportation Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.transportRequests.slice(0, 15).map(ride => (
                    <tr key={ride.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-bold text-slate-700 text-xs">{state.patients.find(p => p.id === ride.patientId)?.name.split(' ')[0]}</td>
                      <td className="text-slate-500 text-[10px]">{ride.driverName || 'UNASSIGNED'}</td>
                      <td>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${ride.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {ride.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'REFERRALS' && (
        <div className="medical-card">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Specialty</th>
                <th>Provider</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.referrals.map(ref => (
                <tr key={ref.id} className="hover:bg-slate-50">
                  <td className="text-[10px] font-bold text-slate-400">{ref.requestedDate}</td>
                  <td className="font-bold text-slate-800">{state.patients.find(p => p.id === ref.patientId)?.name}</td>
                  <td className="text-blue-800 font-bold text-xs uppercase tracking-wider">{ref.specialty}</td>
                  <td className="text-slate-600 text-xs">{ref.provider}</td>
                  <td>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${COLORS.risk[ref.urgency]}`}>
                      {ref.urgency}
                    </span>
                  </td>
                  <td>
                    <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'PATIENTS' && (
        <div className="medical-card">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>D.O.B</th>
                <th>Address Area</th>
                <th>Risk Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="font-bold text-slate-800">{p.name}</td>
                  <td className="text-slate-500 text-xs">{p.dob}</td>
                  <td className="text-slate-500 text-xs">{p.address.split(',')[0]}</td>
                  <td>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${COLORS.risk[p.riskLevel]}`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td>
                    <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Full Chart</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NurseView;
