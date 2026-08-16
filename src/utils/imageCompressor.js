/**
 * Compresses an image file if it exceeds 5MB using HTML5 Canvas.
 * Maintaining high visual quality (quality 0.8) and aspect ratio.
 * Only JPEG, PNG, WEBP, etc. are compressed. GIFs are untouched to preserve animation.
 * 
 * @param {File} file - The original file selected by the user.
 * @returns {Promise<File>} A Promise that resolves to the compressed File or the original File if no compression was needed or possible.
 */
export const compressImageIfNeeded = async (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size <= maxSize) {
    return file; // Under 5MB, upload original
  }

  // Only compress standard static images
  const compressibleTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!compressibleTypes.includes(file.type.toLowerCase())) {
    return file; // Unsupported type or GIF, bypass compression
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale if maximum dimension exceeds 2048px to save memory and size
        const maxDimension = 2048;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-quality JPEG blob (0.8 quality)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create compressed file keeping the original name
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            // If compressed file is somehow larger than original, return original
            if (compressedFile.size >= file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
