/**
 * Formats a date string to the German format (DD.MM.YYYY)
 * @param dateString - The date string to format
 * @returns Formatted date string in DD.MM.YYYY format
 */
export function formatDate(dateString: string, format: string = "DD.MM.YYYY"): string {
  const date = new Date(dateString);

  // Return empty string for invalid dates
  if (isNaN(date.getTime())) return "";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return format
    .replace("DD", day)
    .replace("MM", month)
    .replace("YYYY", year.toString())
    .replace("HH", hours)
    .replace("mm", minutes);
}

/**
 * Checks if a string is a valid date
 * @param dateString - The date string to validate
 * @returns boolean indicating if the date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
