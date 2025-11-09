/**
 * Utility functions for generating transaction details JSON
 * Creates structured JSON for transactionFrom and transactionTo fields
 */

export interface TransactionDetails {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  description: string;
  contact?: string;
  email?: string;
  captured: boolean;
  entity: string;
  international: boolean;
  vpa?: string;
  upi?: {
    vpa: string;
    payer_account_type: string;
  };
  acquirer_data?: {
    rrn: string;
  };
}

/**
 * Generates transaction details JSON for transactionFrom/transactionTo fields
 * @param details - Basic transaction details
 * @returns JSON string for transaction details
 */
export const generateTransactionDetails = (details: {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  description: string;
  contact?: string;
  email?: string;
  vpa?: string;
  rrn?: string;
}): string => {
  const transactionDetails: TransactionDetails = {
    id: details.id,
    amount: details.amount,
    currency: details.currency,
    method: details.method,
    status: details.status,
    description: details.description,
    contact: details.contact || "+919818222176",
    email: details.email || "void@razorpay.com",
    captured: true,
    entity: "payment",
    international: false,
    vpa: details.vpa || "deeproganguly-1@okaxis",
    upi: details.method === "upi" ? {
      vpa: details.vpa || "deeproganguly-1@okaxis",
      payer_account_type: "bank_account"
    } : undefined,
    acquirer_data: details.rrn ? {
      rrn: details.rrn
    } : undefined
  };

  return JSON.stringify(transactionDetails);
};

/**
 * Generates a unique transaction ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique transaction ID
 */
export const generateTransactionId = (prefix: string = "pay"): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`.toUpperCase();
};

/**
 * Generates a unique order ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique order ID
 */
export const generateOrderId = (prefix: string = "order"): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`.toUpperCase();
};

/**
 * Generates RRN (Retrieval Reference Number) for UPI transactions
 * @returns 12-digit RRN
 */
export const generateRRN = (): string => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

/**
 * Validates transaction details before generating JSON
 * @param details - Transaction details to validate
 * @returns Validation result with errors if any
 */
export const validateTransactionDetails = (details: {
  amount: number;
  currency: string;
  method: string;
  status: string;
  description: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!details.amount || details.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (!details.currency || details.currency.length !== 3) {
    errors.push("Currency must be a 3-letter code (e.g., INR)");
  }

  if (!details.method) {
    errors.push("Payment method is required");
  }

  if (!details.status) {
    errors.push("Transaction status is required");
  }

  if (!details.description || details.description.trim().length === 0) {
    errors.push("Description is required");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formats transaction details for display
 * @param jsonString - JSON string of transaction details
 * @returns Formatted object or null if invalid
 */
export const parseTransactionDetails = (jsonString: string): TransactionDetails | null => {
  try {
    return JSON.parse(jsonString) as TransactionDetails;
  } catch (error) {
    console.error("Error parsing transaction details:", error);
    return null;
  }
};

/**
 * Gets display-friendly method name
 * @param method - Payment method
 * @returns Display name
 */
export const getMethodDisplayName = (method: string): string => {
  const methodMap: Record<string, string> = {
    upi: "UPI",
    card: "Card",
    wallet: "Wallet",
    cash: "Cash"
  };
  return methodMap[method.toLowerCase()] || method.toUpperCase();
};

/**
 * Gets display-friendly status name
 * @param status - Transaction status
 * @returns Display name
 */
export const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    captured: "Captured",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    success: "Success"
  };
  return statusMap[status.toLowerCase()] || status.toUpperCase();
};

/**
 * Payment method specific field configurations
 */
export interface PaymentMethodField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'number';
  placeholder: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
  };
}

export interface PaymentMethodConfig {
  fields: PaymentMethodField[];
  icon: string;
  description: string;
  defaultValues: Record<string, string>;
}

/**
 * Gets payment method specific field configuration
 * Simplified to only use account numbers
 * @returns Field configuration
 */
export const getPaymentMethodConfig = (): PaymentMethodConfig => {
  // Return a simple account number field for all payment methods
  return {
    fields: [
      {
        key: 'account',
        label: 'Account Number',
        type: 'text',
        placeholder: 'Enter account number',
        required: true,
        validation: {
          minLength: 5,
          maxLength: 50
        }
      }
    ],
    icon: '💰',
    description: 'Account details',
    defaultValues: {
      account: ''
    }
  };
};

/**
 * Gets default values for payment method fields
 * @returns Default field values
 */
export const getDefaultPaymentValues = (): Record<string, string> => {
  const config = getPaymentMethodConfig();
  return config.defaultValues;
};

/**
 * Generates a simplified transaction details JSON with only account number
 * @param accountNumber - Account number for From/To
 * @returns JSON string for transaction details
 */
export const generateSimplifiedTransactionDetails = (accountNumber: string): string => {
  const transactionDetails = {
    account: accountNumber || 'N/A'
  };

  return JSON.stringify(transactionDetails);
};

/**
 * Validates payment method specific fields
 * @param values - Field values to validate
 * @returns Validation result with errors if any
 */
export const validatePaymentFields = (values: Record<string, string>): { isValid: boolean; errors: Record<string, string> } => {
  const config = getPaymentMethodConfig();
  const errors: Record<string, string> = {};

  config.fields.forEach(field => {
    const value = values[field.key] || '';
    
    if (field.required && !value.trim()) {
      errors[field.key] = `${field.label} is required`;
      return;
    }

    if (value && field.validation) {
      if (field.validation.pattern && !field.validation.pattern.test(value)) {
        errors[field.key] = `${field.label} format is invalid`;
      }
      
      if (field.validation.minLength && value.length < field.validation.minLength) {
        errors[field.key] = `${field.label} must be at least ${field.validation.minLength} characters`;
      }
      
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        errors[field.key] = `${field.label} must not exceed ${field.validation.maxLength} characters`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
