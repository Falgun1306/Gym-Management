import { useState } from 'react';
import { X, Download, Laptop, Smartphone, Apple, CheckCircle2, Sparkles, ArrowRight, Globe } from 'lucide-react';

/**
 * InstallPwaModal — Displays high-clarity visual installation instructions
 * tailored to Chrome desktop, Chrome Android, and iOS Safari (Light Theme).
 */
export default function InstallPwaModal({ isOpen, onClose, onInstall, hasNativePrompt, isInstalled }) {
  const [activeTab, setActiveTab] = useState('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800">
        
        {/* Top Glowing Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Info */}
        <div className="p-6 sm:p-7 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Install IronPeak Elite
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                  PWA Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Run fast, work offline, and launch like a native desktop &amp; mobile app.
              </p>
            </div>
          </div>

          {/* If already installed */}
          {isInstalled && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>IronPeak is already installed on this device. Open it from your applications or home screen!</span>
            </div>
          )}

          {/* Device Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mt-5">
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'desktop'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Chrome Desktop</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'android'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'ios'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone / iPad</span>
            </button>
          </div>
        </div>

        {/* Tab Content Instructions */}
        <div className="px-6 sm:px-7 pb-6 space-y-4">
          {activeTab === 'desktop' && (
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-emerald-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" /> Method 1: Address Bar (Fastest)
                </div>
                <p className="text-slate-700">
                  Look for the <span className="text-slate-900 font-semibold">Install icon (computer with down arrow)</span> on the right side of Chrome’s URL address bar, then click <strong className="text-emerald-700">Install</strong>.
                </p>
                <div className="bg-white p-2.5 rounded-lg font-mono text-[11px] border border-slate-200 text-slate-600 flex items-center justify-between shadow-xs">
                  <span>https://yourgym.app</span>
                  <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-sans flex items-center gap-1 font-semibold">
                    <Download className="w-3 h-3 text-emerald-600" /> Install
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-semibold text-emerald-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" /> Method 2: Chrome 3-Dots Menu
                </div>
                <p className="text-slate-700">
                  Click the <strong className="text-slate-900">⋮ (three dots)</strong> at the top right of Chrome &rarr; Select <strong className="text-emerald-700">"Install IronPeak Elite..."</strong> or <strong className="text-emerald-700">"Cast, save, and share &gt; Install"</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-emerald-800">Chrome on Android:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Tap the <strong className="text-slate-900">⋮ (three vertical dots)</strong> menu in the upper right corner.</li>
                  <li>Select <strong className="text-emerald-700">"Install app"</strong> or <strong className="text-emerald-700">"Add to Home screen"</strong>.</li>
                  <li>Confirm by tapping <strong className="text-slate-900">Install</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-emerald-800">Safari on iOS:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Tap the <strong className="text-slate-900">Share button</strong> (square with arrow pointing up) at bottom bar.</li>
                  <li>Scroll down and tap <strong className="text-emerald-700">"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong className="text-slate-900">Add</strong> in top right corner.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {hasNativePrompt ? (
              <button
                onClick={async () => {
                  const res = await onInstall();
                  if (res?.triggered) {
                    onClose();
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-100" />
                <span>Launch Native Install Dialog</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <span>Got It, Thanks!</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
