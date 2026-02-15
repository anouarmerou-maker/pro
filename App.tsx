
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import { Series, Episode, Server } from './types';
import { fetchSeriesList, fetchEpisodesForSeries, fetchLiveServers } from './services/seriesService';
import { resolveVideoUrl, encryptId } from './services/resolverService';
import { checkAdblock, checkVPN } from './services/securityService';
import { 
  Play, Search, ArrowRight, Zap, LayoutGrid, ChevronRight, ChevronLeft, Loader2, 
  SkipBack, SkipForward, Star, Share2, ShieldCheck, Check, ShieldAlert
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'details'>('home');
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [filterType, setFilterType] = useState<'الكل' | 'مترجم' | 'مدبلج' | 'أعمال كورية'>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEps, setFetchingEps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [adblockActive, setAdblockActive] = useState(false);
  const [vpnActive, setVpnActive] = useState(false);

  const triggerPopunder = useCallback(() => {
    try {
      const hiddenTrigger = document.createElement('a');
      hiddenTrigger.style.display = 'none';
      document.body.appendChild(hiddenTrigger);
      hiddenTrigger.click();
      document.body.removeChild(hiddenTrigger);
    } catch (e) {}
  }, []);

  useEffect(() => {
    // Security checks disabled in development to prevent false positives
    setAdblockActive(false);
    setVpnActive(false);
  }, [view]);

  const normalize = (text: string) => {
    if (!text) return "";
    return text.replace(/مسلسل|برنامج|فيلم|مترجم|مدبلج|الحلقة/g, '').replace(/[()]/g, '').replace(/\s+/g, '').trim().toLowerCase();
  };

  const safeUpdateUrl = (params: string) => {
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", params);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (initializing) return;
    if (view === 'home') {
      document.title = "قرمزي برو | KRMZI PRO";
      const params = new URLSearchParams(window.location.search);
      if (!params.has('s') && !selectedSeries) safeUpdateUrl("/");
    } else if (selectedSeries) {
      const epText = currentEpisode ? ` - الحلقة ${currentEpisode.num}` : "";
      document.title = `${selectedSeries.title}${epText} | قرمزي برو`;
      safeUpdateUrl(`?s=${encodeURIComponent(selectedSeries.title)}${currentEpisode ? `&e=${currentEpisode.num}` : ''}`);
    }
  }, [view, selectedSeries, currentEpisode, initializing]);

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        const response = await fetchSeriesList(1, 10000); 
        if (!isMounted) return;
        if (response && response.data) {
          setSeriesList(response.data);
          const params = new URLSearchParams(window.location.search);
          const sharedS = params.get('s');
          if (sharedS) {
            const decodedS = decodeURIComponent(sharedS);
            const found = response.data.find(s => s.title === decodedS || normalize(s.title) === normalize(decodedS));
            if (found) await handleSeriesClick(found);
          }
        }
      } catch (err) {
        setError("فشل الاتصال بخادم البيانات.");
      } finally {
        setInitializing(false);
      }
    };
    initApp();
    return () => { isMounted = false; };
  }, []);

  const handleSeriesClick = async (series: Series) => {
    triggerPopunder();
    setSelectedSeries(series);
    setView('details');
    setEpisodes([]);
    setCurrentEpisode(null);
    setActiveUrl('');
    setFetchingEps(true);
    try {
      const eps = await fetchEpisodesForSeries(series);
      setEpisodes(eps);
      const params = new URLSearchParams(window.location.search);
      const epNum = params.get('e');
      if (epNum) {
        const foundEp = eps.find(e => e.num === parseInt(epNum));
        if (foundEp) await handleEpisodeClick(foundEp);
        else if (eps.length > 0) await handleEpisodeClick(eps[0]);
      } else if (eps.length > 0) await handleEpisodeClick(eps[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {} finally { setFetchingEps(false); }
  };

  const handleEpisodeClick = async (episode: Episode) => {
    triggerPopunder();
    setCurrentEpisode(episode);
    setLoading(true);
    try {
      if (episode.direct_url) setActiveUrl(episode.direct_url);
      else if (episode.page) {
        const liveServers = await fetchLiveServers(episode.page);
        setActiveUrl(liveServers.length > 0 ? liveServers[0].link : resolveVideoUrl(episode.vid || ""));
      } else setActiveUrl(resolveVideoUrl(episode.vid || ""));
    } catch (e) {
      setActiveUrl(resolveVideoUrl(episode.vid || ""));
    } finally { setLoading(false); }
  };

  const handleShare = async () => {
    if (!selectedSeries) return;
    const shareUrl = `${window.location.origin}/?s=${encodeURIComponent(selectedSeries.title)}${currentEpisode ? `&e=${currentEpisode.num}` : ''}`;
    if (navigator.share) await navigator.share({ title: selectedSeries.title, url: shareUrl }).catch(() => fallbackCopy(shareUrl));
    else fallbackCopy(shareUrl);
  };

  const fallbackCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigation = (direction: 'next' | 'prev') => {
    if (!currentEpisode || episodes.length === 0) return;
    const currentIndex = episodes.findIndex(e => e.num === currentEpisode.num);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < episodes.length) handleEpisodeClick(episodes[newIndex]);
  };

  const filteredItems = useMemo(() => {
    let result = seriesList || [];
    if (filterType !== 'الكل') result = result.filter(s => s.type === filterType);
    if (searchQuery) result = result.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [seriesList, filterType, searchQuery]);

  const paginated = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 flex flex-col md:flex-row font-['Cairo'] overflow-x-hidden relative" dir="rtl">
      <Sidebar filterType={filterType} setFilterType={setFilterType} onHomeClick={() => {setView('home'); setSelectedSeries(null);}} />

      {/* تنبيه الأمان */}
      {(adblockActive || vpnActive) && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center">
           <div className="max-w-md w-full bg-zinc-900 border border-red-600/30 p-8 rounded-[2rem] shadow-2xl">
              <ShieldAlert size={64} className="text-red-600 mx-auto mb-6 animate-pulse" />
              <h2 className="text-xl font-black text-white mb-4 italic uppercase">{adblockActive ? 'مانع الإعلانات نشط' : 'VPN نشط'}</h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-8">يرجى إيقاف الإضافات الخارجية لضمان عمل الموقع بشكل سليم.</p>
              <button onClick={() => window.location.reload()} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all active:scale-95">تحديث الصفحة</button>
           </div>
        </div>
      )}

      {/* الحاوية الرئيسية - تم تعديل الهوامش الجانبية للموبايل لتكون 8px */}
      <main className="flex-1 w-full md:mr-20 lg:mr-64 px-2 sm:px-4 md:p-8 lg:p-12 mb-28 md:mb-0 transition-all duration-500 min-h-screen overflow-y-auto mobile-grid-container">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-12 pt-4">
          <div className="flex items-center gap-3">
            {view === 'details' && (
              <button onClick={() => {setView('home'); setSelectedSeries(null);}} className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all border border-zinc-800 active:scale-90">
                <ArrowRight size={18} className="text-red-500" />
              </button>
            )}
            <h1 className="text-lg md:text-3xl font-black text-white flex items-center gap-2 italic">
              {view === 'home' ? (
                <div className="flex items-center gap-1.5">
                  <Zap className="text-red-600 fill-red-600" size={20} /> 
                  <span>قرمزي <span className="text-red-600 uppercase">برو</span></span>
                </div>
              ) : (
                <span className="truncate max-w-[180px] md:max-w-md lg:max-w-xl">{selectedSeries?.title}</span>
              )}
            </h1>
          </div>
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-red-500" size={14} />
            <input 
              type="text" 
              placeholder="ابحث..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-xs text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-600" 
            />
          </div>
        </header>

        {view === 'home' ? (
          <div className="space-y-8">
            {error ? (
              <div className="p-10 bg-zinc-900/50 rounded-[2rem] text-center border border-red-900/20">
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase italic text-xs">إعادة المحاولة</button>
              </div>
            ) : (
              /* الشبكة: 2 عمود في الموبايل، و6 في الشاشات الكبيرة */
              <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-6 animate-in fade-in duration-500">
                {paginated.map((series, idx) => (
                  <div key={idx} onClick={() => handleSeriesClick(series)} className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-xl md:rounded-[2rem] overflow-hidden mb-2 border border-zinc-800/50 bg-zinc-900 shadow-xl transition-all duration-500 group-hover:border-red-600/50 group-hover:-translate-y-1">
                      <img src={series.poster} alt={series.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/5">
                        <Star size={8} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[8px] font-black text-white">{series.rating}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play fill="white" size={28} className="text-white drop-shadow-2xl" />
                      </div>
                    </div>
                    <div className="px-1 text-right">
                      <h3 className="series-card-title font-black text-[12px] md:text-sm truncate group-hover:text-red-500 text-white transition-colors">{series.title}</h3>
                      <p className="text-[8px] md:text-[9px] text-zinc-600 font-black uppercase italic">{series.type}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-8">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 disabled:opacity-20 transition-all"><ChevronRight size={16} /></button>
                <span className="text-[10px] font-black italic text-zinc-600 uppercase tracking-widest">Page {currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 disabled:opacity-20 transition-all"><ChevronLeft size={16} /></button>
              </div>
            )}
          </div>
        ) : selectedSeries ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="lg:col-span-8 space-y-5">
              <div className="w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-800/50 bg-black aspect-video">
                <VideoPlayer videoUrl={activeUrl} title={selectedSeries.title} onStartPlay={triggerPopunder} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-800/50">
                  <button onClick={() => handleNavigation('prev')} disabled={episodes.findIndex(e => e.num === currentEpisode?.num) <= 0} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 disabled:opacity-20 active:scale-90"><SkipBack size={16} /></button>
                  <div className="flex-1 text-center border-r border-l border-zinc-800">
                    <span className="text-[10px] font-black text-red-500 italic uppercase tracking-tighter">الحلقة {currentEpisode?.num || '??'}</span>
                  </div>
                  <button onClick={() => handleNavigation('next')} disabled={episodes.findIndex(e => e.num === currentEpisode?.num) >= episodes.length - 1} className="p-2 bg-red-600 text-white rounded-lg active:scale-90"><SkipForward size={16} /></button>
                </div>
                <button onClick={handleShare} className="w-full bg-zinc-900 border border-zinc-800 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all">
                  {copied ? <Check size={12} className="text-green-500" /> : <Share2 size={12} className="text-red-500" />} {copied ? 'تم نسخ الرابط' : 'مشاركة العمل'}
                </button>
              </div>

              {!selectedSeries.isDaily && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs md:text-lg font-black flex items-center gap-2 text-white italic uppercase text-right px-1">
                    <LayoutGrid className="text-red-600" size={16} /> قائمة الحلقات ({episodes.length})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {episodes.map((ep, i) => (
                      <button key={i} onClick={() => handleEpisodeClick(ep)} className={`py-3 rounded-lg border-2 font-black text-[10px] transition-all active:scale-90 ${currentEpisode?.num === ep.num ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-500 hover:border-red-600/30'}`}>
                        {ep.num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-4 order-last lg:order-none">
              <aside className="bg-zinc-900/20 backdrop-blur-3xl border border-zinc-800/50 rounded-[2rem] p-5 lg:sticky lg:top-10 shadow-2xl">
                <img src={selectedSeries.poster} className="w-full aspect-[2/3] rounded-xl object-cover mb-4 shadow-xl border border-white/5" alt={selectedSeries.title} />
                <div className="space-y-3 text-right">
                   <h3 className="text-sm md:text-xl font-black text-white leading-tight">{selectedSeries.title}</h3>
                   <div className="flex flex-wrap gap-1.5 justify-end">
                      <span className="bg-red-600/10 text-red-500 px-2 py-0.5 rounded-md text-[9px] font-black border border-red-600/20 italic">{selectedSeries.type}</span>
                      <span className="bg-zinc-800/50 text-zinc-500 px-2 py-0.5 rounded-md text-[9px] font-black italic uppercase tracking-tighter">Ultra HD</span>
                   </div>
                   <p className="text-[10px] md:text-xs text-zinc-500 leading-relaxed italic opacity-80">{selectedSeries.description}</p>
                   <div className="pt-4 border-t border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                         <Star size={12} className="text-yellow-500 fill-yellow-500" />
                         <span className="text-[10px] font-black text-white">{selectedSeries.rating}</span>
                         <span className="text-[8px] text-zinc-600 uppercase font-black">Rating</span>
                      </div>
                      <ShieldCheck size={16} className="text-green-500" />
                   </div>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </main>

      {/* شاشات التحميل */}
      {initializing && (
        <div className="fixed inset-0 bg-[#020202] z-[2000] flex flex-col items-center justify-center p-8">
           <div className="relative mb-6">
             <Loader2 size={48} className="text-red-600 animate-spin" />
             <Zap size={18} className="absolute inset-0 m-auto text-white animate-pulse" />
           </div>
           <h2 className="text-xl font-black text-white italic uppercase tracking-[0.2em]">KRMZI <span className="text-red-600">PRO</span></h2>
           <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.5em] mt-3 italic animate-pulse">Establishing Secure Connection...</p>
        </div>
      )}
    </div>
  );
};

export default App;
