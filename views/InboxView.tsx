
import React from 'react';
import { store } from '../db';

const InboxView: React.FC = () => {
  const { notifications } = store.getState();

  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-10">
      <header className="flex justify-between items-end border-b border-slate-200 pb-8 sticky top-0 bg-slate-50 z-10">
        <div className="space-y-1">
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Event Stream</h1>
           <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em] leading-none">Operational Logs & Alerts</p>
        </div>
        <button 
          onClick={() => {
            notifications.forEach(n => store.markNotificationRead(n.id));
          }}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm"
        >
          Acknowledge All
        </button>
      </header>
      
      <div className="medical-card overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <span>Event Content</span>
           <span>Metadata</span>
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => store.markNotificationRead(n.id)}
              className={`p-6 transition-all cursor-pointer group flex justify-between gap-8 items-start ${
                n.status === 'unread' ? 'bg-blue-50/30' : 'bg-white'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.status === 'unread' ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
                <div>
                  <p className={`text-sm font-medium leading-relaxed ${n.status === 'unread' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                    {n.message}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                   {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">System Record</span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-40 opacity-30">
              <p className="text-xs font-bold uppercase tracking-[0.3em]">Operational Stream Empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxView;
