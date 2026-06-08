// components/StatsCards.tsx
interface Props {
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
  webhooksActive: number;
}

export default function StatsCards({ totalAlerts, activeAlerts, triggeredToday, webhooksActive }: Props) {
  const cards = [
    { label: 'Total Alerts',     value: totalAlerts,     icon: '🔔', color: 'text-blue-600',  bg: 'bg-blue-50'  },
    { label: 'Active Alerts',    value: activeAlerts,    icon: '🟢', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Triggered Today',  value: triggeredToday,  icon: '⚡', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Webhooks',  value: webhooksActive,  icon: '🔗', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon, color, bg }) => (
        <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-3`}>
            <span className="text-xl">{icon}</span>
          </div>
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
