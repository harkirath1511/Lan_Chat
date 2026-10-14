import React from 'react';
import { X, Volume2, Clock, AlignJustify, Trash2, Server, Check } from 'lucide-react';

export interface ChatPreferences {
  soundEnabled: boolean;
  compactMode: boolean;
  timeFormat24h: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ChatPreferences;
  onUpdatePreferences: (prefs: Partial<ChatPreferences>) => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

  // Gentle subtle sound chime using Web Audio API
  const playTestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio not supported in environment
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202522]/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#F4F1EB] border border-[#202522]/15 rounded-2xl p-6 sm:p-7 shadow-xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202522]/10 mb-5">
          <h3 id="settings-dialog-title" className="font-serif text-xl font-semibold text-[#202522]">
            Workspace Preferences
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[#777D76] hover:text-[#202522] rounded-lg transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Audio Chime Setting */}
          <div className="flex items-center justify-between p-3 bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F4F1EB] text-[#294E43]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#202522]">
                  Audio Chimes
                </div>
                <div className="text-[11px] text-[#777D76]">
                  Play gentle tone on incoming peer message
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playTestChime}
                className="px-2.5 py-1 text-[11px] font-medium text-[#294E43] hover:bg-[#E5E0D7] rounded border border-[#294E43]/30 cursor-pointer"
              >
                Test
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.soundEnabled}
                onClick={() =>
                  onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  preferences.soundEnabled ? 'bg-[#294E43]' : 'bg-[#777D76]/40'
                }`}
              >
                <div
                  className={`bg-[#F4F1EB] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Compact Density Setting */}
          <div className="flex items-center justify-between p-3 bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F4F1EB] text-[#294E43]">
                <AlignJustify className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#202522]">
                  Compact Layout
                </div>
                <div className="text-[11px] text-[#777D76]">
                  Tighter message line height and smaller avatars
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.compactMode}
              onClick={() =>
                onUpdatePreferences({ compactMode: !preferences.compactMode })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                preferences.compactMode ? 'bg-[#294E43]' : 'bg-[#777D76]/40'
              }`}
            >
              <div
                className={`bg-[#F4F1EB] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  preferences.compactMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 24-hour Timestamp Setting */}
          <div className="flex items-center justify-between p-3 bg-[#E5E0D7]/40 border border-[#202522]/10 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F4F1EB] text-[#294E43]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#202522]">
                  24-Hour Timestamps
                </div>
                <div className="text-[11px] text-[#777D76]">
                  Format times as 14:30 instead of 2:30 PM
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.timeFormat24h}
              onClick={() =>
                onUpdatePreferences({ timeFormat24h: !preferences.timeFormat24h })
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                preferences.timeFormat24h ? 'bg-[#294E43]' : 'bg-[#777D76]/40'
              }`}
            >
              <div
                className={`bg-[#F4F1EB] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  preferences.timeFormat24h ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Backend Info Box */}
          <div className="p-3 bg-[#E5E0D7]/30 border border-[#202522]/10 rounded-xl text-xs text-[#202522]/80">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#294E43] font-semibold mb-1">
              <Server className="w-3.5 h-3.5" />
              <span>TRANSPORT ADAPTER</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Currently running in simulated mock mode with simulated peer replies. When running against the Java WebSocket server, the client will connect via ws://&lt;host&gt;:&lt;port&gt;/ws.
            </p>
          </div>

          {/* Reset Demo Data Action */}
          <div className="pt-2 border-t border-[#202522]/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#202522]">
                Reset Demo Data
              </div>
              <div className="text-[11px] text-[#777D76]">
                Clear simulated messages and restore initial channels
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demo messages and channels to default?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#D36C43] hover:bg-[#D36C43]/10 border border-[#D36C43]/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
