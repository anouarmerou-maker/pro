
export interface Server {
  name: string;
  link: string;
}

export interface Episode {
  num: number;
  direct_url: string;
  page: string;
  parsedNum?: number;
  vid?: string;
  page_url?: string;
  stream_url?: string;
  title?: string;
  // Fix: Added missing properties to resolve "Object literal may only specify known properties" errors
  id?: string;
  secure_token?: string;
  is_daily?: boolean;
  _original_url?: string;
}

export interface Series {
  title: string;
  poster: string;
  description: string;
  type: "مترجم" | "مدبلج" | "أعمال كورية";
  series_name?: string;
  clean_name?: string;
  url?: string;
  rating?: number;
  isDaily?: boolean; // حقل لتمييز بيانات دايلي موشن
  direct_player_url?: string; 
  // Fix: Added episodes property to support data loading in seriesService.ts
  episodes?: any[];
}
