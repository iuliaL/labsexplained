/**
 * Formats a date string to the German format (DD.MM.YYYY)
 * @param dateString - The date string to format
 * @returns Formatted date string in DD.MM.YYYY format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Checks if a string is a valid date
 * @param dateString - The date string to validate
 * @returns boolean indicating if the date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
