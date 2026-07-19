/**
 * Formats a media or upload path to point to the correct backend host.
 * Supports both development (proxied relative paths) and production (fully-qualified Vercel backend URLs).
 * 
 * @param {string} url - The image or file URL/path.
 * @returns {string} The fully formatted URL.
 */
export const getUploadUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // VITE_API_URL is usually e.g. "https://your-backend.vercel.app/api" or "/api"
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  return `${baseUrl}${url}`;
};
