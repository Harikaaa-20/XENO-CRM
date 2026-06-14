import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Sparkles, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const DATA_SETS = {
  'Last 7 Days': {
    description: 'Business impact at a glance for the last 7 days.',
    kpis: [
      { label: 'Total Revenue', value: '₹420K', change: '↗ +8.2% vs prev week', trend: 'up' },
      { label: 'Delivery Rate', value: '95.8%', change: '↗ +1.2% vs prev week', trend: 'up' },
      { label: 'Open Rate', value: '41.2%', change: '↗ +2.5% vs prev week', trend: 'up' },
      { label: 'Campaign Conversion', value: '13.5%', change: '↗ +1.8% vs prev week', trend: 'up' }
    ],
    revenueData: [
      { name: 'Mon', value: 1200 },
      { name: 'Tue', value: 1500 },
      { name: 'Wed', value: 1800 },
      { name: 'Thu', value: 2200 },
      { name: 'Fri', value: 1900 },
      { name: 'Sat', value: 2500 },
      { name: 'Sun', value: 3100 },
    ]
  },
  'Last 30 Days': {
    description: 'Business impact at a glance for the last 30 days.',
    kpis: [
      { label: 'Total Revenue', value: '₹1.75M', change: '↗ +12.4% vs last month', trend: 'up' },
      { label: 'Delivery Rate', value: '94.2%', change: '↗ +3.1% vs last month', trend: 'up' },
      { label: 'Open Rate', value: '38.6%', change: '↗ +6.8% vs last month', trend: 'up' },
      { label: 'Campaign Conversion', value: '12.1%', change: '↗ +2.4% vs last month', trend: 'up' }
    ],
    revenueData: [
      { name: 'W1', value: 3000 },
      { name: 'W2', value: 4500 },
      { name: 'W3', value: 4000 },
      { name: 'W4', value: 5800 },
      { name: 'W5', value: 4800 },
      { name: 'W6', value: 6500 },
      { name: 'W7', value: 7200 },
    ]
  },
  'Last 90 Days': {
    description: 'Business impact at a glance for the last 90 days.',
    kpis: [
      { label: 'Total Revenue', value: '₹5.20M', change: '↗ +15.1% vs prev quarter', trend: 'up' },
      { label: 'Delivery Rate', value: '93.6%', change: '↘ -0.5% vs prev quarter', trend: 'down' },
      { label: 'Open Rate', value: '36.4%', change: '↗ +1.2% vs prev quarter', trend: 'up' },
      { label: 'Campaign Conversion', value: '11.8%', change: '↗ +0.9% vs prev quarter', trend: 'up' }
    ],
    revenueData: [
      { name: 'M1', value: 12000 },
      { name: 'M2', value: 16500 },
      { name: 'M3', value: 23500 },
    ]
  },
  'All Time': {
    description: 'Lifetime cumulative business impact across all channels.',
    kpis: [
      { label: 'Total Revenue', value: '₹24.5M', change: '↗ stable growth trajectory', trend: 'up' },
      { label: 'Delivery Rate', value: '94.0%', change: '↗ healthy status average', trend: 'up' },
      { label: 'Open Rate', value: '37.8%', change: '↗ performance standard', trend: 'up' },
      { label: 'Campaign Conversion', value: '12.0%', change: '↗ enterprise standard', trend: 'up' }
    ],
    revenueData: [
      { name: '2023', value: 45000 },
      { name: '2024', value: 89000 },
      { name: '2025', value: 135000 },
      { name: '2026', value: 245000 },
    ]
  }
};

export default function OverviewPage() {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentSet = DATA_SETS[timeRange];
  const kpis = currentSet.kpis;
  const revenueData = currentSet.revenueData;

  const pieData = [
    { name: 'High Value', value: 38, color: '#3451b2' },
    { name: 'Regular', value: 30, color: '#F5A623' },
    { name: 'At Risk', value: 18, color: '#34C97A' },
    { name: 'Lapsed', value: 14, color: '#E24A2B' }
  ];

  const recentCampaigns = [
    { name: 'Mumbai High-Value Campaign', revenue: '₹645,231', conversion: '12.4%' },
    { name: 'Pune Winback Series', revenue: '₹120,400', conversion: '8.2%' },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[18px] sm:text-[20px] font-semibold text-text-primary tracking-tight mb-1">Overview</h1>
          <p className="text-[13px] text-text-muted">{currentSet.description}</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-surface border border-border-subtle text-text-muted px-4 py-1.5 rounded-[6px] text-[12px] font-medium shadow-inset flex items-center gap-1.5 cursor-pointer hover:text-text-primary hover:border-border-default transition-all"
          >
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-[#13151D] border border-[#212431] rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {Object.keys(DATA_SETS).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                      timeRange === range 
                        ? 'text-white bg-[#1C1E26]' 
                        : 'text-text-muted hover:text-white hover:bg-[#13151D]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-surface rounded-[12px] p-5 border border-border-subtle shadow-inset flex flex-col">
            <span className="text-[12px] font-medium text-text-muted mb-2">{kpi.label}</span>
            <div className="text-[28px] font-semibold text-text-primary tracking-tight mb-2">{kpi.value}</div>
            <div className="text-[12px] font-medium text-text-muted">
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Revenue Growth Chart */}
          <div className="bg-surface border border-border-subtle rounded-[12px] p-6 shadow-inset flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[14px] font-semibold text-text-primary">Revenue Growth</h2>
              <button className="text-[12px] text-text-muted hover:text-text-primary">View Report</button>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <Bar dataKey="value" fill="#6B8CFF" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Campaigns List */}
          <div className="bg-surface border border-border-subtle rounded-[12px] shadow-inset flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-border-subtle">
              <h2 className="text-[14px] font-semibold text-text-primary">Recent Campaigns</h2>
              <button className="text-[12px] text-text-muted hover:text-text-primary">View all campaigns</button>
            </div>
            <div className="flex flex-col">
              <div className="hidden sm:grid grid-cols-3 px-6 py-3 border-b border-border-subtle text-[11px] font-medium text-text-muted tracking-wider uppercase">
                <div>CAMPAIGN</div>
                <div>REVENUE</div>
                <div>CONVERSION</div>
              </div>
              {recentCampaigns.map((camp, i) => (
                <div key={i} className="flex flex-col sm:grid sm:grid-cols-3 px-6 py-4 border-b border-border-subtle last:border-b-0 gap-1 sm:gap-0 sm:items-center">
                  <div className="text-[13px] font-medium text-text-primary">{camp.name}</div>
                  <div className="text-[12px] sm:text-[13px] text-text-muted">{camp.revenue}</div>
                  <div className="text-[12px] sm:text-[13px] text-text-muted">{camp.conversion}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="w-full xl:w-[360px] xl:flex-shrink-0 flex flex-col gap-4">

          {/* Recommended Action */}
          <div className="bg-surface border border-border-subtle rounded-[12px] shadow-inset overflow-hidden flex flex-col p-6">
            <h2 className="text-[14px] font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-text-primary" />
              Recommended Action
            </h2>
            <div className="flex flex-col gap-4">
              <h3 className="text-[15px] font-semibold text-text-primary leading-snug">Launch a retention campaign for Lapsed users in Bangalore.</h3>
              <p className="text-[13px] text-text-muted leading-relaxed">
                We've detected a 15% drop in reorder rates for Bangalore customers over the last 3 weeks. A targeted WhatsApp promotion could recover ~₹45k in revenue.
              </p>
              <button className="text-[13px] font-medium text-text-primary mt-2 flex items-center hover:text-brand transition-colors text-left">
                Draft Campaign
              </button>
            </div>
          </div>

          {/* Audience Breakdown */}
          <div className="bg-surface border border-border-subtle rounded-[12px] overflow-hidden flex-1 flex flex-col p-6 shadow-inset">
            <h2 className="text-[14px] font-semibold text-text-primary mb-6">Audience Breakdown</h2>
            <div className="flex-1 flex flex-col justify-center items-center relative">
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text manually */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[20px] font-semibold text-text-primary tracking-tight">2.4k</span>
                  <span className="text-[10px] font-medium text-text-muted tracking-widest uppercase mt-0.5">TOTAL</span>
                </div>
              </div>
              <div className="w-full mt-6 flex justify-between items-center text-[13px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3451b2' }}></div>
                  <span className="text-text-muted">High Value</span>
                </div>
                <span className="font-medium text-text-primary">38%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}