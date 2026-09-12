import React, { useEffect, useState } from 'react';
import { ConnectionStatus } from '../../hooks/useSocket';

interface ConnectionBannerProps {
  status: ConnectionStatus;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ status }) => {
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (status === 'connected') {
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 2500);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (status === 'connected' && !showRestored) return null;

  const isOffline = status === 'reconnecting' || status === 'disconnected';

  return (
    <div
      className={`w-full py-1.5 px-4 text-center text-xs font-medium shrink-0 transition-colors duration-200 ${
        isOffline
          ? 'bg-amber-500/10 text-amber-500 border-b border-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-500 border-b border-emerald-500/20'
      }`}
    >
      {status === 'disconnected' && 'Offline — reconnecting...'}
      {status === 'reconnecting' && 'Reconnecting...'}
      {status === 'connected' && showRestored && 'Back online'}
    </div>
  );
};
