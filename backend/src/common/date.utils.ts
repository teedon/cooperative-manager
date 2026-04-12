/**
 * Add N months to a date while preserving the anchor day-of-month.
 *
 * JavaScript's Date.setMonth() overflows into the next month when the target
 * month has fewer days than the source (e.g. Jan 31 + 1 month → March 3).
 * This function avoids that by using integer year/month arithmetic and clamping
 * the day to the last valid day of the target month.
 *
 * Examples:
 *   addMonthsWithAnchor(Jan 31, 1, 31)  → Feb 28 (or Feb 29 in leap year)
 *   addMonthsWithAnchor(Jan 31, 2, 31)  → Mar 31
 *   addMonthsWithAnchor(Nov 30, 3, 30)  → Feb 28 (or 29), NOT Mar 2
 */
export function addMonthsWithAnchor(date: Date, months: number, anchorDay: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;

  // Last day of the target month
  const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(anchorDay, daysInTarget);

  return new Date(targetYear, targetMonth, targetDay);
}

/**
 * Return the next due date after `currentDate` given a frequency and an anchor
 * day-of-month (used for monthly/quarterly/yearly frequencies so the day is
 * always preserved or clamped to the last day of the target month).
 *
 * For daily, weekly, and biweekly frequencies the anchor day is irrelevant —
 * we simply add the exact number of days.
 */
export function getNextScheduleDate(
  currentDate: Date,
  frequency: string,
  anchorDay: number,
): Date {
  switch (frequency) {
    case 'daily':
      return new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1,
      );
    case 'weekly':
      return new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 7,
      );
    case 'biweekly':
      return new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 14,
      );
    case 'monthly':
      return addMonthsWithAnchor(currentDate, 1, anchorDay);
    case 'quarterly':
      return addMonthsWithAnchor(currentDate, 3, anchorDay);
    case 'yearly':
      return addMonthsWithAnchor(currentDate, 12, anchorDay);
    default:
      return addMonthsWithAnchor(currentDate, 1, anchorDay);
  }
}
