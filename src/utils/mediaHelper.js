/**
 * central helper to insert auto optimization parameters into Cloudinary URLs.
 * Inserts f_auto (auto format) and q_auto (auto quality) right after /upload/.
 */
const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return url;
  }

  // Only apply to upload resources
  if (!url.includes('/image/upload/') && !url.includes('/video/upload/')) {
    return url;
  }

  // Bypass if already has transformations applied
  if (url.includes('/f_auto') || url.includes('/q_auto')) {
    return url;
  }

  const uploadPart = '/upload/';
  const index = url.indexOf(uploadPart);
  if (index === -1) return url;

  const prefix = url.substring(0, index + uploadPart.length);
  const suffix = url.substring(index + uploadPart.length);

  return `${prefix}f_auto,q_auto/${suffix}`;
};

/**
 * Formats a media or upload path to point to the correct backend host.
 * Supports both development (proxied relative paths) and production (fully-qualified Vercel backend URLs).
 * Automatically injects Cloudinary auto optimizations when applicable.
 * 
 * @param {string} url - The image or file URL/path.
 * @returns {string} The fully formatted URL.
 */
export const getUploadUrl = (url) => {
  if (!url) return '';

  // Apply automatic Cloudinary CDN optimization if applicable
  if (url.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(url);
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // VITE_API_URL is usually e.g. "https://your-backend.vercel.app/api" or "/api"
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  return `${baseUrl}${url}`;
};

