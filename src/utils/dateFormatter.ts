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

