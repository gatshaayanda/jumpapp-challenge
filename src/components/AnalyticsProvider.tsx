// src/components/AnalyticsProvider.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAnalyticsClient } from '@/utils/firebaseConfig';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    let mounted = true;
    getAnalyticsClient().then((analytics) => {
      if (mounted && analytics) {
        // cast to any so TS lets us call logEvent
        ;(analytics as any).logEvent('screen_view', { screen_name: path });
      }
    });
    return () => {
      mounted = false;
    };
  }, [path]);

  return <>{children}</>;
}
