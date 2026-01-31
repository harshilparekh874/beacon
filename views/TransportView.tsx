
import React from 'react';
import { store } from '../db';
import { AppState, User, TransportStatus } from '../types';

interface TransportViewProps {
  state: AppState;
  user: User;
}

const TransportView: React.FC<TransportViewProps> = ({ state, user }) => {
  const requests = state.transportRequests;

  const getStatusColor = (status: TransportStatus) => {
    switch (status) {
      case TransportStatus.COMPLETED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case TransportStatus.FAILED: return 'bg-rose-50 text-rose-700 border-rose-200';
      case TransportStatus.PICKED_UP: return 'bg-blue-50 text-blue-700 border-blue-200';
      case TransportStatus.ASSIGNED: return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Logistics</h1>
        <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest">Clearwater Ridge Transportation Fleet Status</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Fleet Active', value: '3 Vehicles', color: 'text-slate-900' },
          { label: 'Pending Pickups', value: requests.filter(r => r.status === TransportStatus.REQUESTED).length, color: 'text-blue-600' },
          { label: 'In Transit', value: requests.filter(r => r.status === TransportStatus.PICKED_UP).length, color: 'text-amber-600' },
          { label: 'Completed Today', value: requests.filter(r => r.status === TransportStatus.COMPLETED).length, color: 'text-emerald-600' }
        ].map((stat, i) => (
          <div key={i} className="medical-card p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="medical-card">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Movement Log</h2>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Destination</th>
              <th>Pickup Time</th>
              <th>Assigned Driver</th>
              <th>Fleet Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(ride => (
              <tr key={ride.id} className="hover:bg-slate-50">
                <td>
                  <p className="font-bold text-slate-900 text-sm">{state.patients.find(p => p.id === ride.patientId)?.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Location: {ride.pickupLocation.split(',')[0]}</p>
                </td>
                <td className="text-xs text-slate-600 font-medium">
                  {ride.destination}
                </td>
                <td className="text-xs font-bold text-blue-800">
                  {new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
                      {ride.driverName?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{ride.driverName || 'UNASSIGNED'}</span>
                  </div>
                </td>
                <td>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${getStatusColor(ride.status)}`}>
                    {ride.status}
                  </span>
                </td>
                <td className="text-right">
                   <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Reassign</button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center opacity-40 italic text-sm">No active movement logs recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransportView;
