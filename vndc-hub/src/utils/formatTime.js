/**
 * Returns a human-readable relative time string (Vietnamese).
 * @param {string|Date} dateStr - ISO date string or Date object
 */
export const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (mins < 1)   return 'Vừa xong';
  if (mins < 60)  return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'Hôm qua';
  if (days < 7)   return `${days} ngày trước`;
  if (weeks < 4)  return `${weeks} tuần trước`;
  return `${months} tháng trước`;
};
