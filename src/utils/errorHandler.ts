/**
 * Extract error message from various error formats
 * Prioritizes backend error messages over generic ones
 */
export const getErrorMessage = (error: any, fallback: string = 'An error occurred'): string => {
  // Check for backend error message in response.data
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check for error message in response.data.error
  if (error?.response?.data?.error) {
    return typeof error.response.data.error === 'string' 
      ? error.response.data.error 
      : error.response.data.error.message || fallback;
  }
  
  // Check for direct error message
  if (error?.message) {
    return error.message;
  }
  
  // Check for string error
  if (typeof error === 'string') {
    return error;
  }
  
  // Return fallback
  return fallback;
};

/**
 * Helper to show error alert with proper message extraction
 */
export const showErrorAlert = (error: any, title: string = 'Error', fallback?: string) => {
  const message = getErrorMessage(error, fallback);
  return { title, message };
};

/**
 * Extract error message for Redux thunks
 * Returns the message to be used with rejectWithValue
 */
export const getThunkErrorMessage = (error: any): string => {
  return getErrorMessage(error, 'Operation failed');
};
