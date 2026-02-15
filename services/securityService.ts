
import CryptoJS from 'crypto-js';

const SECRET_KEY = "krmzi-secure-vault-2025";

/**
 * تشفير معرف الحلقة مع طابع زمني
 */
export function encryptEpisodeId(episodeId: string): string {
  const timestamp = Date.now();
  const data = `${episodeId}:${timestamp}`;
  const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
}

/**
 * فك تشفير البيانات المشرة
 */
export function decryptEpisodeId(encryptedData: string): { episodeId: string; timestamp: number } | null {
  try {
    const decoded = decodeURIComponent(encryptedData);
    const bytes = CryptoJS.AES.decrypt(decoded, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted || !decrypted.includes(':')) return null;
    
    const [episodeId, timestamp] = decrypted.split(':');
    return { episodeId, timestamp: parseInt(timestamp) };
  } catch (error) {
    return null;
  }
}

/**
 * التحقق من صلاحية الطابع الزمني (افتراضياً 30 دقيقة)
 */
export function isValidTimestamp(timestamp: number, maxAgeMinutes: number = 30): boolean {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;
  return (now - timestamp) <= maxAge;
}

/**
 * التحقق من وجود مانع إعلانات (لضمان عمل App.tsx)
 */
export const checkAdblock = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const fakeAd = document.createElement('div');
      fakeAd.className = 'adsbox adunit ads ad-unit advertisement';
      fakeAd.setAttribute('style', 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;');
      document.body.appendChild(fakeAd);
      window.setTimeout(() => {
        const isBlocked = fakeAd.offsetHeight === 0 || fakeAd.offsetParent === null;
        document.body.removeChild(fakeAd);
        resolve(isBlocked);
      }, 200);
    } catch { resolve(false); }
  });
};

/**
 * التحقق من وجود VPN
 */
export const checkVPN = (): boolean => {
  try {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return !!(connection && connection.type === 'vpn');
  } catch { return false; }
};
