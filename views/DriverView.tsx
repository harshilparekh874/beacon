
import React, { useState, useEffect } from 'react';
import { store } from '../db';
import { TransportStatus } from '../types';
import { SvgIcons } from '../constants';

const DriverView: React.FC = () => {
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

  const activeRides = rides.filter(r => r.status !== TransportStatus.COMPLETED && r.status !== TransportStatus.FAILED);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-8 sticky top-0 z-10 shadow-2xl rounded-b-[40px]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Driver Hub</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Clearwater Volunteers</p>
          </div>
          {isOffline && (
            <span className="bg-amber-500 text-slate-900 text-[10px] px-3 py-1 rounded-full font-black animate-pulse">OFFLINE</span>
          )}
        </div>
      </header>

      <main className="p-6 flex-1 space-y-6">
        {activeRides.map(ride => (
          <div key={ride.id} className="bg-white rounded-[40px] p-8 shadow-sm border-2 border-slate-50 space-y-6 transition-all hover:border-indigo-100 relative overflow-hidden">
            {cancellingRideId === ride.id ? (
              <div className="space-y-6 py-4 animate-in fade-in zoom-in-95">
                <h3 className="text-2xl font-black text-rose-600 leading-tight">Cancel this ride?</h3>
                <p className="text-slate-500 font-bold">This will immediately alert the nurse care team to find a replacement.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleCancelRide(ride.id)}
                    className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-lg"
                  >
                    Confirm Cancellation
                  </button>
                  <button 
                    onClick={() => setCancellingRideId(null)}
                    className="w-full py-2 text-slate-400 font-bold text-sm"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Pickup: {new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h3 className="text-2xl font-black text-slate-900">{store.getState().patients.find(p => p.id === ride.patientId)?.name || 'Patient'}</h3>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {ride.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex gap-4">
                    <div className="w-8 flex flex-col items-center">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
                      <div className="w-0.5 h-12 bg-slate-100" />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full bg-white" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Pickup Address</p>
                        <p className="font-bold text-slate-700 text-lg leading-tight">{ride.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Destination</p>
                        <p className="font-bold text-slate-700 text-lg leading-tight">{ride.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  {ride.status === TransportStatus.REQUESTED || ride.status === TransportStatus.ASSIGNED ? (
                    <button 
                      onClick={() => updateStatus(ride.id, TransportStatus.ACCEPTED)}
                      className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 active:scale-95 transition-all text-lg"
                    >
                      Accept Pickup
                    </button>
                  ) : ride.status === TransportStatus.ACCEPTED ? (
                    <button 
                      onClick={() => updateStatus(ride.id, TransportStatus.PICKED_UP)}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 active:scale-95 transition-all text-lg"
                    >
                      Confirm Passenger On-board
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateStatus(ride.id, TransportStatus.COMPLETED)}
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-lg"
                    >
                      Confirm Drop-off
                    </button>
                  )}
                  <button 
                    onClick={() => setCancellingRideId(ride.id)}
                    className="w-full py-2 text-slate-300 font-bold text-sm hover:text-rose-500 transition-colors"
                  >
                    Cancel / Report Issue
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {activeRides.length === 0 && (
          <div className="text-center py-24 opacity-30 font-black italic">
            No more rides assigned for today.
          </div>
        )}
      </main>

      <footer className="p-6 bg-white border-t border-slate-100 rounded-t-[40px] shadow-2xl">
        <div className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Impact Bonus</p>
            <p className="text-2xl font-black text-slate-900">$120.00</p>
            <p className="text-xs font-bold text-slate-400">12 Care Rides</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Reliability</p>
            <p className="text-2xl font-black text-emerald-600">98%</p>
            <p className="text-xs font-bold text-slate-400">Top Rated</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DriverView;
