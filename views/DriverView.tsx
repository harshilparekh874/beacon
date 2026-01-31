
import React, { useState, useEffect } from 'react';
import { store } from '../db';
import { TransportStatus, User } from '../types';

interface DriverViewProps {
  user: User;
}

const DriverView: React.FC<DriverViewProps> = ({ user }) => {
  const [rides, setRides] = useState(store.getState().transportRequests);
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
  };

  const handleCancelRide = (id: string) => {
    store.failRide(id, "Driver unavailable / Emergency");
    setCancellingRideId(null);
  };

  // Only show rides assigned to this driver or pending pickup if appropriate
  const activeRides = rides.filter(r => 
    r.driverId === user.id && 
    r.status !== TransportStatus.COMPLETED && 
    r.status !== TransportStatus.FAILED
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-8 sticky top-0 z-10 shadow-2xl rounded-b-[40px]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Driver Hub</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Institutional Transport</p>
          </div>
          {isOffline && (
            <span className="bg-amber-500 text-slate-900 text-[10px] px-3 py-1 rounded-full font-black animate-pulse">OFFLINE</span>
          )}
        </div>
      </header>

      <main className="p-6 flex-1 space-y-6">
        {activeRides.map(ride => (
          <div key={ride.id} className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200 space-y-4">
            {cancellingRideId === ride.id ? (
              <div className="space-y-4 py-2">
                <h3 className="text-lg font-bold text-rose-600">Cancel this mission?</h3>
                <p className="text-xs text-slate-500">Alerts the care coordination team immediately.</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleCancelRide(ride.id)}
                    className="w-full bg-rose-600 text-white py-3 rounded font-bold text-xs uppercase"
                  >
                    Confirm Cancellation
                  </button>
                  <button 
                    onClick={() => setCancellingRideId(null)}
                    className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                      Pickup: {new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">{store.getState().patients.find(p => p.id === ride.patientId)?.name || 'Patient'}</h3>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-[10px] font-bold uppercase">
                    {ride.status}
                  </span>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-100">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Pickup</p>
                    <p className="text-xs font-semibold text-slate-700">{ride.pickupLocation}</p>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Destination</p>
                    <p className="text-xs font-semibold text-slate-700">{ride.destination}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  {ride.status === TransportStatus.ASSIGNED ? (
                    <button 
                      onClick={() => updateStatus(ride.id, TransportStatus.ACCEPTED)}
                      className="w-full bg-emerald-600 text-white py-3 rounded font-bold text-xs uppercase shadow-sm"
                    >
                      Acknowledge Mission
                    </button>
                  ) : ride.status === TransportStatus.ACCEPTED ? (
                    <button 
                      onClick={() => updateStatus(ride.id, TransportStatus.PICKED_UP)}
                      className="w-full bg-blue-700 text-white py-3 rounded font-bold text-xs uppercase shadow-sm"
                    >
                      Verify Boarding
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateStatus(ride.id, TransportStatus.COMPLETED)}
                      className="w-full bg-slate-900 text-white py-3 rounded font-bold text-xs uppercase shadow-sm"
                    >
                      Verify Drop-off
                    </button>
                  )}
                  <button 
                    onClick={() => setCancellingRideId(ride.id)}
                    className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-rose-600"
                  >
                    Report Issue
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {activeRides.length === 0 && (
          <div className="text-center py-24 opacity-30 font-bold text-xs uppercase tracking-widest italic">
            No active missions assigned.
          </div>
        )}
      </main>

      <footer className="p-6 bg-white border-t border-slate-200">
        <div className="flex justify-between items-center px-4">
           <div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Log</p>
             <p className="text-sm font-bold text-slate-900">4 Completed</p>
           </div>
           <div className="text-right">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reliability</p>
             <p className="text-sm font-bold text-emerald-600">99.4%</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default DriverView;
