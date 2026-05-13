/**
 * Returns today's date as "YYYY-MM-DD" using the browser's LOCAL timezone.
 * Use this everywhere instead of new Date().toISOString().split('T')[0],
 * which returns the UTC date and causes off-by-one errors for Colombian users
 * after 7 PM (when UTC midnight flips to the next day).
 */
export function localDateStr(offsetDays = 0): string {
  const d = new Date()
  if (offsetDays) d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
