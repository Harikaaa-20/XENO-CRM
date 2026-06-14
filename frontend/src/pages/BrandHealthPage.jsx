import React, { useState } from 'react';

const MOCK_REVIEWS = [
  {
    id: 1,
    source: "App Store",
    rating: 5,
    date: "2 days ago",
    author: "CoffeeLover99",
    content: "Absolutely love the new cold brew options! The app is super fast and ordering ahead is a breeze.",
  },
  {
    id: 2,
    source: "Play Store",
    rating: 2,
    date: "4 days ago",
    author: "Rajesh K.",
    content: "The app crashed right when I was trying to apply my loyalty discount at checkout. Very frustrating.",
  },
  {
    id: 3,
    source: "App Store",
    rating: 4,
    date: "1 week ago",
    author: "AnitaS",
    content: "Great coffee as always. Really wish you guys would bring back the summer cold brew blend though!",
  },
  {
    id: 4,
    source: "Twitter",
    rating: 3,
    date: "1 week ago",
    author: "@brewdaily",
    content: "Love the physical stores but the mobile app sometimes doesn't show my updated points balance immediately.",
  },
  {
    id: 5,
    source: "Play Store",
    rating: 5,
    date: "2 weeks ago",
    author: "Vikram P.",
    content: "Best espresso blend in the city. Delivery was on time and packaging was perfect.",
  },
  {
    id: 6,
    source: "App Store",
    rating: 2,
    date: "2 weeks ago",
    author: "Priya Menon",
    content: "Why did you remove the option to customize the sugar level for the iced lattes? Please bring it back.",
  },
  {
    id: 7,
    source: "Twitter",
    rating: 5,
    date: "2 weeks ago",
    author: "@caffeine_rush",
    content: "The nitro cold brew is absolute perfection! Best addition to the menu in years.",
  },
  {
    id: 8,
    source: "Play Store",
    rating: 4,
    date: "3 weeks ago",
    author: "Sanjay D.",
    content: "Smooth interface and quick pickup. App runs great, just waiting for Apple Pay integration.",
  }
];

// HeartPulse icon
const HeartPulse = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);


export default function BrandHealthPage() {
  const [showInsights, setShowInsights] = useState(false);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5 text-xs font-semibold">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-[#EAB308]' : 'text-gray-700'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderSourceIcon = (source) => {
    if (source === 'App Store') {
      return (
        <div className="w-4 h-4 rounded bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-bold">A</div>
      );
    }
    if (source === 'Play Store') {
      return (
        <svg className="w-3.5 h-3.5 fill-current text-emerald-500" viewBox="0 0 24 24">
          <path d="M3 5.25c0-.83.94-1.31 1.61-.82l14.18 10.3c.55.4.55 1.24 0 1.64L4.61 22.18c-.67.49-1.61.01-1.61-.82V5.25z" />
        </svg>
      );
    }
    if (source === 'Twitter') {
      return (
        <svg className="w-3.5 h-3.5 fill-current text-gray-400" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }
    return null;
  };

  const getSourceColor = (source) => {
    if (source === 'App Store') return 'text-blue-400';
    if (source === 'Play Store') return 'text-emerald-500';
    if (source === 'Twitter') return 'text-gray-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex-1 overflow-y-auto text-[#E2E8F0]">
          
          {/* HEADER */}
          <header className="flex flex-wrap justify-between items-start gap-3 px-4 sm:px-8 pt-6 pb-4 shrink-0">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Brand Health Monitor
              </h1>
              <p className="text-xs text-[#8E929E] mt-0.5">AI-powered sentiment &amp; insights across channels.</p>
            </div>
            
            <button 
              onClick={() => setShowInsights(true)}
              className="flex items-center gap-2 bg-[#090A0F] border border-[#2A2E3D] hover:bg-[#13151D] active:scale-95 text-xs font-medium text-white px-3.5 py-2 rounded-xl transition-all"
            >
              <svg className={`w-3.5 h-3.5 text-yellow-400 fill-current ${!showInsights ? 'animate-pulse' : ''}`} viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Generate AI Insights
            </button>
          </header>

          {/* DASHBOARD BODY CONTENT */}
          <div className="flex flex-col xl:flex-row gap-6 px-4 sm:px-8 pb-8">
            
            {/* LEFT CONTENT: PLATFORM SUMMARY & RECENT FEEDBACK */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* PLATFORM SUMMARY SECTION */}
              <div className="bg-gradient-to-r from-[#13151D] to-[#161924] border border-[#212431] rounded-xl p-4 mb-5 flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-300 tracking-wide uppercase mb-0.5">Cross-Platform Health Summary</h4>
                  <p className="text-[13px] text-gray-400 leading-relaxed font-normal">
                    Product and delivery sentiment remain exceptionally high, driven by praise for new cold brew menu options. However, overall brand health faces minor friction due to critical checkout crashes during loyalty redemption flows and recent complaints regarding removed latte customizations.
                  </p>
                </div>
              </div>
              
              {/* Feedback Section Subheader */}
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-white">Recent Customer Feedback</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8E929E]">Average Sentiment</span>
                  <div className="flex items-center gap-1.5 bg-[#13151D] border border-[#212431] px-2.5 py-1 rounded-lg">
                    <span className="font-semibold text-white">4.1 / 5.0</span>
                    <span className="text-emerald-500 font-medium text-[11px] flex items-center">↑ 0.2</span>
                  </div>
                </div>
              </div>

              {/* Feed Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="bg-[#13151D] border border-[#212431] rounded-xl p-[18px] flex flex-col justify-between min-h-[160px]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`flex items-center gap-2 text-xs font-semibold ${getSourceColor(review.source)}`}>
                          {renderSourceIcon(review.source)}
                          {review.source}
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-[13px] text-gray-200 leading-relaxed font-normal">
                        "{review.content}"
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-[#6C7284] pt-2">
                      <span>{review.author}</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANEL: IDENTIFIED PAIN POINTS & ACTIONS */}
            <div className="w-full xl:w-[360px] xl:flex-shrink-0 border border-[#1F222F] rounded-2xl p-5 flex flex-col relative">
              
              {/* EMPTY STATE */}
              {!showInsights ? (
                <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px] xl:min-h-0 xl:flex-1">
                  <div className="w-12 h-12 rounded-full border border-dashed border-[#2A2E3D] flex items-center justify-center text-gray-500 mb-4 bg-[#13151D]/30">
                    <svg className="w-5 h-5 text-[#5A5E6D]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-300 mb-1">No Active AI Insights</h3>
                  <p className="text-[11px] text-[#6C7284] max-w-[220px] leading-relaxed">
                    Click the <strong className="text-gray-400 font-medium">"Generate AI Insights"</strong> button at the top to scan recent data pools.
                  </p>
                </div>
              ) : (
                /* LOADED INSIGHT CONTENT STATE */
                <div className="space-y-6 flex-1 flex flex-col animate-fadeIn opacity-100 transition-opacity duration-500">
                  
                  {/* Section 1: Identified Pain Points */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white mb-4">
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Identified Pain Points
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <h3 className="text-xs font-medium text-white">Checkout crashes reported</h3>
                        </div>
                        <p className="text-xs text-[#8E929E] pl-6 leading-relaxed">Multiple users experience failure during loyalty discount flow.</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <h3 className="text-xs font-medium text-white">Missing customization</h3>
                        </div>
                        <p className="text-xs text-[#8E929E] pl-6 leading-relaxed">Frustration regarding the removal of iced latte sugar levels.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-[#1F222F]" />

                  {/* Section 2: Recommended Actions */}
                  <div className="flex-1 flex flex-col justify-start">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white mb-4">
                      <svg className="w-4 h-4 text-purple-400 fill-current" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      Recommended Actions
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-[#13151D]/60 border border-[#212431] rounded-xl p-4 flex flex-col justify-between min-h-[120px]">
                        <div>
                          <span className="text-[10px] font-semibold tracking-wide text-rose-400 uppercase">High Impact</span>
                          <h4 className="text-xs font-semibold text-white mt-1 mb-1.5">Resolve checkout crash</h4>
                          <p className="text-[11px] text-[#8E929E] leading-relaxed">
                            Target Regular &amp; At-Risk tiers with a "We fixed it" apology email containing a 15% discount code.
                          </p>
                        </div>
                        <a href="#" className="text-[11px] font-medium text-white hover:underline flex items-center gap-1 pt-3 self-start">
                          Draft Campaign <span className="text-xs">→</span>
                        </a>
                      </div>

                      <div className="bg-[#13151D]/60 border border-[#212431] rounded-xl p-4 flex flex-col justify-between min-h-[120px]">
                        <div>
                          <span className="text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">Medium Impact</span>
                          <h4 className="text-xs font-semibold text-white mt-1 mb-1.5">Bring back Summer Blend</h4>
                          <p className="text-[11px] text-[#8E929E] leading-relaxed">
                            Target past purchasers of the Summer Cold Brew with an exclusive early-access notification.
                          </p>
                        </div>
                        <a href="#" className="text-[11px] font-medium text-white hover:underline flex items-center gap-1 pt-3 self-start">
                          Draft Campaign <span className="text-xs">→</span>
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
    </div>
  );
}