import React from 'react';
import { usePwa } from '../context/PwaContext';
import { X, Download, Share, PlusSquare, Monitor, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';

export default function DownloadShortcutModal() {
  const { showModal, setShowModal, platformInfo, downloadDesktopShortcut, markAsInstalled } = usePwa();

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E142D] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-[#332352] overflow-hidden animate-scale-in">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#FFC8DD]/40 via-[#BDE0FE]/40 to-[#CDB4DB]/40 dark:from-[#2B1B3D] dark:to-[#382550] p-6 relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-[#2B1B3D] dark:text-gray-300 bg-white/70 dark:bg-[#332352] p-1.5 rounded-full hover:bg-white dark:hover:bg-[#3E285C] transition"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <img
              src="/logo.png"
              alt="EduFlow App Icon"
              className="w-12 h-12 rounded-2xl shadow-md object-contain bg-white dark:bg-[#120B1D] p-1 border border-gray-100 dark:border-[#332352]"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#2B1B3D] dark:text-white">
                Download EduFlow
              </h2>
              <p className="text-xs font-bold text-gray-600 dark:text-[#FFC8DD]">
                Install or save a shortcut on your device
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-gray-600 dark:text-gray-300 font-medium">
          {/* iOS Safari Instructions */}
          {platformInfo.isIOS && (
            <div className="space-y-3">
              <div className="p-3.5 bg-purple-50 dark:bg-[#120B1D] rounded-2xl border border-purple-100 dark:border-[#332352] space-y-2">
                <div className="flex items-center space-x-2 text-[#2B1B3D] dark:text-white font-bold">
                  <Smartphone className="w-4 h-4 text-purple-600 dark:text-[#FFAFCC]" />
                  <span>How to install on iPhone & iPad:</span>
                </div>
                <ol className="space-y-2 pl-1 list-decimal list-inside text-gray-600 dark:text-gray-300 leading-relaxed">
                  <li>
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> at the bottom of Safari.
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#2B1B3D] dark:text-white" />.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top-right corner.
                  </li>
                </ol>
              </div>

              <button
                onClick={markAsInstalled}
                className="w-full py-3 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-2xl shadow transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I've Added It to Home Screen</span>
              </button>
            </div>
          )}

          {/* Android Chrome Instructions */}
          {platformInfo.isAndroid && (
            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50 dark:bg-[#120B1D] rounded-2xl border border-blue-100 dark:border-[#332352] space-y-2">
                <div className="flex items-center space-x-2 text-[#2B1B3D] dark:text-white font-bold">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-[#A2D2FF]" />
                  <span>How to install on Android:</span>
                </div>
                <ol className="space-y-2 pl-1 list-decimal list-inside text-gray-600 dark:text-gray-300 leading-relaxed">
                  <li>
                    Tap the <strong>3 dots (⋮)</strong> in Chrome's top-right corner.
                  </li>
                  <li>
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </li>
                </ol>
              </div>

              <button
                onClick={markAsInstalled}
                className="w-full py-3 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-2xl shadow transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I've Installed It</span>
              </button>
            </div>
          )}

          {/* Desktop (Windows / Mac / Linux) Instructions & Shortcut Download */}
          {platformInfo.isDesktop && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-[#120B1D] rounded-2xl border border-gray-200 dark:border-[#332352] space-y-3">
                <div className="flex items-center space-x-2 text-[#2B1B3D] dark:text-white font-bold">
                  <Monitor className="w-4 h-4 text-[#2B1B3D] dark:text-[#FFAFCC]" />
                  <span>Option 1: Browser App Installation</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Look for the <strong>Install</strong> icon in your browser's address bar (Chrome, Edge, Brave, Opera) and click to install EduFlow onto your computer as a standalone desktop app.
                </p>
                <button
                  onClick={markAsInstalled}
                  className="w-full py-2 bg-gray-200 dark:bg-[#332352] hover:bg-gray-300 dark:hover:bg-[#3E285C] text-[#2B1B3D] dark:text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Already Installed via Browser</span>
                </button>
              </div>

              <div className="p-4 bg-[#BDE0FE]/25 dark:bg-[#160F24] rounded-2xl border border-[#BDE0FE] dark:border-[#332352] space-y-3">
                <div className="flex items-center space-x-2 text-[#2B1B3D] dark:text-white font-bold">
                  <Download className="w-4 h-4 text-[#2B1B3D] dark:text-[#BDE0FE]" />
                  <span>Option 2: 1-Click Desktop Shortcut File</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Download an official <strong>EduFlow.url</strong> desktop shortcut. Double-click it anytime from your desktop or taskbar to launch EduFlow instantly!
                </p>
                <button
                  onClick={downloadDesktopShortcut}
                  className="w-full py-3 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-black text-xs rounded-2xl shadow transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Desktop Shortcut (.url)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50/80 dark:bg-[#120B1D]/80 border-t border-gray-100 dark:border-[#332352] text-center text-[11px] text-gray-400 font-bold">
          Once downloaded or installed, this download shortcut will disappear automatically.
        </div>
      </div>
    </div>
  );
}
