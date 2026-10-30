/**
 * Dynamic Client-Side Thumbnail Scaler
 * Converts Google usercontent and YouTube thumbnails to user-preferred quality
 * Based on active settings (Data Saver, Image Quality)
 */
export function getOptimizedThumbnail(url, settings = {}) {
  if (!url || typeof url !== 'string') return '';
  const { dataSaver = false, imageQuality = 'high' } = settings;

  let targetDim = 'w544-h544';
  if (dataSaver || imageQuality === 'low') {
    targetDim = 'w120-h120';
  } else if (imageQuality === 'normal') {
    targetDim = 'w300-h300';
  }

  // Google usercontent / yt3 usercontent pattern
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    if (url.includes('=w') || url.includes('=s')) {
      return url.replace(/=(w\d+-h\d+|s\d+)[^?&]*/, `=${targetDim}-l90-rj`);
    }
    return `${url}=${targetDim}-l90-rj`;
  }

  // YouTube standard image pattern: /vi/{id}/default.jpg, mqdefault.jpg, hqdefault.jpg, maxresdefault.jpg
  if (url.includes('i.ytimg.com/vi/')) {
    if (dataSaver || imageQuality === 'low') {
      return url.replace(/\/(default|hqdefault|maxresdefault|sddefault)\.jpg/, '/mqdefault.jpg');
    }
    if (imageQuality === 'normal') {
      return url.replace(/\/(default|mqdefault|maxresdefault|sddefault)\.jpg/, '/hqdefault.jpg');
    }
    return url.replace(/\/(default|mqdefault|hqdefault|sddefault)\.jpg/, '/maxresdefault.jpg');
  }

  return url;
}
