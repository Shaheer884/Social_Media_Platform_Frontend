import axios from 'axios';
import api from '../services/api';
import { compressImageIfNeeded } from './imageCompressor';

/**
 * Reads a video file's metadata and returns its duration in seconds.
 * 
 * @param {File} file - The video file object.
 * @returns {Promise<number>} Video duration in seconds.
 */
export const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration || 0);
    };
    video.onerror = () => {
      if (video.src) URL.revokeObjectURL(video.src);
      resolve(0);
    };
  });
};

/**
 * Validates a single file against limits before starting the upload.
 * 
 * @param {File} file - The file to validate.
 * @param {string} uploadType - The context of the upload ('post' or 'story').
 * @returns {Promise<{ valid: boolean, error: string }>} Validation result.
 */
export const validateFile = async (file, uploadType = 'post') => {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isImage && !isVideo) {
    return { valid: false, error: `File "${file.name}" is not a supported type. Only images and videos are allowed.` };
  }

  if (isImage) {
    const allowedImageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageMimeTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: `Image "${file.name}" has an unsupported format. Supported: JPG, JPEG, PNG, WEBP, GIF.` };
    }

    const maxImgSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxImgSize) {
      return { valid: false, error: `Image "${file.name}" exceeds the 10MB limit.` };
    }
  }

  if (isVideo) {
    const allowedVideoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm']; // quicktime is MOV
    if (!allowedVideoMimeTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: `Video "${file.name}" has an unsupported format. Supported: MP4, MOV, WEBM.` };
    }

    const maxVidSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxVidSize) {
      return { valid: false, error: `Video "${file.name}" exceeds the 30MB limit.` };
    }

    const duration = await getVideoDuration(file);
    const maxDuration = uploadType === 'story' ? 60 : 300; // 60s for stories, 300s (5m) for posts
    if (duration > maxDuration) {
      const displayLimit = uploadType === 'story' ? '60 seconds' : '5 minutes';
      return { valid: false, error: `Video "${file.name}" exceeds the maximum duration limit of ${displayLimit}.` };
    }
  }

  return { valid: true, error: '' };
};

/**
 * Uploads a file directly to Cloudinary using signed parameters.
 * Automatically compresses images > 5MB first.
 * 
 * @param {object} params
 * @param {File} params.file - File object.
 * @param {string} params.folder - Destination Cloudinary folder name.
 * @param {string} params.resourceType - 'image' or 'video'.
 * @param {function} params.onUploadProgress - Progress callback function.
 * @param {AbortSignal} params.signal - AbortController signal.
 * @returns {Promise<object>} Upload result metadata from Cloudinary.
 */
export const uploadDirectToCloudinary = async ({ file, folder, resourceType, onUploadProgress, signal }) => {
  // 1. Compress image if it exceeds 5MB and is static image
  let fileToUpload = file;
  if (resourceType === 'image') {
    fileToUpload = await compressImageIfNeeded(file);
  }

  // 2. Fetch upload signature from Express backend
  // Note: api response interceptor directly returns data, which in this case will be the JSON payload
  const signRes = await api.get(`/uploads/signature?folder=${folder}&resourceType=${resourceType}`);
  if (!signRes || !signRes.success) {
    throw new Error(signRes?.error || 'Failed to generate upload signature');
  }

  const { signature, timestamp, apiKey, cloudName } = signRes;

  // 3. Construct FormData for Cloudinary
  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  // 4. Post request directly to Cloudinary (using clean Axios instance to avoid bearer header conflicts)
  const response = await axios.post(cloudinaryUrl, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    signal
  });

  return response.data;
};

/**
 * Cleans up a successfully uploaded asset from Cloudinary using publicId.
 * 
 * @param {string} publicId - Cloudinary asset public ID.
 * @param {string} resourceType - 'image' or 'video'.
 * @returns {Promise<object>} Cleanup result.
 */
export const cleanupCloudinaryAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return { success: false, error: 'No publicId provided' };
  try {
    return await api.post('/uploads/cleanup', { publicId, resourceType });
  } catch (err) {
    console.error(`Failed to clean up Cloudinary asset ${publicId}:`, err);
    return { success: false, error: err.message };
  }
};
