'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAlerts } from '@/app/alerts/actions';

const POLL_MS = 15_000;

export default function AlertPoller() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const result = await checkAlerts();
        if (active && 'triggered' in result && (result.triggered ?? 0) > 0) {
          router.refresh();
        }
      } catch {
        // silently ignore polling errors
      }
    };

    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [router]);

  return null;
}
