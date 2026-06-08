// hooks/useAlerts.ts
'use client';
import { useState, useCallback } from 'react';
import type { AlertWithLogs, CreateAlertInput } from '@/types';

export function useAlerts(initial: AlertWithLogs[]) {
  const [alerts, setAlerts] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState<string | null>(null);

  const createAlert = useCallback(async (input: CreateAlertInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Create failed');
      setAlerts(prev => [{ ...data.alert, alertTriggerLogs: [] }, ...prev]);
      return data.alert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAlert = useCallback(async (id: string, isActive: boolean) => {
    // Optimistic update
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, isActive: !isActive, triggered: isActive ? a.triggered : false } : a)
    );
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!res.ok) {
      // Revert on failure
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive } : a));
    }
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      // Revert — refetch
      const fresh = await fetch('/api/alerts').then(r => r.json());
      setAlerts(fresh.alerts ?? []);
    }
  }, []);

  return { alerts, loading, error, createAlert, toggleAlert, deleteAlert };
}
