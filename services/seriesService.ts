
import { Series, Episode, Server } from '../types';
import { encryptEpisodeId } from './securityService';

let cachedCombinedData: Series[] | null = null;
let rawSeriesData: any[] = [];

export const loadAllData = async (): Promise<Series[]> => {
  if (cachedCombinedData) return cachedCombinedData;
  try {
    const seriesRes = await fetch('/data.json');
    if (seriesRes.ok) {
      const seriesJson = await seriesRes.json();
      rawSeriesData = Array.isArray(seriesJson) ? seriesJson : (seriesJson.data || []);
    }
    
    const dailyRes = await fetch('/datadaily.json').catch(() => null);
    const rawDailyData = dailyRes && dailyRes.ok ? await dailyRes.json() : [];

    const formattedSeries: Series[] = rawSeriesData.map(item => ({
      title: item.series_name || item.title || "بدون عنوان",
      poster: item.poster,
      description: item.description || "لا يوجد وصف",
      type: (item.type === "مدبلج" ? "مدبلج" : "مترجم") as any,
      rating: item.rating || 8.5,
      isDaily: false,
      series_name: item.series_name,
      episodes: item.episodes
    }));

    const formattedDaily: Series[] = rawDailyData.map((item: any) => ({
      title: item.name || item.title || "عمل كوري",
      poster: item.thumbnail_720_url || item.poster,
      description: item.description || "وصف العمل الكوري",
      type: "أعمال كورية" as any,
      rating: item.rating || 9.0,
      isDaily: true,
      direct_player_url: item.player_url || item.direct_url,
      episodes: []
    }));

    cachedCombinedData = [...formattedSeries, ...formattedDaily];
  } catch (err) {
    cachedCombinedData = [];
  }
  return cachedCombinedData;
};

export const fetchSeriesList = async (page: number, limit: number = 24) => {
  const allData = await loadAllData();
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  return { 
    data: allData.slice(startIndex, endIndex), 
    hasMore: endIndex < allData.length,
    total: allData.length
  };
};

export const fetchEpisodesForSeries = async (series: Series): Promise<Episode[]> => {
  try {
    if (series.isDaily && series.direct_player_url) {
      const secureToken = encryptEpisodeId(`daily_${series.title}`);
      return [{
        num: 1,
        title: "المشغل الرئيسي",
        direct_url: `/api/secure-embed/${secureToken}`,
        page: "",
        id: `daily_${Date.now()}`,
        is_daily: true
      }];
    }

    if (rawSeriesData.length === 0) await loadAllData();
    const found = rawSeriesData.find(s => s.series_name === series.series_name || s.series_name === series.title);
    
    if (found && found.episodes) {
      return found.episodes.map((ep: any) => {
        const secureToken = encryptEpisodeId(ep.id);
        return {
          num: parseInt(ep.episode_number) || 0,
          title: ep.title || `الحلقة ${ep.episode_number}`,
          direct_url: `/api/secure-embed/${secureToken}`,
          page: "",
          id: ep.id,
          secure_token: secureToken
        };
      }).sort((a: any, b: any) => a.num - b.num);
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const fetchLiveServers = async (pageUrl: string): Promise<Server[]> => {
  try {
    if (!pageUrl || !pageUrl.startsWith('http')) return [];
    const response = await fetch(`/api/watch?url=${encodeURIComponent(pageUrl)}`);
    return response.ok ? await response.json() : [];
  } catch (err) {
    return [];
  }
};
