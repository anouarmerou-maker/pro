
import React, { useState, useEffect } from 'react';
import { Play, ShieldCheck, Lock, Loader2, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onStartPlay?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, onStartPlay }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [adSeconds, setAdSeconds] = useState(3); // تقليل وقت الانتظار ليكون أسرع
  const [canSkip, setCanSkip] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);

  useEffect(() => {
    if (videoUrl) {
      setIsLoading(true);
      setShowAd(true);
      setAdSeconds(3);
      setCanSkip(false);
      setIsEncrypted(false);
      const timer = setTimeout(() => setIsEncrypted(true), 800);
      return () => clearTimeout(timer);
    }
  }, [videoUrl]);

  useEffect(() => {
    let timer: number;
    if (showAd && adSeconds > 0) {
      timer = window.setInterval(() => {
        setAdSeconds((prev) => prev - 1);
      }, 1000);
    } else if (adSeconds === 0) {
      setCanSkip(true);
    }
    return () => clearInterval(timer);
  }, [showAd, adSeconds]);

  const handleSkipAd = () => {
    if (onStartPlay) onStartPlay();
    setShowAd(false);
  };

  const preventInspect = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="relative w-full aspect-video bg-[#050505] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-800/50 group"
      onContextMenu={preventInspect}
    >
      {videoUrl ? (
        <div className="w-full h-full relative">
          <iframe 
            src={videoUrl} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen
            onLoad={() => setTimeout(() => setIsLoading(false), 500)}
            title={title || "Secure Player"}
            className={`block transition-opacity duration-700 ${isLoading || showAd ? 'opacity-0' : 'opacity-100'}`}
            sandbox="allow-forms allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups"
            allow="autoplay; fullscreen; encrypted-media"
          ></iframe>

          {showAd && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020202]">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="w-full h-full bg-gradient-to-br from-red-900/40 via-black to-zinc-900/20"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 px-6 text-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-red-600/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center border border-red-600/20 animate-pulse">
                     <Lock size={32} className="text-red-500" />
                  </div>
                  {isEncrypted && (
                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-green-500 text-black p-1.5 rounded-full animate-bounce">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 md:space-y-3">
                  <h4 className="text-sm md:text-xl font-black text-white italic uppercase tracking-tighter">نفق بث مشفر</h4>
                  <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold max-w-[280px] leading-relaxed italic">
                    جاري التحقق من هوية المشاهد وعزل المصدر عبر نفق آمن.
                  </p>
                </div>
              </div>

              <div className="absolute bottom-6 md:bottom-10 right-6 left-6 md:left-auto">
                {!canSkip ? (
                  <div className="bg-zinc-900/80 backdrop-blur-2xl px-6 py-5 rounded-xl border border-white/5 flex items-center justify-center gap-4 shadow-2xl">
                    <Loader2 className="animate-spin text-red-600" size={16} />
                    <span className="text-[10px] md:text-[9px] font-black text-white uppercase tracking-widest italic">Encrypted ({adSeconds}s)</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleSkipAd}
                    className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 md:px-10 py-5 rounded-xl flex items-center justify-center gap-3 font-black text-xs md:text-sm shadow-xl transition-all active:scale-95 group/skip"
                  >
                    بدء المشاهدة
                    <SkipForward size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          {(isLoading && !showAd) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
              <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Secure Tunnelling...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-6 bg-zinc-950/40 p-6">
          <div className="w-24 h-24 bg-zinc-900/50 rounded-[2.5rem] flex items-center justify-center border border-zinc-800">
             <ShieldCheck size={48} className="text-zinc-800" />
          </div>
          <h2 className="font-black text-lg text-white italic uppercase tracking-tighter">قرمزي <span className="text-red-600">PRO</span></h2>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
