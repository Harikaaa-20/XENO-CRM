import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, MousePointerClick, MailOpen, Send } from 'lucide-react';
import { getAnalyticsOverview } from '../api';

export default function AnalyticsPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ sent: 0, openRate: 0, clickRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsOverview().then(res => {
      if (res.funnel_data) setData(res.funnel_data);
      if (res.stats) setStats(res.stats);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-text-muted font-medium">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-tight mb-1">Analytics</h1>
          <p className="text-[13px] text-text-muted">Campaign performance & funnel conversion across all channels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Send, label: 'Total Sent', value: stats.sent.toLocaleString(), color: 'text-brand' },
          { icon: MailOpen, label: 'Avg Open Rate', value: `${stats.openRate}%`, color: 'text-[#6B8CFF]' },
          { icon: MousePointerClick, label: 'Avg Click Rate', value: `${stats.clickRate}%`, color: 'text-[#34C97A]' }
        ].map((stat, i) => (
          <div key={i} className="bg-surface rounded-[12px] p-5 border border-border-subtle shadow-inset flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-elevated border border-border-subtle flex items-center justify-center">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-[12px] font-medium text-text-muted mb-0.5">{stat.label}</div>
              <div className="text-[20px] font-semibold text-text-primary">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border-subtle rounded-[12px] p-6 shadow-inset">
        <h2 className="text-[14px] font-semibold text-text-primary mb-6">Weekly Engagement Funnel</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181B', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '12px' }}
                cursor={{fill: '#2A2A2A', opacity: 0.4}}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#71717A' }} />
              <Bar dataKey="Sent" fill="#3F3F46" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Opened" fill="#6B8CFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Clicked" fill="#E24A2B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}