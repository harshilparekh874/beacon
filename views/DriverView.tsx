
import React, { useState, useEffect } from 'react';
import { store } from '../db';
import { TransportStatus, User } from '../types';
import TransportView from './TransportView';

interface DriverViewProps {
  user: User;
}

const DriverView: React.FC<DriverViewProps> = ({ user }) => {
  const [rides, setRides] = useState(store.getState().transportRequests);
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'AVAILABLE' | 'FLEET'>('MISSIONS');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cancellingRideId, setCancellingRideId] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const sub = store.subscribe(() => {
      setRides(store.getState().transportRequests);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      sub();
    };
  }, []);

  const updateStatus = (id: string, status: TransportStatus) => {
    store.updateTransportStatus(id, status);
    store.addNotification(`Driver ${user.name} updated ride status to ${status}.`);
  };

  const handleClaimRide = (id: string) => {
    store.claimRide(id, user.id, user.name);
    setActiveTab('MISSIONS');
  };

  const handleCancelRide = (id: string) => {
    store.failRide(id, "Driver reported urgent issue");
    setCancellingRideId(null);
  };

  const activeRides = rides.filter(r => 
    r.driverId === user.id && 
    r.status !== TransportStatus.COMPLETED && 
    r.status !== TransportStatus.FAILED
  );

  const availableRides = rides.filter(r => 
    r.status === TransportStatus.REQUESTED && !r.driverId
  );

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col bg-slate-100 pb-32">
      {/* HUD Header */}
      <header className="bg-slate-900 text-white pt-10 pb-6 px-6 sticky top-0 z-20 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <h1 className="text-2xl font-black tracking-tighter uppercase italic">Operational HUD</h1>
            </div>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest leading-none">Fleet Link Active</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Operator</p>
             <p className="text-sm font-bold uppercase">{user.name}</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 gap-1">
          <button 
            onClick={() => setActiveTab('MISSIONS')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all ${activeTab === 'MISSIONS' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            My Missions ({activeRides.length})
          </button>
          <button 
            onClick={() => setActiveTab('AVAILABLE')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all relative ${activeTab === 'AVAILABLE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Available Board
            {availableRides.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-slate-900 animate-bounce">
                {availableRides.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('FLEET')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all ${activeTab === 'FLEET' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            Fleet Logs
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {activeTab === 'MISSIONS' && (
          <div className="space-y-6">
            {activeRides.map(ride => (
              <div key={ride.id} className="bg-white rounded-3xl overflow-hidden shadow-xl border-t-4 border-t-blue-600">
                {cancellingRideId === ride.id ? (
                  <div className="p-8 space-y-6 text-center">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase italic">Confirm SOS Report?</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">This will alert Clearwater Control and cancel your current mission.</p>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleCancelRide(ride.id)}
                        className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200"
                      >
                        Abort Mission
                      </button>
                      <button 
                        onClick={() => setCancellingRideId(null)}
                        className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {ride.status}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Pickup</p>
                        <p className="text-xl font-black text-slate-900">
                          {new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full border-2 border-slate-900" />
                          <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                          <div className="w-3 h-3 bg-blue-600 rotate-45" />
                        </div>
                        <div className="flex-1 space-y-6">
                           <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Passenger</p>
                             <p className="text-2xl font-black text-slate-900">{store.getState().patients.find(p => p.id === ride.patientId)?.name || 'Patient'}</p>
                             <p className="text-sm font-bold text-slate-600 mt-1">{ride.pickupLocation}</p>
                           </div>
                           <div className="pt-2">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Destination</p>
                             <p className="text-xl font-black text-slate-900">{ride.destination}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {ride.status === TransportStatus.ASSIGNED ? (
                        <button 
                          onClick={() => updateStatus(ride.id, TransportStatus.ACCEPTED)}
                          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg uppercase shadow-xl active:scale-95 transition-all"
                        >
                          Begin Mission
                        </button>
                      ) : ride.status === TransportStatus.ACCEPTED ? (
                        <button 
                          onClick={() => updateStatus(ride.id, TransportStatus.PICKED_UP)}
                          className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-lg uppercase shadow-xl active:scale-95 transition-all"
                        >
                          Confirm Boarding
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(ride.id, TransportStatus.COMPLETED)}
                          className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-lg uppercase shadow-xl active:scale-95 transition-all"
                        >
                          Finalize Drop-off
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setCancellingRideId(ride.id)}
                        className="w-full py-3 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] border border-rose-100 rounded-xl hover:bg-rose-50"
                      >
                        Report Operational Hazard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {activeRides.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mb-6">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] italic">No Assigned Missions</p>
                <button 
                  onClick={() => setActiveTab('AVAILABLE')}
                  className="mt-4 text-blue-600 font-bold uppercase text-[10px] tracking-widest border-b border-blue-200"
                >
                  Check Available Board
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'AVAILABLE' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black uppercase italic tracking-wider mb-4">Unassigned Pickups</h3>
                <div className="space-y-4">
                  {availableRides.map(ride => (
                    <div key={ride.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                           <p className="text-sm font-black text-slate-900">
                             {store.getState().patients.find(p => p.id === ride.patientId)?.name}
                           </p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[200px]">From: {ride.pickupLocation}</p>
                        <p className="text-[10px] text-blue-600 font-black uppercase mt-1">ASAP • {ride.destination}</p>
                      </div>
                      <button 
                        onClick={() => handleClaimRide(ride.id)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg"
                      >
                        Claim
                      </button>
                    </div>
                  ))}
                  {availableRides.length === 0 && (
                    <div className="py-20 text-center opacity-30 italic text-xs">No pending requests from the care team.</div>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'FLEET' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-500">
               <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Fleet Intelligence</p>
               <h3 className="text-xl font-black italic uppercase">Live Logistics Matrix</h3>
            </div>
            <TransportView state={store.getState()} user={user} />
          </div>
        )}
      </main>

      {/* Floating Offline Alert */}
      {isOffline && (
        <div className="fixed bottom-24 left-6 right-6 z-50">
          <div className="bg-amber-500 text-slate-900 px-6 py-3 rounded-full font-black text-center shadow-2xl flex items-center justify-center gap-2">
             <div className="w-2 h-2 rounded-full bg-white animate-ping" />
             <span className="text-[10px] uppercase tracking-widest">Network Interrupted • Local Sync Mode Active</span>
          </div>
        </div>
      )}

      {/* Driver Footer Bar */}
      <footer className="bg-white border-t border-slate-200 p-6 fixed bottom-0 left-0 right-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
           <div className="flex gap-8">
             <div>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Shift Status</p>
               <p className="text-sm font-black text-emerald-600">ON DUTY</p>
             </div>
             <div>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Completed Today</p>
               <p className="text-sm font-black text-slate-900">{rides.filter(r => r.driverId === user.id && r.status === TransportStatus.COMPLETED).length}</p>
             </div>
           </div>
           <div className="text-right">
             <div className="flex items-center gap-2 justify-end">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Auth: {user.name.split(' ')[0]}</p>
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Clinical Data Link v4</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default DriverView;
