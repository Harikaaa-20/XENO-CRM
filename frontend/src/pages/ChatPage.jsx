import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chat } from '../api';
import { Send, ChevronDown, ChevronUp, CheckCircle2, Sparkles, MessageSquare, Plus, Trash2 } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [expandedLogs, setExpandedLogs] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let sid = localStorage.getItem('xeno_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('xeno_session_id', sid);
    }
    setSessionId(sid);
    
    const saved = localStorage.getItem('xeno_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setMessages([
        {
          id: 'greet',
          sender: 'agent',
          text: "Hey — I’m your Brew & Co Campaign Copilot ☕\nAsk me anything about your customers, campaigns, or engagement performance.",
          actions: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('xeno_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) setInput('');
    setLoading(true);

    const userMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await chat(text, sessionId);
      const agentMessage = {
        id: 'msg_' + Date.now() + '_agent',
        sender: 'agent',
        text: res.reply,
        actions: res.actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: 'msg_' + Date.now() + '_err',
        sender: 'agent',
        text: 'Sorry, I encountered an error communicating with the AI. Please make sure the backend server is running.',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL query parameter if navigated from sidebar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && !loading && messages.length > 0) {
      // Small timeout to let initial render finish
      setTimeout(() => {
        handleSend(q);
        // Remove q from URL so it doesn't fire again on refresh
        navigate('/ai-assistant', { replace: true });
      }, 100);
    }
  }, [location.search, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const startNewConversation = () => {
    const newSid = 'session_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('xeno_session_id', newSid);
    setSessionId(newSid);
    
    const freshMessages = [
      {
        id: 'greet_new',
        sender: 'agent',
        text: "Hey — I’m your Brew & Co Campaign Copilot ☕\nStarted a fresh session. What segment are we targeting?",
        actions: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(freshMessages);
    localStorage.setItem('xeno_chat_history', JSON.stringify(freshMessages));
  };

  const toggleLog = (msgId) => {
    setExpandedLogs(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="flex flex-col h-full bg-base items-center w-full">
      {/* Header */}
      <div className="w-full max-w-[900px] h-[80px] px-6 border-b border-border-subtle flex items-center justify-between shrink-0 mt-4 mb-2">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-tight mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" />
            AI Assistant
          </h1>
        </div>
        <button
          onClick={startNewConversation}
          className="flex items-center gap-1.5 bg-surface border border-border-subtle text-text-secondary rounded-[6px] px-3 py-1.5 text-[12px] hover:text-error shadow-inset transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 w-full max-w-[900px] overflow-y-auto px-6 py-4 flex flex-col gap-6">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col w-full">
            {msg.sender === 'user' ? (
              <div className="self-end max-w-[70%] flex flex-col items-end">
                <div 
                  className="px-4 py-3 text-[14px] text-white shadow-sm"
                  style={{
                    background: 'var(--brand)',
                    borderRadius: '12px 12px 2px 12px'
                  }}
                >
                  {msg.text}
                </div>
                <div className="text-[11px] text-text-muted mt-1.5 mr-1">{msg.timestamp}</div>
              </div>
            ) : (
              <div className="flex gap-4 items-start w-full max-w-[85%]">
                {/* Agent Avatar */}
                <div className="w-[32px] h-[32px] rounded-lg shrink-0 flex items-center justify-center bg-elevated border border-border-subtle shadow-inset mt-1">
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <div className="flex flex-col w-full">
                  <div className={`bg-surface border ${msg.isError ? 'border-error' : 'border-border-subtle'} rounded-[2px_12px_12px_12px] px-5 py-4 shadow-inset text-[14px] text-text-primary whitespace-pre-wrap leading-relaxed`}>
                    {msg.text}

                    {/* Tool Calls */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <button
                          onClick={() => toggleLog(msg.id)}
                          className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-secondary transition-colors"
                        >
                          ⚡ {msg.actions.length} tool calls {expandedLogs[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {expandedLogs[msg.id] && (
                          <div className="mt-3 bg-base border border-border-subtle border-l-[3px] border-l-brand rounded-[6px] p-3 font-mono text-[12px] text-text-secondary overflow-x-auto max-h-[200px] shadow-inset">
                            {msg.actions.map((act, idx) => (
                              <div key={idx} className="mb-2 last:mb-0">
                                <span className="text-brand font-semibold">{act.tool}</span><br/>
                                <span className="opacity-70">{JSON.stringify(act.result)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action Cards */}
                        {msg.actions.map((act, index) => (
                          <div key={index} className="mt-3">
                            {act.tool === 'search_segment' && act.result && !act.result.error && (
                              <SegmentCard result={act.result} onDraftClick={() => handleSend(`Draft a message for this segment`)} />
                            )}
                            {act.tool === 'draft_message' && act.result && (
                              <DraftCard result={act.result} onSendClick={() => handleSend('Yes, send the campaign')} onScheduleClick={(time) => handleSend(`Yes, schedule the campaign for ${time}`)} />
                            )}
                            {act.tool === 'send_campaign' && act.result && !act.result.error && (
                              <SendConfirmationCard result={act.result} onNavigate={() => navigate(`/campaigns/${act.result.campaign_id}`)} />
                            )}
                            {act.tool === 'get_campaign_stats' && act.result && !act.result.error && (
                              <StatsCard result={act.result} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted mt-1.5 ml-1">{msg.timestamp}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 items-start w-full">
            <div className="w-[32px] h-[32px] rounded-lg shrink-0 flex items-center justify-center bg-elevated border border-border-subtle shadow-inset mt-1">
               <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <div className="flex items-center gap-2 bg-surface border border-border-subtle shadow-inset rounded-[2px_12px_12px_12px] px-5 py-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-slow" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-slow" style={{ animationDelay: '300ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-slow" style={{ animationDelay: '600ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && !loading && (
        <div className="w-full max-w-[900px] px-6 pb-2 shrink-0 flex flex-wrap gap-2">
          {[
            "Find high-value customers in Mumbai",
            "Draft a retention email for lapsed users",
            "How did our last campaign perform?",
            "Summarize recent brand health reviews"
          ].map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="text-[12px] bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-brand px-3 py-1.5 rounded-full transition-colors cursor-pointer text-left"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="w-full max-w-[900px] p-6 pt-0 shrink-0">
        <div className="bg-surface border border-border-subtle rounded-[12px] p-[10px_10px_10px_20px] flex items-center focus-within:border-brand shadow-inset transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder-text-muted"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-[36px] h-[36px] rounded-[8px] bg-brand flex items-center justify-center text-white shrink-0 hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:hover:bg-brand cursor-pointer border-none"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <div className="text-[11px] text-text-muted text-center mt-3">AI can make mistakes. Please review all recommendations.</div>
      </div>
    </div>
  );
}

// ─── Custom UI Cards ─────────────────────────────────────────────────────────

function SegmentCard({ result, onDraftClick }) {
  const channels = result.channels || {};
  const maxChannel = Object.keys(channels).reduce((a, b) => channels[a] > channels[b] ? a : b, 'mixed');
  const likelihood = result.avg_spend > 5000 ? 'High' : (result.avg_spend > 1000 ? 'Medium' : 'Low');

  return (
    <div className="bg-elevated border border-border-subtle shadow-inset rounded-[8px] p-5 mt-3">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-brand" />
        <span className="text-[13px] uppercase tracking-wider text-text-primary font-semibold">Audience Preview</span>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        <div className="min-w-0">
          <span className="block text-[10px] md:text-[11px] text-text-muted mb-1 truncate">Estimated Reach</span>
          <span className="text-[16px] md:text-[18px] text-text-primary font-medium tracking-tight truncate block">{result.count.toLocaleString()}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] md:text-[11px] text-text-muted mb-1 truncate">Avg Spend</span>
          <span className="text-[16px] md:text-[18px] text-text-primary font-medium tracking-tight font-mono truncate block">₹{(result.avg_spend || 0).toLocaleString()}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] md:text-[11px] text-text-muted mb-1 truncate">Engagement</span>
          <span className="text-[16px] md:text-[18px] text-text-primary font-medium tracking-tight text-success truncate block">{likelihood}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] md:text-[11px] text-text-muted mb-1 truncate">Top Channel</span>
          <span className="text-[16px] md:text-[18px] text-text-primary font-medium tracking-tight capitalize truncate block">{maxChannel}</span>
        </div>
      </div>

      {result.count > 0 && (
        <button 
          onClick={onDraftClick} 
          className="w-full bg-surface border border-border-subtle text-text-primary shadow-inset rounded-[6px] py-2.5 text-[13px] font-medium hover:bg-elevated cursor-pointer transition-colors mt-2"
        >
          Draft Campaign &rarr;
        </button>
      )}
    </div>
  );
}

function DraftCard({ result, onSendClick, onScheduleClick }) {
  const isMultiChannel = typeof result === 'object' && result !== null;
  const allDrafts = isMultiChannel ? result : { 'Draft': result };
  const channels = Object.keys(allDrafts);
  const [activeTab, setActiveTab] = useState(channels[0]);

  return (
    <div className="bg-elevated border border-border-subtle shadow-inset rounded-[8px] p-5 mt-3">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-brand" />
        <span className="text-[13px] uppercase tracking-wider text-text-primary font-semibold">Draft Campaign</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-base border border-border-subtle rounded-[6px] p-3 shadow-inset">
          <span className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Tone</span>
          <span className="text-[13px] text-text-primary font-medium">Action-Oriented</span>
        </div>
        <div className="bg-base border border-border-subtle rounded-[6px] p-3 shadow-inset">
          <span className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Channel Strategy</span>
          <span className="text-[13px] text-text-primary font-medium">User Preference</span>
        </div>
        <div className="bg-base border border-border-subtle rounded-[6px] p-3 shadow-inset">
          <span className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Est. Open Rate</span>
          <span className="text-[13px] text-text-primary font-medium">28% - 32%</span>
        </div>
      </div>

      {channels.length > 1 && (
        <div className="flex gap-2 mb-3 border-b border-border-subtle pb-2">
          {channels.map(ch => (
            <button
              key={ch}
              onClick={() => setActiveTab(ch)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] capitalize transition-colors cursor-pointer ${activeTab === ch ? 'bg-surface text-text-primary shadow-inset border border-border-subtle' : 'text-text-muted hover:text-text-secondary bg-transparent border border-transparent'}`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      <div className="font-mono text-[13px] bg-base border border-border-subtle rounded-[6px] p-4 text-text-secondary whitespace-pre-wrap leading-relaxed shadow-inset mb-4">
        {typeof allDrafts[activeTab] === 'object' && allDrafts[activeTab] !== null
          ? Object.entries(allDrafts[activeTab]).map(([k, v]) => `${k.toUpperCase()}:\n${v}`).join('\n\n')
          : allDrafts[activeTab]}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSendClick}
          className="flex-1 bg-brand text-white font-medium border-none rounded-[6px] p-2.5 text-[13px] cursor-pointer hover:opacity-90 active:scale-[0.98] shadow-sm transition-all"
        >
          Send Now
        </button>
        <button
          onClick={() => {
            const time = prompt('When would you like to schedule this campaign? (e.g., "Tomorrow at 10 AM")');
            if (time) onScheduleClick(time);
          }}
          className="flex-1 bg-surface border border-border-subtle text-text-primary shadow-inset rounded-[6px] py-2.5 text-[13px] font-medium hover:bg-elevated cursor-pointer transition-colors"
        >
          Schedule Later
        </button>
      </div>
    </div>
  );
}

function SendConfirmationCard({ result, onNavigate }) {
  return (
    <div className="bg-elevated border border-border-subtle shadow-inset rounded-[8px] p-5 mt-3">
      <div className="flex items-center gap-2 mb-4 text-success">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-[13px] uppercase tracking-wider font-semibold">Campaign Launched</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-base border border-border-subtle rounded-[6px] p-3 shadow-inset">
          <span className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Audience Size</span>
          <span className="text-[15px] text-text-primary font-medium">{result.count}</span>
        </div>
        <div className="bg-base border border-border-subtle rounded-[6px] p-3 shadow-inset">
          <span className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Status</span>
          <span className="text-[15px] text-text-primary font-medium capitalize">Live</span>
        </div>
        <div className="bg-base border border-border-subtle rounded-[6px] p-3 shadow-inset">
          <span className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Channel Breakdown</span>
          <span className="text-[15px] text-text-primary font-medium">Mixed</span>
        </div>
      </div>

      <div className="text-[12px] text-text-muted mb-4">
        Campaign ID: <span className="font-mono">{result.campaign_id}</span>
      </div>

      <button 
        onClick={onNavigate}
        className="w-full bg-surface border border-border-subtle text-text-primary shadow-inset rounded-[6px] py-2.5 text-[13px] font-medium hover:bg-elevated cursor-pointer transition-colors"
      >
        View Live Dispatch Logs &rarr;
      </button>
    </div>
  );
}

function StatsCard({ result }) {
  return (
    <div className="bg-elevated border border-border-subtle shadow-inset rounded-[8px] p-4 mt-2">
      <div className="text-[12px] uppercase tracking-wider text-text-muted font-semibold mb-4">Live Dispatch Stats</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-base border border-border-subtle shadow-inset p-3 rounded-[6px]">
          <div className="text-[11px] text-text-muted mb-1">Target Audience</div>
          <div className="text-[20px] font-semibold text-text-primary leading-tight">{result.total}</div>
        </div>
        <div className="bg-base border border-border-subtle shadow-inset p-3 rounded-[6px]">
          <div className="text-[11px] text-text-muted mb-1">Delivered</div>
          <div className="text-[20px] font-semibold text-success leading-tight">{result.delivered}</div>
        </div>
        <div className="bg-base border border-border-subtle shadow-inset p-3 rounded-[6px]">
          <div className="text-[11px] text-text-muted mb-1">Opened ({result.open_rate})</div>
          <div className="text-[20px] font-semibold text-info leading-tight">{result.opened}</div>
        </div>
        <div className="bg-base border border-border-subtle shadow-inset p-3 rounded-[6px]">
          <div className="text-[11px] text-text-muted mb-1">Clicked ({result.click_rate})</div>
          <div className="text-[20px] font-semibold text-warning leading-tight">{result.clicked}</div>
        </div>
      </div>
    </div>
  );
}
