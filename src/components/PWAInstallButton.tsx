import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle2, X, Info, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>App Installed</span>
      </div>
    );
  }

  // Modal content portaled to document.body to ensure it is never trapped under the header or backdrop-blur stacking context
  const modalContent = showGuideModal && typeof document !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowGuideModal(false);
      }}
    >
      <div 
        className="relative w-full max-w-lg my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={() => setShowGuideModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white text-teal-800 flex items-center justify-center font-extrabold text-xl shadow-lg ring-4 ring-teal-500/30">
              M2M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-200 text-[10px] font-bold tracking-wider uppercase">
                  PWA Ready
                </span>
                <span className="text-teal-300 text-xs flex items-center gap-1 font-medium">
                  <Smartphone className="w-3.5 h-3.5" /> Mobile Native Experience
                </span>
              </div>
              <h2 id="install-modal-title" className="text-xl font-extrabold text-white mt-1">
                Install Map2Medic App
              </h2>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Install on your Android phone or tablet for instant access and home visit tracking
              </p>
            </div>
          </div>

          {/* OS Switcher Tabs */}
          <div className="flex gap-2 mt-4 bg-teal-900/60 p-1 rounded-xl border border-teal-600/30">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/50'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>Android (Recommended)</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/50'
              }`}
            >
              <span>iPhone / iOS</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'android' ? (
            <div className="space-y-4">
              {/* Direct Trigger Button if Browser allows it */}
              {isInstallable && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="text-xs text-emerald-900">
                    <p className="font-bold">Ready to install directly:</p>
                    <p className="text-[11px] text-emerald-700">Click below to trigger the Android system install dialog.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await install();
                      if (ok) setShowGuideModal(false);
                    }}
                    className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

              {/* Step-by-Step Android Instructions Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    Chrome / Edge / Samsung Internet on Android
                  </h4>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    4 Quick Steps
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Open in Mobile Chrome or Edge</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Ensure you are opening this link on your Android device in Google Chrome, Samsung Internet, or Microsoft Edge.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Tap the browser menu <span className="inline-block px-1.5 py-0.2 bg-slate-200 rounded text-slate-800 font-extrabold text-sm">⋮</span></p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Located at the top-right corner of your browser window (three vertical dots).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Tap <span className="text-teal-700 font-extrabold">"Install app"</span> or <span className="text-teal-700 font-extrabold">"Add to Home screen"</span>
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        A confirmation banner with the Map2Medic icon will pop up on your screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Tap "Install" to finish</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        The Map2Medic app icon is now placed on your phone's home screen. Tap it to launch full-screen!
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Important Android Tip:</span> If you are viewing this inside an in-app browser or preview frame (like within an app or iframe), tap <span className="font-bold">⋮</span> at the top right and select <span className="font-bold">"Open in Chrome"</span>. Direct installation requires standard Chrome or Edge!
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy URL to test on your phone */}
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                    Testing on your phone?
                  </p>
                  <p className="text-[11px] text-slate-500">Copy the app link to send to your Android phone via WhatsApp, email, or chat.</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`w-full sm:w-auto flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy App URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* iOS Safari Instructions */
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Safari on iPhone / iPad
                  </h4>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    2 Quick Steps
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Tap the Share icon at the bottom</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        In Safari's bottom toolbar, tap the square icon with the upward arrow.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Scroll down and tap "Add to Home Screen"</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Tap "Add" in the top-right corner. The Map2Medic icon will now appear on your iOS home screen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy URL to test on iPhone */}
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-xs font-bold text-slate-900">Copy link for iPhone</p>
                  <p className="text-[11px] text-slate-500">Send link to Safari to add to home screen.</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`w-full sm:w-auto flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy App URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Benefits summary badge */}
          <div className="flex items-center gap-2 p-3 bg-teal-50/80 border border-teal-200/70 text-teal-900 rounded-xl text-xs">
            <Info className="w-4 h-4 flex-shrink-0 text-teal-600" />
            <span>Runs in full-screen standalone mode without URL bars, and loads quickly with cached data!</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowGuideModal(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 cursor-pointer"
        title="Install Map2Medic on your Android or Mobile device"
      >
        <Smartphone className="w-3.5 h-3.5 text-teal-100" />
        <span>Install App</span>
        <Download className="w-3 h-3 opacity-80" />
      </button>

      {modalContent}
    </>
  );
};
