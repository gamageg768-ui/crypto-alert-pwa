// components/AlertList.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice, timeAgo, cn } from '@/lib/utils';
import type { AlertWithLogs } from '@/types';

const ALERT_ICONS: Record<string, string> = {
  PRICE_ABOVE:         '📈',
  PRICE_BELOW:         '📉',
  PERCENT_CHANGE_UP:   '🚀',
  PERCENT_CHANGE_DOWN: '💥',
};

const ALERT_LABELS: Record<string, string> = {
  PRICE_ABOVE:         'Above',
  PRICE_BELOW:         'Below',
  PERCENT_CHANGE_UP:   '% Up ≥',
  PERCENT_CHANGE_DOWN: '% Down ≥',
};

interface Props {
  alerts: AlertWithLogs[];
}

export default function AlertList({ alerts }: Props) {
  const router = useRouter();
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleActive = async (id: string, isActive: boolean) => {
    setToggling(id);
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
    setToggling(null);
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('Delete this alert?')) return;
    setDeleting(id);
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    router.refresh();
    setDeleting(null);
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <span className="text-4xl">🔔</span>
        <p className="text-gray-500 mt-3">No alerts yet. Create your first alert above.</p>
      </div>
    );
  }

  const active    = alerts.filter(a => a.isActive && !a.triggered);
  const triggered = alerts.filter(a => a.triggered);
  const inactive  = alerts.filter(a => !a.isActive);

  const renderGroup = (title: string, items: AlertWithLogs[], emptyMsg?: string) => (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">
        {items.length === 0 && emptyMsg && (
          <p className="text-sm text-gray-400 pl-1">{emptyMsg}</p>
        )}
        {items.map(alert => (
          <div key={alert.id}
            className={cn('bg-white border rounded-xl overflow-hidden',
              alert.triggered ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
            )}
          >
            <div className="flex items-center gap-4 p-4">
              {/* Icon + info */}
              <span className="text-2xl">{ALERT_ICONS[alert.alertType]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{alert.symbol}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    alert.assetType === 'CRYPTO' ? 'badge-crypto' : 'badge-stock'
                  )}>
                    {alert.assetType}
                  </span>
                  {alert.triggered && (
                    <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      ✅ Triggered
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {ALERT_LABELS[alert.alertType]}{' '}
                  <span className="font-medium text-gray-900">
                    {alert.alertType.startsWith('PERCENT')
                      ? `${alert.threshold}%`
                      : formatPrice(alert.threshold)}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Created {timeAgo(alert.createdAt)}
                  {alert.triggeredAt && ` · Triggered ${timeAgo(alert.triggeredAt)}`}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {alert.alertTriggerLogs.length > 0 && (
                  <button
                    onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                    className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 bg-purple-50 px-2 py-1.5 rounded-lg"
                  >
                    {expanded === alert.id ? '▲ Hide' : `🤖 AI (${alert.alertTriggerLogs.length})`}
                  </button>
                )}
                <button
                  onClick={() => toggleActive(alert.id, alert.isActive)}
                  disabled={toggling === alert.id}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border font-medium transition',
                    alert.isActive
                      ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  )}
                >
                  {toggling === alert.id ? '…' : alert.isActive ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  disabled={deleting === alert.id}
                  className="btn-danger"
                >
                  {deleting === alert.id ? '…' : '🗑'}
                </button>
              </div>
            </div>

            {/* AI Analysis Panel */}
            {expanded === alert.id && alert.alertTriggerLogs.length > 0 && (
              <div className="border-t border-gray-100 bg-purple-50/50 p-4 space-y-3">
                {alert.alertTriggerLogs.map(log => (
                  <div key={log.id} className="bg-white border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-700">
                        🤖 Groq AI Analysis
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(log.triggeredAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{log.aiAnalysis ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Price at trigger: {formatPrice(log.priceAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {renderGroup(`🟢 Active (${active.length})`, active)}
      {triggered.length > 0 && renderGroup(`✅ Triggered (${triggered.length})`, triggered)}
      {inactive.length > 0 && renderGroup(`⏸ Paused (${inactive.length})`, inactive)}
    </div>
  );
}
