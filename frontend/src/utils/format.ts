// Định dạng tiền tệ VND và ngày giờ theo múi giờ Asia/Ho_Chi_Minh (DoD trong spec).

const VND = new Intl.NumberFormat('vi-VN');
const DATE = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** 2_600_000 -> "2.600.000" */
export function formatVND(amount: number): string {
  return VND.format(amount);
}

/** 2_600_000 -> "2.600.000đ" */
export function formatMoney(amount: number): string {
  return `${VND.format(amount)}đ`;
}

/** "2026-10-07" -> "07/10/2026" (an toàn với chuỗi rỗng) */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return DATE.format(d);
}

/** ISO datetime -> "07/10/2026 14:30" */
export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return DATE_TIME.format(d);
}

/** Diện tích: 25.5 -> "25,5 m²" */
export function formatArea(area: number): string {
  return `${String(area).replace('.', ',')} m²`;
}

/** Biến đường dẫn ảnh tương đối (uploads/...) thành URL dùng được. */
export function assetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `/${url}`;
}
