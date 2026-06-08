// components/WebhookManager.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo, cn } from '@/lib/utils';
import type { WebhookWithDeliveries, CreateWebhookInput, WebhookEvent } from '@/types';

interface Props {
  webhooks: WebhookWithDeliveries[];
}

const EVENT_LABELS: Record<WebhookEvent, string> = {
  ALERT_TRIGGERED: '🔔 Alert Triggered',
  PRICE_UPDATE:    '📊 Price Update',
  ALL:             '⚡ All Events',
};

export default function WebhookManager({ webhooks }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [form, setForm] = useState<CreateWebhookInput>({
    name: '',
    url: '',
    secret: '',
    events: ['ALERT_TRIGGERED'],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          secret: form.secret || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create webhook');
      setForm({ name: '', url: '', secret: '', events: ['ALERT_TRIGGERED'] });
      router.refresh();
    } catch {}
    setCreating(false);
  };

  const testWebhook = async (id: string) => {
    setTesting(id);
    const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
    const data = await res.json();
    setTestResult({ id, success: data.success, msg: data.message });
    setTimeout(() => setTestResult(null), 4000);
    setTesting(null);
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    setDeleting(id);
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    router.refresh();
    setDeleting(null);
  };

  const toggleEvent = (evt: WebhookEvent) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(evt)
        ? f.events.filter(e => e !== evt)
        : [...f.events, evt],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-5">🔗 Register Webhook</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                className="input w-full"
                placeholder="My Slack Notifier"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Endpoint URL</label>
              <input
                className="input w-full"
                placeholder="https://hooks.slack.com/..."
                type="url"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Signing Secret (optional — for HMAC-SHA256 verification)
            </label>
            <input
              className="input w-full font-mono"
              placeholder="your-webhook-secret"
              value={form.secret}
              onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Events to fire on</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EVENT_LABELS) as [WebhookEvent, string][]).map(([evt, label]) => (
                <button
                  key={evt}
                  type="button"
                  onClick={() => toggleEvent(evt)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border font-medium transition',
                    form.events.includes(evt)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Registering…' : '+ Register Webhook'}
          </button>
        </form>
      </div>

      {/* Webhook list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Registered Webhooks ({webhooks.length})
        </h2>

        {webhooks.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <span className="text-4xl">🔗</span>
            <p className="text-gray-500 mt-3">No webhooks registered yet.</p>
          </div>
        )}

        {webhooks.map(wh => (
          <div key={wh.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-start gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{wh.name}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    wh.isActive
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  )}>
                    {wh.isActive ? '● Active' : '○ Inactive'}
                  </span>
                  {wh.failCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                      {wh.failCount} failures
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 font-mono truncate mt-1">{wh.url}</p>

                <div className="flex flex-wrap gap-1 mt-2">
                  {wh.events.map(e => (
                    <span key={e} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                      {EVENT_LABELS[e as WebhookEvent] ?? e}
                    </span>
                  ))}
                </div>

                {wh.lastFired && (
                  <p className="text-xs text-gray-400 mt-1">Last fired {timeAgo(wh.lastFired)}</p>
                )}

                {/* Recent deliveries */}
                {wh.deliveries.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {wh.deliveries.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{d.success ? '✅' : '❌'}</span>
                        <span>{d.event}</span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded font-mono',
                          d.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        )}>
                          {d.statusCode ?? 'ERR'}
                        </span>
                        <span className="text-gray-400">{timeAgo(d.deliveredAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => testWebhook(wh.id)}
                  disabled={testing === wh.id}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"
                >
                  {testing === wh.id ? '⏳' : '▶ Test'}
                </button>
                <button
                  onClick={() => deleteWebhook(wh.id)}
                  disabled={deleting === wh.id}
                  className="btn-danger"
                >
                  {deleting === wh.id ? '…' : '🗑'}
                </button>
              </div>
            </div>

            {/* Test result banner */}
            {testResult?.id === wh.id && (
              <div className={cn(
                'px-5 py-2 text-sm border-t',
                testResult.success
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              )}>
                {testResult.msg}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Docs */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3">📖 Webhook Payload Format</h3>
        <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
{`POST https://your-endpoint.com/hook
Content-Type: application/json
X-Alert-Signature: hmac-sha256-signature
X-Alert-Event: ALERT_TRIGGERED
X-Alert-Timestamp: 2024-01-01T00:00:00Z

{
  "event": "ALERT_TRIGGERED",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "symbol": "BTC",
    "assetType": "CRYPTO",
    "alertType": "PRICE_ABOVE",
    "threshold": 70000,
    "currentPrice": 70250.50,
    "change24h": 2.34,
    "aiAnalysis": "BTC breaking above...",
    "triggeredAt": "2024-01-01T00:00:00.000Z"
  }
}`}
        </pre>
      </div>
    </div>
  );
}
