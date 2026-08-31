import { ArrowLeft, Bug, Music, Trash2, Volume2, Vibrate, Zap } from 'lucide-react';
import React from 'react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetScores: () => void;
  onBack: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetScores,
  onBack,
}) => {
  const toggle = (key: keyof GameSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fade-in">
      <div className="w-full max-w-md flex flex-col gap-6 bg-[#111]/95 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl box-glow-cyan">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#222] hover:bg-[#333] text-white border border-white/10 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">
              SETTINGS
            </h2>
          </div>
          <div className="w-9" />
        </div>

        {/* Setting Toggles */}
        <div className="flex flex-col gap-3">
          {/* Sound FX */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0a0a0a] border border-white/5 stat-box-yellow">
            <div className="flex items-center gap-3">
              <Volume2 className={`w-5 h-5 ${settings.soundEnabled ? 'text-yellow-400' : 'text-neutral-600'}`} />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">SOUND EFFECTS</div>
                <div className="text-[11px] text-white/40">In-game arcade audio & blasts</div>
              </div>
            </div>
            <button
              onClick={() => toggle('soundEnabled')}
              className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-yellow-400 text-black shadow-md shadow-yellow-500/30'
                  : 'bg-[#222] text-neutral-400 border border-white/5'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Music */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0a0a0a] border border-white/5 stat-box-pink">
            <div className="flex items-center gap-3">
              <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-pink-500' : 'text-neutral-600'}`} />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">SYNTH MUSIC</div>
                <div className="text-[11px] text-white/40">Retro electronic soundtrack</div>
              </div>
            </div>
            <button
              onClick={() => toggle('musicEnabled')}
              className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                  : 'bg-[#222] text-neutral-400 border border-white/5'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0a0a0a] border border-white/5 stat-box-red">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${settings.screenShake ? 'text-red-400' : 'text-neutral-600'}`} />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">SCREEN SHAKE</div>
                <div className="text-[11px] text-white/40">Explosion rumble feedback</div>
              </div>
            </div>
            <button
              onClick={() => toggle('screenShake')}
              className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                settings.screenShake
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'bg-[#222] text-neutral-400 border border-white/5'
              }`}
            >
              {settings.screenShake ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0a0a0a] border border-white/5 stat-box">
            <div className="flex items-center gap-3">
              <Vibrate className={`w-5 h-5 ${settings.vibration ? 'text-cyan-400' : 'text-neutral-600'}`} />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">HAPTIC VIBRATION</div>
                <div className="text-[11px] text-white/40">Mobile haptic tap feedback</div>
              </div>
            </div>
            <button
              onClick={() => toggle('vibration')}
              className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                settings.vibration
                  ? 'bg-cyan-400 text-black shadow-md shadow-cyan-500/30'
                  : 'bg-[#222] text-neutral-400 border border-white/5'
              }`}
            >
              {settings.vibration ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Debug Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0a0a0a] border border-white/5 stat-box-green">
            <div className="flex items-center gap-3">
              <Bug className={`w-5 h-5 ${settings.debugMode ? 'text-emerald-400' : 'text-neutral-600'}`} />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">DEBUG OVERLAY</div>
                <div className="text-[11px] text-white/40">FPS & grid coordinates (N=Skip, X=Powerup)</div>
              </div>
            </div>
            <button
              onClick={() => toggle('debugMode')}
              className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs transition cursor-pointer ${
                settings.debugMode
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'bg-[#222] text-neutral-400 border border-white/5'
              }`}
            >
              {settings.debugMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Reset High Scores Button */}
        <button
          onClick={onResetScores}
          className="w-full py-3 px-4 rounded-xl bg-[#1e1e1e] hover:bg-red-950/40 text-neutral-400 hover:text-red-400 font-bold text-xs uppercase tracking-wider border border-white/10 hover:border-red-500/40 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>RESET HIGH SCORES</span>
        </button>
      </div>
    </div>
  );
};
