
/**
 * وظائف حماية وتشفير المعرفات (Simple Obfuscation)
 */
export const encryptId = (id: string): string => {
  try {
    return btoa(id).replace(/=/g, '');
  } catch (e) { return id; }
};

export const decryptId = (encrypted: string): string => {
  try {
    return atob(encrypted);
  } catch (e) { return encrypted; }
};

/**
 * يقوم بتحويل الـ vid أو المعرفات الخاصة بالسيرفرات إلى روابط مشغلات مباشرة
 */
export const resolveVideoUrl = (vid: string, serverName?: string): string => {
  if (!vid) return "";

  // إذا كان الرابط كاملاً بالفعل، نعيده كما هو
  if (vid.startsWith('http')) return vid;

  const sName = (serverName || "").toLowerCase();

  // منطق التحويل الذكي (Smart Resolver)
  if (sName.includes('ok')) return `https://ok.ru/videoembed/${vid}`;
  if (sName.includes('red') || sName.includes('dood')) return `https://dood.li/e/${vid}`;
  if (sName.includes('estream')) return `https://embedstream.me/embed-${vid}.html`;

  // الافتراضي (بوابة قرمزي)
  return `https://krmzi.quest/play.php?vid=${vid}`;
};
