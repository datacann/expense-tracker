import { formatLocalDate, isValidCalendarDate } from './localDate';

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
assert(formatLocalDate(new Date(2026, 9, 5, 0, 30)) === '2026-10-05', 'Yerel tarih UTC nedeniyle kaydı');
assert(isValidCalendarDate('2024-02-29'), 'Artık gün reddedildi');
assert(!isValidCalendarDate('2026-02-29'), 'Geçersiz takvim tarihi kabul edildi');
assert(!isValidCalendarDate('2026-13-01'), 'Geçersiz ay kabul edildi');
assert(!isValidCalendarDate(''), 'Boş tarih kabul edildi');
console.log('Local date tests passed');
