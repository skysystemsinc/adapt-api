import dayjs from 'dayjs';

export function calculateDaysCount(startDate: Date): number {
  const start = dayjs(startDate);
  const now = dayjs();
  const minutesDiff = now.diff(start, 'minute');
  return Math.floor(minutesDiff / (24 * 60));
}


export function calculateBusinessDays(startDate: Date): number {
  const start = dayjs(startDate);
  const now = dayjs();
  
  let businessDays = 0;
  let currentTime = start;
  const oneDayInMinutes = 24 * 60; // 1440 minutes

  
  while (currentTime.add(oneDayInMinutes, 'minute').isBefore(now) || currentTime.add(oneDayInMinutes, 'minute').isSame(now, 'minute')) {
  
    const dayOfWeek = currentTime.day();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    currentTime = currentTime.add(oneDayInMinutes, 'minute');
  }

  return businessDays;
}


export function isApplicationOverdue(startDate: Date): boolean {
  return calculateBusinessDays(startDate) > 1;
}

