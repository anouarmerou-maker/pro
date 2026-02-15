
import React from 'react';
import { LayoutGrid, Home, Filter, Sparkles, Zap, Smartphone } from 'lucide-react';

interface SidebarProps {
  filterType: 'الكل' | 'مترجم' | 'مدبلج' | 'أعمال كورية';
  setFilterType: (type: 'الكل' | 'مترجم' | 'مدبلج' | 'أعمال كورية') => void;
  onHomeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filterType, setFilterType, onHomeClick }) => {
  return (
    <>
      {/* القائمة الجانبية للحاسوب (Desktop Sidebar) */}
      <aside className="hidden md:flex fixed right-0 top-0 h-screen md:w-20 lg:w-64 bg-[#020202]/95 backdrop-blur-3xl border-l border-zinc-900/50 flex-col p-6 z-[100] transition-all duration-500">
        <div className="flex items-center gap-4 px-2 mb-12 cursor-pointer group" onClick={onHomeClick}>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0 group-active:scale-90 transition-transform">
            <span className="font-bold text-white text-xl italic">K</span>
          </div>
          <span className="hidden lg:block font-black text-xl text-white uppercase italic tracking-tighter">Krmzi<span className="text-red-600">Pro</span></span>
        </div>

        <nav className="space-y-4">
          <button
            onClick={() => { onHomeClick(); setFilterType('الكل'); }}
            className={`w-full flex items-center gap-5 p-4 rounded-2xl transition-all border ${filterType === 'الكل' ? 'bg-zinc-900/50 text-red-500 border-red-600/10' : 'text-zinc-500 border-transparent hover:bg-zinc-900/30'}`}
          >
            <LayoutGrid size={22} />
            <span className="hidden lg:block font-black text-[11px] uppercase italic tracking-widest">تصفح الكل</span>
          </button>
          
          <div className="hidden lg:flex flex-col gap-1 pr-4 pt-2 border-r border-zinc-800/50 mr-4">
            {(['مترجم', 'مدبلج', 'أعمال كورية'] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)} className={`text-right py-2.5 text-[10px] font-black transition-all hover:pr-2 ${filterType === t ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                • {t}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto hidden lg:block">
           <div className="p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] text-center">
              <Zap className="text-red-600 mx-auto mb-2" size={20} />
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed italic">Fastest Drama Gateway</p>
           </div>
        </div>
      </aside>

      {/* شريط التنقل السفلي للموبايل (Mobile Bottom Navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-[#050505]/95 backdrop-blur-2xl border-t border-zinc-800/50 flex items-center justify-around px-2 z-[1000] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <button onClick={() => { onHomeClick(); setFilterType('الكل'); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${filterType === 'الكل' ? 'text-red-500' : 'text-zinc-500'}`}>
           <Home size={22} className={filterType === 'الكل' ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : ''} />
           <span className="text-[9px] font-black uppercase italic">الرئيسية</span>
        </button>
        
        <button onClick={() => setFilterType('أعمال كورية')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${filterType === 'أعمال كورية' ? 'text-red-500' : 'text-zinc-500'}`}>
           <Sparkles size={22} />
           <span className="text-[9px] font-black uppercase italic">كورية</span>
        </button>

        <div onClick={onHomeClick} className="w-14 h-14 bg-red-600 rounded-2xl -mt-10 flex items-center justify-center shadow-[0_8px_30px_rgba(220,38,38,0.4)] border-4 border-[#020202] active:scale-90 transition-all">
           <span className="font-bold text-white text-2xl italic uppercase">K</span>
        </div>

        <button onClick={() => setFilterType('مترجم')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${filterType === 'مترجم' ? 'text-red-500' : 'text-zinc-500'}`}>
           <Filter size={22} />
           <span className="text-[9px] font-black uppercase italic">مترجم</span>
        </button>
        
        <button onClick={() => setFilterType('مدبلج')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${filterType === 'مدبلج' ? 'text-red-500' : 'text-zinc-500'}`}>
           <Filter size={22} />
           <span className="text-[9px] font-black uppercase italic">مدبلج</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;
