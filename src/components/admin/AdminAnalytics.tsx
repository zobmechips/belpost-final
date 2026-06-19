import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";

type Order = {
  id: string;
  createdAt: string;
  total: number;
  status?: string;
};

type AdminAnalyticsProps = {
  orders: Order[];
  messagesCount: number;
};

export function AdminAnalytics({ orders, messagesCount }: AdminAnalyticsProps) {
  const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const byDay = orders.reduce<Record<string, number>>((acc, o) => {
    const day = o.createdAt?.slice(0, 10) ?? "unknown";
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  return (
    <div className="admin-analytics">
      <div className="admin-analytics-cards">
        {[
          { label: "Выручка", value: `${revenue.toFixed(2)} BYN` },
          { label: "Заказов", value: String(orders.length) },
          { label: "Обращений", value: String(messagesCount) },
          { label: "Средний чек", value: orders.length ? `${(revenue / orders.length).toFixed(2)} BYN` : "0 BYN" },
        ].map((c, i) => (
          <motion.div key={c.label} className="admin-analytics-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-xl font-bold text-slate-800">{c.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="admin-chart-wrap">
        <p className="mb-3 text-sm font-semibold text-slate-700">Активность заказов (7 дней)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#1F6FD8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
