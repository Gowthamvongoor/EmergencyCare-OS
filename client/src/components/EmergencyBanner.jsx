import React from 'react';
import { AlertTriangle, Siren, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyBanner({ criticalCount = 0, waitingCount = 0 }) {
  if (criticalCount === 0 && waitingCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <div className="flex items-center gap-2 truncate">
          <Siren className="w-4 h-4 shrink-0 text-red-100" />
          <span className="font-bold tracking-wide uppercase text-red-100">Live Hospital Surge:</span>
          <span>
            <strong className="underline decoration-red-200">{criticalCount} Critical Cases</strong> awaiting priority resuscitation &bull; {waitingCount} patients queued in ready/waiting state.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Link
          to="/emergency-queue"
          className="px-3 py-1 bg-white text-red-700 font-semibold rounded-lg shadow-sm hover:bg-red-50 transition text-xs flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          Inspect Queue
        </Link>
      </div>
    </div>
  );
}
