import imageCompression from 'browser-image-compression';

export async function compressImage(file) {
  if (!file) return null;

  const options = {
    maxSizeMB: 0.5,          // Compress to max ~500KB
    maxWidthOrHeight: 1200,  // Scale down dimensions to max 1200px width/height
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, falling back to original file:', error);
    return file;
  }
}