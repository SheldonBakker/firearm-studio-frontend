export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  return { daysInMonth, leadingBlanks };
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
