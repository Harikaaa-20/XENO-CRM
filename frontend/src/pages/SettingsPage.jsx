import React from 'react';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-8 max-w-[900px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-[20px] font-semibold text-text-primary tracking-tight mb-1">Settings</h1>
        <p className="text-[13px] text-text-muted">Manage your workspace, users, and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-[240px] flex flex-col gap-1">
          {[
            { id: 'general', label: 'General', icon: Settings, active: true },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'integrations', label: 'Integrations', icon: Database },
          ].map(item => (
            <button key={item.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors text-left ${item.active ? 'bg-surface text-brand border border-border-subtle shadow-inset' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-surface border border-border-subtle rounded-[12px] p-6 shadow-inset">
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">Workspace Details</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-text-muted mb-1.5">Workspace Name</label>
                <input type="text" defaultValue="Brew & Co" className="w-full bg-base border border-border-subtle rounded-[6px] px-3 py-2 text-[13px] text-text-primary focus:border-brand outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-muted mb-1.5">Industry</label>
                <select className="w-full bg-base border border-border-subtle rounded-[6px] px-3 py-2 text-[13px] text-text-primary focus:border-brand outline-none appearance-none">
                  <option>Food & Beverage</option>
                  <option>Fashion & Apparel</option>
                  <option>Beauty & Cosmetics</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-[12px] p-6 shadow-inset">
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">Channel Configuration</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-base rounded-[8px] border border-border-subtle">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center border border-brand/20">
                    <Database className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary mb-0.5">Xeno Simulated Channel Service</div>
                    <div className="text-[12px] text-text-muted">Delivers campaigns via local port 8001</div>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-full text-[11px] font-semibold tracking-wide">
                  CONNECTED
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-base rounded-[8px] border border-border-subtle opacity-75">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                    <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.393 0 0 5.393 0 12.031c0 2.12.548 4.186 1.594 6.007L.027 23.952l6.059-1.589a11.966 11.966 0 0 0 5.945 1.589c6.635 0 12.028-5.394 12.028-12.031S18.667 0 12.031 0zm0 21.956c-1.802 0-3.568-.485-5.112-1.401l-.366-.217-3.805.998.998-3.708-.238-.38C2.463 15.656 1.963 13.882 1.963 12.03c0-5.556 4.519-10.076 10.068-10.076 5.549 0 10.065 4.52 10.065 10.076 0 5.558-4.516 10.076-10.065 10.076zm5.522-7.551c-.303-.152-1.789-.884-2.065-.986-.275-.101-.476-.152-.676.152-.202.303-.781.986-.957 1.189-.176.202-.353.228-.656.076-1.523-.762-2.617-1.464-3.593-2.673-.254-.314-.029-.481.123-.632.136-.135.303-.353.454-.53.151-.177.202-.303.303-.505.101-.202.05-.379-.026-.53-.075-.152-.676-1.629-.926-2.23-.243-.585-.489-.505-.676-.515-.176-.009-.378-.01-.58-.01-.202 0-.53.076-.807.379-.278.303-1.059 1.034-1.059 2.52 0 1.487 1.084 2.923 1.236 3.125.152.202 2.133 3.256 5.166 4.566.721.312 1.284.498 1.724.638.723.23 1.382.197 1.9.119.584-.088 1.789-.731 2.041-1.438.252-.707.252-1.312.176-1.438-.076-.126-.278-.202-.581-.353z"/></svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary mb-0.5">WhatsApp Business API</div>
                    <div className="text-[12px] text-text-muted">Official Meta integration for WhatsApp campaigns</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-surface text-text-primary border border-border-subtle rounded-md text-[11px] font-medium hover:bg-border-subtle transition-colors">
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-base rounded-[8px] border border-border-subtle opacity-75">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#E1306C]/10 flex items-center justify-center border border-[#E1306C]/20">
                    <svg className="w-5 h-5 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary mb-0.5">Instagram Graph API</div>
                    <div className="text-[12px] text-text-muted">For direct messages and engagement campaigns</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-surface text-text-primary border border-border-subtle rounded-md text-[11px] font-medium hover:bg-border-subtle transition-colors">
                  Connect
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-base rounded-[8px] border border-border-subtle opacity-75">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#EA4335]/10 flex items-center justify-center border border-[#EA4335]/20">
                    <svg className="w-5 h-5 text-[#EA4335]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary mb-0.5">Gmail / Google Workspace</div>
                    <div className="text-[12px] text-text-muted">Send marketing emails via Google SMTP</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-surface text-text-primary border border-border-subtle rounded-md text-[11px] font-medium hover:bg-border-subtle transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-[12px] p-6 shadow-inset">
            <h2 className="text-[15px] font-semibold text-text-primary mb-4">Data Sync</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-text-muted">Import Customers (CSV)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept=".csv"
                    className="flex-1 bg-base border border-border-subtle rounded-[6px] px-3 py-2 text-[12px] text-text-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-medium file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        alert("Uploading...");
                        const { uploadCSV } = await import('../api');
                        const res = await uploadCSV(file);
                        alert(`Success! Inserted: ${res.inserted}, Skipped: ${res.skipped}`);
                        e.target.value = null; // reset
                      } catch (err) {
                        alert("Failed to upload CSV");
                        console.error(err);
                      }
                    }}
                  />
                  <button className="px-4 py-2 bg-elevated border border-border-subtle rounded-[6px] text-[12px] font-medium text-text-primary hover:bg-surface transition-colors">
                    Download Template
                  </button>
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Required columns: <code className="bg-elevated px-1 py-0.5 rounded border border-border-subtle text-[10px]">name, email, phone, city, channel</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button className="bg-brand text-white text-[13px] font-medium px-5 py-2 rounded-[6px] hover:bg-opacity-90 transition-all shadow-lg shadow-brand/20">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}