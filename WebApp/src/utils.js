// Utility functions for PlannerEdu

/**
 * Generate unique ID
 * @returns {string} Random unique identifier
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * Format date for Brazilian locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format date and time for Brazilian locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format time duration in minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted time string
 */
export const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return '0min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h${mins.toString().padStart(2, '0')}min`;
};

/**
 * Convert hours to minutes
 * @param {number} hours - Hours to convert
 * @returns {number} Minutes
 */
export const hoursToMinutes = (hours) => {
  return Math.round(hours * 60);
};

/**
 * Convert minutes to hours
 * @param {number} minutes - Minutes to convert
 * @returns {number} Hours (decimal)
 */
export const minutesToHours = (minutes) => {
  return Math.round((minutes / 60) * 100) / 100;
};

/**
 * Calculate progress percentage
 * @param {number} completed - Completed amount
 * @param {number} total - Total amount
 * @returns {number} Percentage (0-100)
 */
export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.min(Math.round((completed / total) * 100), 100);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Sort array of objects by date
 * @param {Array} array - Array to sort
 * @param {string} dateField - Field name containing date
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortByDate = (array, dateField = 'date', order = 'asc') => {
  return array.sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    
    if (order === 'desc') {
      return dateB - dateA;
    }
    return dateA - dateB;
  });
};

/**
 * Filter array by search term
 * @param {Array} array - Array to filter
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
export const filterBySearch = (array, searchTerm, fields = ['name', 'description']) => {
  if (!searchTerm || searchTerm.trim() === '') return array;
  
  const term = searchTerm.toLowerCase().trim();
  
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
};

/**
 * Group array by field
 * @param {Array} array - Array to group
 * @param {string} field - Field to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, field) => {
  return array.reduce((groups, item) => {
    const key = item[field] || 'uncategorized';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Calculate academic calendar
 * @param {Date} startDate - Start date of semester
 * @param {number} weeks - Number of weeks
 * @param {Array} weekdays - Array of weekdays (0=Sunday, 1=Monday, etc.)
 * @param {Array} holidays - Array of holiday dates
 * @returns {Array} Array of class dates
 */
export const generateAcademicCalendar = (startDate, weeks, weekdays = [1, 3, 5], holidays = []) => {
  const dates = [];
  const start = new Date(startDate);
  const holidayStrings = holidays.map(h => new Date(h).toDateString());
  
  for (let week = 0; week < weeks; week++) {
    weekdays.forEach(weekday => {
      const date = new Date(start);
      date.setDate(start.getDate() + (week * 7) + (weekday - start.getDay()));
      
      // Skip if it's a holiday
      if (!holidayStrings.includes(date.toDateString())) {
        dates.push(date);
      }
    });
  }
  
  return dates;
};

/**
 * Export data to JSON file
 * @param {Object} data - Data to export
 * @param {string} filename - Filename for export
 */
export const exportToJson = (data, filename = 'planneredu-export') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Parsed data
 */
export const importFromJson = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Generate PDF report (placeholder - would need PDF library)
 * @param {Object} data - Data for report
 * @param {string} title - Report title
 */
export const generatePdfReport = (data, title = 'Relatório PlannerEdu') => {
  // This would integrate with a PDF library like jsPDF
  console.log('PDF generation would be implemented here', { data, title });
  alert('Funcionalidade de PDF será implementada em versão futura');
};

/**
 * Get browser info for analytics
 * @returns {Object} Browser information
 */
export const getBrowserInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if device is mobile
 * @returns {boolean} Is mobile device
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Local storage utilities
 */
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Theme utilities
 */
export const theme = {
  isDark: () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  toggle: () => {
    document.documentElement.classList.toggle('dark');
  },
  
  set: (mode) => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};