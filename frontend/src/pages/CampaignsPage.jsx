import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaigns } from '../api';
import { BarChart, MessageSquare, Mail, Phone, ArrowRight, FolderKanban, Trash2, Archive, ArchiveRestore, ChevronDown, ChevronUp } from 'lucide-react';
import { deleteCampaign, archiveCampaign, unarchiveCampaign } from '../api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();

  const fetchCampaignsList = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    try {
      await archiveCampaign(id);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_archived: true } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnarchive = async (e, id) => {
    e.stopPropagation();
    try {
      await unarchiveCampaign(id);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_archived: false } : c));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaignsList(true);
    const interval = setInterval(() => {
      fetchCampaignsList(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function StatusBadge({ status }) {
    let bg, col, border;
    if (status === 'draft') { bg = '#71717A18'; col = '#71717A'; border = '#71717A35'; }
    else if (status === 'sending') { bg = '#E8651A18'; col = '#E8651A'; border = '#E8651A35'; }
    else if (status === 'completed') { bg = '#34C97A18'; col = '#34C97A'; border = '#34C97A35'; }
    else if (status === 'scheduled') { bg = '#6B8CFF18'; col = '#6B8CFF'; border = '#6B8CFF35'; }
    else { bg = '#E0525218'; col = '#E05252'; border = '#E0525235'; } 
    
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium tracking-wide whitespace-nowrap"
        style={{ backgroundColor: bg, color: col, border: `1px solid ${border}` }}
      >
        {status === 'sending' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow"></span>}
        {status === 'sending' ? 'Live' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  const getChannelIcon = (channel) => {
    const ch = (channel || '').toLowerCase();
    if (ch === 'whatsapp') return <Phone className="w-3.5 h-3.5 text-[#34C97A]" />;
    if (ch === 'email') return <Mail className="w-3.5 h-3.5 text-[#6B8CFF]" />;
    if (ch === 'sms') return <MessageSquare className="w-3.5 h-3.5 text-brand" />;
    return <MessageSquare className="w-3.5 h-3.5 text-text-muted" />;
  };

  const activeCampaigns = campaigns.filter(c => !c.is_archived);
  const archivedCampaigns = campaigns.filter(c => c.is_archived);

  const renderCampaignCard = (camp) => {
    const deliveryRate = camp.total > 0 ? (camp.delivered / camp.total) * 100 : 0;
    
    return (
      <div 
        key={camp.id} 
        onClick={() => navigate(`/campaigns/${camp.id}`)}
        className={`bg-surface border border-border-subtle shadow-inset rounded-[12px] p-5 cursor-pointer hover:bg-elevated transition-colors flex flex-col group relative ${camp.is_archived ? 'opacity-60 hover:opacity-100' : ''}`}
      >
        {/* Action Buttons */}
        <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          {camp.is_archived ? (
            <button 
              onClick={(e) => handleUnarchive(e, camp.id)}
              className="w-7 h-7 bg-elevated border border-border-subtle rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/30 transition-colors"
              title="Unarchive"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={(e) => handleArchive(e, camp.id)}
              className="w-7 h-7 bg-elevated border border-border-subtle rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/30 transition-colors"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={(e) => handleDelete(e, camp.id)}
            className="w-7 h-7 bg-elevated border border-border-subtle rounded-full flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/30 transition-colors"
            title="Delete Permanently"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 1: Name & Status */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-[15px] font-medium text-text-primary line-clamp-2 pr-2 group-hover:text-brand transition-colors">{camp.name}</h3>
          <StatusBadge status={camp.status} />
        </div>
        
        {/* Row 2: Date & Channel */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-[12px] text-text-muted">
            {new Date(camp.scheduled_at || camp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {camp.status === 'scheduled' && ' (Scheduled)'}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-base border border-border-subtle shadow-inset rounded-[6px]">
            {getChannelIcon(camp.channel)}
            <span className="text-[11px] capitalize text-text-secondary font-medium">{camp.channel}</span>
          </div>
        </div>
        
        {/* Row 4: Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="flex flex-col">
            <span className="font-mono text-[14px] text-text-primary font-medium">{camp.total}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Sent</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[14px] text-[#34C97A] font-medium">{camp.delivered}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Delivered</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[14px] text-[#6B8CFF] font-medium">{camp.opened}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Opened</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[14px] text-[#F5A623] font-medium">{camp.clicked}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Clicked</span>
          </div>
        </div>

        {/* Row 5: Progress Bar */}
        <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden mb-5">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out bg-brand"
            style={{ width: `${deliveryRate}%` }}
          />
        </div>

        {/* Row 6: Action Link */}
        <div className="mt-auto flex justify-end text-[12px] font-medium items-center gap-1 text-text-muted group-hover:text-brand transition-colors">
          View full report
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-[1200px] mx-auto w-full relative overflow-y-auto">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-tight mb-1 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-text-muted" />
            Campaigns
          </h1>
          <p className="text-[13px] text-text-muted">Manage all active and past communications.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 text-text-muted">
           <div className="animate-pulse flex flex-col items-center">
             <div className="w-6 h-6 border-[3px] border-border-subtle rounded-full animate-spin mb-4" style={{ borderTopColor: '#E8651A' }}></div>
             <span className="text-[13px]">Loading campaigns...</span>
           </div>
        </div>
      ) : activeCampaigns.length === 0 && archivedCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-text-muted">
          <div className="w-16 h-16 bg-elevated rounded-[12px] flex items-center justify-center border border-border-subtle shadow-inset mb-4">
            <BarChart className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-[16px] font-semibold text-text-primary mb-1">No campaigns yet</h3>
          <p className="text-[14px]">Ask the AI Assistant to draft and send one.</p>
        </div>
      ) : (
        <div className="flex flex-col pb-12 gap-10">
          
          {/* Active Campaigns */}
          {activeCampaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeCampaigns.map(renderCampaignCard)}
            </div>
          )}

          {/* Archived Campaigns Section */}
          {archivedCampaigns.length > 0 && (
            <div className="mt-8 border-t border-border-subtle pt-8">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-[14px] font-medium text-text-muted hover:text-text-primary transition-colors mb-6"
              >
                {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Archived Campaigns ({archivedCampaigns.length})
              </button>
              
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80">
                  {archivedCampaigns.map(renderCampaignCard)}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}