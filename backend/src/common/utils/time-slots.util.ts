const TIME_12H = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const TIME_24H = /^(\d{1,2}):(\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseClockToMinutes(value: string): number | null {
  const trimmed = String(value || '').trim();
  const ampm = trimmed.match(TIME_12H);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    const meridiem = ampm[3].toUpperCase();
    if (meridiem === 'AM') hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
    return hours * 60 + minutes;
  }

  const hhmm = trimmed.match(TIME_24H);
  if (hhmm) {
    const hours = Number(hhmm[1]);
    const minutes = Number(hhmm[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  return null;
}

export function formatMinutesToSlot(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

export function dateOnlyToUtc(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcToDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function todayDateOnly(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentMinutesOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function generateTimeSlots(openingTime: string, closingTime: string, intervalMinutes = 30): string[] {
  const start = parseClockToMinutes(openingTime);
  const end = parseClockToMinutes(closingTime);
  if (start === null || end === null || intervalMinutes <= 0) return [];

  const slots: string[] = [];
  if (end > start) {
    for (let minutes = start; minutes < end; minutes += intervalMinutes) {
      slots.push(formatMinutesToSlot(minutes));
    }
    return slots;
  }

  // Overnight hours, e.g. 18:00 → 02:00
  for (let minutes = start; minutes < 24 * 60; minutes += intervalMinutes) {
    slots.push(formatMinutesToSlot(minutes));
  }
  for (let minutes = 0; minutes < end; minutes += intervalMinutes) {
    slots.push(formatMinutesToSlot(minutes));
  }
  return slots;
}
