import type { User } from '@/store/api/types';

/**
 * Extract user display name from cstmCreatedBy or cstmUpdatedBy field
 * Handles both string (ID) and User object formats
 */
export const getUserDisplayName = (userField: string | User | User[] | undefined): string => {
  if (!userField) return 'N/A';
  
  // Handle array case (for cstmUpdatedBy which can be an array)
  if (Array.isArray(userField)) {
    if (userField.length === 0) return 'N/A';
    // Take the first user from the array
    const user = userField[0];
    return typeof user === 'string' ? user : user.username || user.email || 'Unknown User';
  }
  
  // Handle single user case
  if (typeof userField === 'string') {
    return userField; // Return the ID if it's just a string
  }
  
  // Handle User object case
  return userField.username || userField.email || 'Unknown User';
};

/**
 * Extract user email from cstmCreatedBy or cstmUpdatedBy field
 * Handles both string (ID) and User object formats
 */
export const getUserEmail = (userField: string | User | User[] | undefined): string => {
  if (!userField) return '';
  
  // Handle array case
  if (Array.isArray(userField)) {
    if (userField.length === 0) return '';
    const user = userField[0];
    return typeof user === 'string' ? '' : user.email || '';
  }
  
  // Handle single user case
  if (typeof userField === 'string') {
    return ''; // No email available if it's just an ID
  }
  
  // Handle User object case
  return userField.email || '';
};
