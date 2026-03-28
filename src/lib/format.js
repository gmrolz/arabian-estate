/**
 * Format a price/number string for easy reading (e.g. 1234567 → "1,234,567").
 * Leaves values that contain % unchanged (e.g. "0%").
 */
export function formatNumberReadable(str) {
    if (str == null || str === '') return '';
    const s = String(str).trim();
    if (s.includes('%')) return s;
    const digits = s.replace(/,/g, '').replace(/[^\d]/g, '');
    if (digits === '') return s;
    const num = parseInt(digits, 10);
    if (isNaN(num)) return s;
    return num.toLocaleString('en-EG');
}
