import React, { useState, useEffect } from 'react';
import { getCustomers, getCustomerDetail } from '../api';
import { Search, ChevronDown, ChevronUp, Upload, X, Mail, Phone, ShoppingBag, ArrowUpRight, MessageSquare } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTier, setFilterTier] = useState('All Tiers');
  const [filterCity, setFilterCity] = useState('All Cities');
  const [filterChannel, setFilterChannel] = useState('All Channels');
  const [filterProduct, setFilterProduct] = useState('All Products');
  const itemsPerPage = 15;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterTier !== 'All Tiers') filters.tier = filterTier.replace(' ', '_').toLowerCase();
      if (filterCity !== 'All Cities') filters.city = filterCity;
      if (filterChannel !== 'All Channels') filters.channel = filterChannel.toLowerCase();
      if (filterProduct !== 'All Products') filters.product = filterProduct;

      const data = await getCustomers(filters);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filterTier, filterCity, filterChannel, filterProduct]);

  const handleSelectCustomer = async (c) => {
    setSelectedCustomer(c);
    try {
      const detail = await getCustomerDetail(c.id);
      setSelectedCustomer(detail);
    } catch(err) {
      console.error(err);
    }
  };

  const getTierColor = (tier) => {
    const t = (tier || '').toLowerCase();
    if (t === 'high value' || t === 'high_value') return 'var(--brand)';
    if (t === 'at risk' || t === 'at_risk') return 'var(--danger)';
    if (t === 'regular') return 'var(--info)';
    return 'var(--text-muted)';
  };

  const getChannelIcon = (channel) => {
    const ch = (channel || 'email').toLowerCase();
    if (ch === 'whatsapp') return <Phone className="w-3.5 h-3.5 text-success" />;
    if (ch === 'sms') return <MessageSquare className="w-3.5 h-3.5 text-brand" />;
    return <Mail className="w-3.5 h-3.5 text-info" />;
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = new Date() - new Date(dateStr);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 1) return '1 day ago';
    if (days > 0 && days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    if (months > 1) return `${months} months ago`;
    return 'Today';
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return `₹${Number(val).toLocaleString()}`;
  };

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Pre-calculate pseudo-random avatar colors based on ID length or character codes
  const getAvatarColor = (name) => {
    const colors = ['#6B8CFF', '#34C97A', '#F5A623', '#A78BFA', '#E8651A'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredCustomers = customers;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="h-full flex relative overflow-hidden bg-base">
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col p-4 sm:p-8 transition-all duration-300 overflow-y-auto ${selectedCustomer ? 'lg:pr-[420px]' : ''}`}>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[18px] sm:text-[20px] font-semibold text-text-primary tracking-tight mb-1">Customers</h1>
          <p className="text-[13px] text-text-muted">Manage shoppers and insights</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full bg-surface border border-border-subtle shadow-inset rounded-[8px] py-2 pl-9 pr-4 text-[13px] text-text-primary focus:outline-none focus:border-border-default transition-colors"
            />
          </div>
          <select 
            className="appearance-none bg-surface border border-border-subtle shadow-inset rounded-[8px] py-2 pl-4 pr-10 text-[13px] text-text-primary focus:outline-none cursor-pointer hover:bg-elevated transition-colors relative"
            value={filterTier}
            onChange={(e) => { setFilterTier(e.target.value); setCurrentPage(1); }}
          >
            <option>All Tiers</option>
            <option>High Value</option>
            <option>Regular</option>
            <option>At Risk</option>
            <option>Lapsed</option>
          </select>
          <select 
            className="appearance-none bg-surface border border-border-subtle shadow-inset rounded-[8px] py-2 pl-4 pr-10 text-[13px] text-text-primary focus:outline-none cursor-pointer hover:bg-elevated transition-colors"
            value={filterCity}
            onChange={(e) => { setFilterCity(e.target.value); setCurrentPage(1); }}
          >
            <option>All Cities</option>
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Bangalore</option>
            <option>Pune</option>
            <option>Chennai</option>
            <option>Hyderabad</option>
          </select>
          <select 
            className="appearance-none bg-surface border border-border-subtle shadow-inset rounded-[8px] py-2 pl-4 pr-10 text-[13px] text-text-primary focus:outline-none cursor-pointer hover:bg-elevated transition-colors"
            value={filterChannel}
            onChange={(e) => { setFilterChannel(e.target.value); setCurrentPage(1); }}
          >
            <option>All Channels</option>
            <option>Email</option>
            <option>WhatsApp</option>
            <option>SMS</option>
          </select>
          <select 
            className="appearance-none bg-surface border border-border-subtle shadow-inset rounded-[8px] py-2 pl-4 pr-10 text-[13px] text-text-primary focus:outline-none cursor-pointer hover:bg-elevated transition-colors"
            value={filterProduct}
            onChange={(e) => { setFilterProduct(e.target.value); setCurrentPage(1); }}
          >
            <option>All Products</option>
            <option>Cold Brew Pack</option>
            <option>Single Origin Beans</option>
            <option>Espresso Blend</option>
            <option>Brew Kit Starter</option>
            <option>Filter Coffee Powder</option>
            <option>Cold Brew Concentrate</option>
            <option>Pour Over Kit</option>
          </select>
          <button 
            onClick={() => alert('CSV Upload is simulated. In a production environment, this would open a file picker and begin bulk importing.')}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle shadow-inset text-text-primary text-[13px] font-medium rounded-[8px] hover:bg-elevated transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-[12px] border border-border-subtle shadow-inset overflow-hidden flex flex-col flex-1">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface border-b border-border-subtle sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted w-[30%]">Name</th>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted">City</th>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted">Tier</th>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted">LTV</th>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted">Orders</th>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted">Last Active</th>
                  <th className="py-4 px-6 text-[11px] font-medium uppercase tracking-wider text-text-muted">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-base">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-text-muted">Loading customers...</td>
                  </tr>
                ) : (
                  currentCustomers.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => handleSelectCustomer(c)}
                      className={`hover:bg-surface transition-colors cursor-pointer group ${selectedCustomer?.id === c.id ? 'bg-surface' : ''}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold opacity-90 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: getAvatarColor(c.name) }}
                          >
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-text-primary group-hover:text-brand transition-colors">{c.name}</div>
                            <div className="text-[12px] text-text-muted mt-0.5">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-text-secondary">{c.city || '—'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTierColor(c.tier) }}></div>
                          <span className="text-[12px] text-text-secondary capitalize">
                            {(c.tier || 'Regular').replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] font-mono text-text-primary">{formatCurrency(c.total_spend)}</td>
                      <td className="py-4 px-6">
                        <div className="text-[13px] font-mono text-text-primary">{c.order_count}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[12px] text-text-secondary">{timeAgo(c.last_order_date)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          {getChannelIcon(c.channel)}
                          <span className="text-[12px] capitalize text-text-secondary">{c.channel || 'Email'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border-subtle bg-surface flex justify-between items-center text-[12px] text-text-muted">
            <span>Showing {filteredCustomers.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-border-subtle rounded-[6px] text-text-secondary hover:bg-elevated disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 border border-border-subtle rounded-[6px] text-text-secondary hover:bg-elevated disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer: full-screen on mobile, side panel on lg+ */}
      {selectedCustomer && (
        <div className="fixed inset-0 lg:absolute lg:inset-auto lg:top-0 lg:right-0 lg:h-full lg:w-[400px] border-l border-border-subtle bg-base shadow-2xl flex flex-col z-20 animate-in slide-in-from-right overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-8 border-b border-border-subtle">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-semibold"
                  style={{ backgroundColor: getAvatarColor(selectedCustomer.name) }}
                >
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-text-primary mb-1">{selectedCustomer.name}</h2>
                  <div className="text-[12px] text-text-muted flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedCustomer.email}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 hover:bg-surface border border-transparent hover:border-border-subtle shadow-inset rounded-[6px] text-text-muted transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium border border-border-subtle bg-surface text-text-secondary flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTierColor(selectedCustomer.tier) }}></div>
                {(selectedCustomer.tier || 'Regular').replace('_', ' ')}
              </span>
              {selectedCustomer.city && (
                <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium border border-border-subtle bg-surface text-text-secondary">
                  {selectedCustomer.city}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
            {/* Stat Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface border border-border-subtle shadow-inset rounded-[8px] flex flex-col">
                <div className="text-[20px] font-semibold text-text-primary mb-1 tracking-tight">
                  {formatCurrency(selectedCustomer.total_spend)}
                </div>
                <div className="text-[11px] text-text-muted font-medium">Total LTV</div>
              </div>
              <div className="p-4 bg-surface border border-border-subtle shadow-inset rounded-[8px] flex flex-col">
                <div className="text-[20px] font-semibold text-text-primary mb-1 tracking-tight">
                  {selectedCustomer.order_count || 0}
                </div>
                <div className="text-[11px] text-text-muted font-medium">Total Orders</div>
              </div>
              <div className="p-4 bg-surface border border-border-subtle shadow-inset rounded-[8px] flex flex-col">
                <div className="text-[20px] font-semibold text-text-primary mb-1 tracking-tight">
                  {formatCurrency((selectedCustomer.total_spend || 0) / (selectedCustomer.order_count || 1))}
                </div>
                <div className="text-[11px] text-text-muted font-medium">AOV</div>
              </div>
              <div className="p-4 bg-surface border border-border-subtle shadow-inset rounded-[8px] flex flex-col">
                <div className="text-[15px] font-semibold text-text-primary mb-1 mt-1 capitalize flex items-center gap-1.5">
                  {getChannelIcon(selectedCustomer.channel)}
                  {selectedCustomer.channel || 'Email'}
                </div>
                <div className="text-[11px] text-text-muted font-medium mt-auto">Preferred Channel</div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
                  <ShoppingBag className="w-4.5 h-4.5 text-text-muted" />
                  Order History <span className="text-[13px] text-text-muted font-normal ml-1">{selectedCustomer.order_count || 0}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {!selectedCustomer.orders ? (
                  <div className="text-[13px] text-text-muted animate-pulse">Loading orders...</div>
                ) : selectedCustomer.orders.length === 0 ? (
                  <div className="text-[13px] text-text-muted">No orders found.</div>
                ) : (
                  selectedCustomer.orders.map((order) => (
                    <div key={order.id} className="bg-transparent border border-border-subtle rounded-[8px] overflow-hidden">
                      <div 
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-elevated transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div>
                          <div className="text-[14px] font-semibold text-text-primary tracking-tight">Order #{order.id.slice(0, 8)}</div>
                          <div className="text-[12px] text-text-muted mt-1">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[14px] text-text-primary font-medium font-mono tracking-tight">{formatCurrency(order.total_amount)}</div>
                          {expandedOrders[order.id] ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </div>
                      </div>
                      
                      {expandedOrders[order.id] && (
                        <div className="flex flex-col bg-transparent">
                          {(order.items && order.items.length > 0 ? order.items : []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 border-t border-border-subtle">
                              <div className="flex items-center gap-3 text-[13px]">
                                <span className="text-text-primary font-mono text-[11px] border border-border-subtle rounded-[4px] px-1.5 py-0.5 bg-transparent">{item.quantity}x</span>
                                <span className="text-text-primary">{item.product || item.name}</span>
                              </div>
                              <span className="text-text-primary font-mono text-[13px] tracking-tight">{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}