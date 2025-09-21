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
 * @param method - Payment method
 * @returns Field configuration for the method
 */
export const getPaymentMethodConfig = (method: string): PaymentMethodConfig => {
  switch (method.toLowerCase()) {
    case 'upi':
      return {
        fields: [
          {
            key: 'vpa',
            label: 'VPA (Virtual Payment Address)',
            type: 'text',
            placeholder: 'user@paytm',
            required: true,
            validation: {
              pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/,
              minLength: 5
            }
          },
          {
            key: 'payer_account_type',
            label: 'Account Type',
            type: 'select',
            placeholder: 'Select account type',
            required: true,
            options: [
              { value: 'bank_account', label: 'Bank Account' },
              { value: 'savings_account', label: 'Savings Account' },
              { value: 'current_account', label: 'Current Account' }
            ]
          }
        ],
        icon: '💳',
        description: 'UPI payment details',
        defaultValues: {
          vpa: 'deeproganguly-1@okaxis',
          payer_account_type: 'bank_account'
        }
      };

    case 'card':
      return {
        fields: [
          {
            key: 'card_number',
            label: 'Card Number',
            type: 'text',
            placeholder: '1234 5678 9012 3456',
            required: true,
            validation: {
              pattern: /^[0-9\s]{13,19}$/,
              minLength: 13,
              maxLength: 19
            }
          },
          {
            key: 'card_holder_name',
            label: 'Card Holder Name',
            type: 'text',
            placeholder: 'John Doe',
            required: true,
            validation: {
              minLength: 2,
              maxLength: 50
            }
          },
          {
            key: 'expiry_month',
            label: 'Expiry Month',
            type: 'select',
            placeholder: 'MM',
            required: true,
            options: Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1).padStart(2, '0'),
              label: String(i + 1).padStart(2, '0')
            }))
          },
          {
            key: 'expiry_year',
            label: 'Expiry Year',
            type: 'select',
            placeholder: 'YYYY',
            required: true,
            options: Array.from({ length: 10 }, (_, i) => {
              const year = new Date().getFullYear() + i;
              return { value: String(year), label: String(year) };
            })
          },
          {
            key: 'cvv',
            label: 'CVV',
            type: 'text',
            placeholder: '123',
            required: true,
            validation: {
              pattern: /^[0-9]{3,4}$/,
              minLength: 3,
              maxLength: 4
            }
          },
          {
            key: 'network',
            label: 'Card Network',
            type: 'select',
            placeholder: 'Select network',
            required: true,
            options: [
              { value: 'Visa', label: 'Visa' },
              { value: 'MasterCard', label: 'MasterCard' },
              { value: 'RuPay', label: 'RuPay' },
              { value: 'American Express', label: 'American Express' }
            ]
          }
        ],
        icon: '💳',
        description: 'Credit/Debit card details',
        defaultValues: {
          card_number: '',
          card_holder_name: '',
          expiry_month: '',
          expiry_year: '',
          cvv: '',
          network: 'Visa'
        }
      };


    case 'wallet':
      return {
        fields: [
          {
            key: 'wallet_provider',
            label: 'Wallet Provider',
            type: 'select',
            placeholder: 'Select wallet',
            required: true,
            options: [
              { value: 'Paytm', label: 'Paytm' },
              { value: 'PhonePe', label: 'PhonePe' },
              { value: 'Google Pay', label: 'Google Pay' },
              { value: 'Amazon Pay', label: 'Amazon Pay' },
              { value: 'Mobikwik', label: 'Mobikwik' }
            ]
          },
          {
            key: 'wallet_id',
            label: 'Wallet ID',
            type: 'text',
            placeholder: 'wallet_123456',
            required: true,
            validation: {
              minLength: 5,
              maxLength: 20
            }
          },
          {
            key: 'phone_number',
            label: 'Phone Number',
            type: 'tel',
            placeholder: '+91 9876543210',
            required: true,
            validation: {
              pattern: /^\+?[1-9]\d{1,14}$/,
              minLength: 10,
              maxLength: 15
            }
          }
        ],
        icon: '👛',
        description: 'Digital wallet details',
        defaultValues: {
          wallet_provider: 'Paytm',
          wallet_id: '',
          phone_number: '+919876543210'
        }
      };

    case 'cash':
      return {
        fields: [
          {
            key: 'receipt_number',
            label: 'Receipt Number',
            type: 'text',
            placeholder: 'RCP-123456',
            required: true,
            validation: {
              pattern: /^[A-Z]{3}-[0-9]{6}$/,
              minLength: 10,
              maxLength: 10
            }
          },
          {
            key: 'collected_by',
            label: 'Collected By',
            type: 'text',
            placeholder: 'Staff Name',
            required: true,
            validation: {
              minLength: 2,
              maxLength: 50
            }
          },
          {
            key: 'location',
            label: 'Collection Location',
            type: 'text',
            placeholder: 'Office/Store Location',
            required: true,
            validation: {
              minLength: 3,
              maxLength: 100
            }
          }
        ],
        icon: '💵',
        description: 'Cash payment details',
        defaultValues: {
          receipt_number: `RCP-${Date.now()}`,
          collected_by: '',
          location: ''
        }
      };

    default:
      return {
        fields: [],
        icon: '💰',
        description: 'Payment details',
        defaultValues: {}
      };
  }
};

/**
 * Gets default values for payment method fields
 * @param method - Payment method
 * @returns Default field values
 */
export const getDefaultPaymentValues = (method: string): Record<string, string> => {
  const config = getPaymentMethodConfig(method);
  return config.defaultValues;
};

/**
 * Generates a simplified transaction details JSON with only essential fields
 * @param details - Basic transaction details
 * @returns JSON string for transaction details
 */
export const generateSimplifiedTransactionDetails = (details: {
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
  const transactionDetails = {
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
    ...(details.method === "upi" && {
      vpa: details.vpa || "deeproganguly-1@okaxis",
      upi: {
        vpa: details.vpa || "deeproganguly-1@okaxis",
        payer_account_type: "bank_account"
      }
    }),
    ...(details.rrn && {
      acquirer_data: {
        rrn: details.rrn
      }
    })
  };

  return JSON.stringify(transactionDetails);
};

/**
 * Validates payment method specific fields
 * @param method - Payment method
 * @param values - Field values to validate
 * @returns Validation result with errors if any
 */
export const validatePaymentFields = (method: string, values: Record<string, string>): { isValid: boolean; errors: Record<string, string> } => {
  const config = getPaymentMethodConfig(method);
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
