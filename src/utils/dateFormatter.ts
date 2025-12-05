/**
 * Format date and time to IST (Indian Standard Time) format
 * @param dateString - Date string or Date object to format
 * @returns Formatted date and time string in IST, or 'N/A' if invalid
 */
export const formatDateTimeToIST = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Format to IST (Asia/Kolkata timezone)
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // 12-hour format with AM/PM
    });
  } catch (error) {
    console.error('Error formatting date to IST:', error);
    return 'N/A';
  }
};

/**
 * Format date only to IST (Indian Standard Time) format
 * @param dateString - Date string or Date object to format
 * @returns Formatted date string in IST, or 'N/A' if invalid
 */
export const formatDateToIST = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Format to IST (Asia/Kolkata timezone) - date only
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date to IST:', error);
    return 'N/A';
  }
};

/**
 * Format time only to IST (Indian Standard Time) format
 * @param dateString - Date string or Date object to format
 * @returns Formatted time string in IST, or 'N/A' if invalid
 */
export const formatTimeToIST = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Format to IST (Asia/Kolkata timezone) - time only
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // 12-hour format with AM/PM
    });
  } catch (error) {
    console.error('Error formatting time to IST:', error);
    return 'N/A';
  }
};

/**
 * Convert datetime-local input value (local time) to ISO UTC format for API submission
 * @param datetimeLocalValue - datetime-local input value (e.g., "2025-12-07T10:00")
 * @returns ISO UTC string (e.g., "2025-12-07T04:30:00.000Z") or empty string if invalid
 * 
 * @example
 * // User in IST (UTC+5:30) enters 10:00 AM local time
 * convertDatetimeLocalToUTC("2025-12-07T10:00")
 * // Returns: "2025-12-07T04:30:00.000Z" (converted to UTC)
 */
export const convertDatetimeLocalToUTC = (datetimeLocalValue: string | null | undefined): string => {
  if (!datetimeLocalValue) return '';
  
  try {
    // datetime-local gives format "YYYY-MM-DDTHH:mm" in local timezone
    // Create Date object which interprets it as local time
    const date = new Date(datetimeLocalValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Convert to ISO UTC format for API
    return date.toISOString();
  } catch (error) {
    console.error('Error converting datetime-local to UTC:', error);
    return '';
  }
};

/**
 * Convert ISO UTC string from API to datetime-local input format (local time)
 * @param isoUTCString - ISO UTC string (e.g., "2025-12-07T04:30:00.000Z")
 * @returns datetime-local format string (e.g., "2025-12-07T10:00") or empty string if invalid
 * 
 * @example
 * // API returns UTC time
 * convertUTCToDatetimeLocal("2025-12-07T04:30:00.000Z")
 * // Returns: "2025-12-07T10:00" (converted to user's local time - IST adds 5:30 hours)
 */
export const convertUTCToDatetimeLocal = (isoUTCString: string | null | undefined): string => {
  if (!isoUTCString) return '';
  
  try {
    // Parse the UTC date
    const date = new Date(isoUTCString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as datetime-local input value in local timezone
    // datetime-local expects "YYYY-MM-DDTHH:mm" format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error converting UTC to datetime-local:', error);
    return '';
  }
};

/**
 * Format a Date object to datetime-local input format (local time)
 * Useful for calculated dates that need to be displayed in datetime-local inputs
 * @param date - Date object
 * @returns datetime-local format string (e.g., "2025-12-07T10:00") or empty string if invalid
 * 
 * @example
 * // Calculate end time by adding hours to start time
 * const startTime = new Date("2025-12-07T10:00");
 * const endTime = new Date(startTime.getTime() + (12 * 60 * 60 * 1000));
 * formatDateToDatetimeLocal(endTime)
 * // Returns: "2025-12-07T22:00"
 */
export const formatDateToDatetimeLocal = (date: Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as datetime-local input value in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date to datetime-local:', error);
    return '';
  }
};

