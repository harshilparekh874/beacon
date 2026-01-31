
import React from 'react';
import { store } from '../db';

const InboxView: React.FC = () => {
  const { notifications } = store.getState();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-end sticky top-0 bg-slate-50/90 backdrop-blur-xl py-6 z-10 -mx-4 px-4 md:-mx-10 md:px-10 border-b border-slate-100">
        <div className="space-y-1">
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">Inbox</h1>
           <p className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.3em] ml-1">Coordination Stream</p>
        </div>
        <button 
          onClick={() => {
            notifications.forEach(n => store.markNotificationRead(n.id));
          }}
          className="bg-white border-2 border-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-50 transition-all active:scale-[0.95] shadow-sm"
        >
          Read All
        </button>
      </header>
      
      <div className="space-y-6 md:space-y-8">
        {notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => store.markNotificationRead(n.id)}
            className={`p-7 md:p-10 rounded-[44px] md:rounded-[56px] border-4 transition-all cursor-pointer group shadow-sm active:scale-[0.98] relative overflow-hidden ${
              n.status === 'unread' 
                ? 'bg-white border-indigo-100 ring-[12px] ring-indigo-50/50 shadow-2xl shadow-indigo-100' 
                : 'bg-white/60 border-slate-50 hover:border-slate-200 opacity-60 grayscale-[0.4]'
            }`}
          >
            {n.status === 'unread' && (
              <div className="absolute top-0 right-0 p-6">
                 <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full animate-ping opacity-75" />
                 <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full absolute top-6 right-6" />
              </div>
            )}
            <div className="flex justify-between items-start mb-6 gap-8">
              <p className={`font-black text-xl md:text-3xl leading-[1.1] flex-1 tracking-tight ${n.status === 'unread' ? 'text-slate-900' : 'text-slate-500'}`}>
                {n.message}
              </p>
              <div className="flex flex-col items-end shrink-0 pt-1.5">
                 <span className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">
                   {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 <span className="text-[9px] text-slate-300 font-bold uppercase mt-1 tracking-tighter">System Alert</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm transition-colors ${n.status === 'unread' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {n.status === 'unread' ? 'New Event' : 'Archived'}
              </div>
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] text-slate-200 font-black uppercase tracking-widest">Clearwater Ops</span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-48 text-slate-300 flex flex-col items-center animate-in zoom-in-95 duration-1000">
            <div className="w-32 h-32 bg-slate-100 rounded-[48px] flex items-center justify-center mb-10 rotate-12 shadow-inner">
              <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m4.5 10l.5-2h4l.5 2h-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path></svg>
            </div>
            <p className="text-4xl font-black text-slate-200 tracking-tighter italic opacity-50">Stream Quiet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
