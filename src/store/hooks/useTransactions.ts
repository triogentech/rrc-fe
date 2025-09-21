/**
 * Custom hook for transaction management
 * Provides transaction CRUD operations and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../api/services';
import type { Transaction, TransactionCreateRequest, TransactionUpdateRequest, StrapiResponse } from '../api/types';

interface UseTransactionsOptions {
  autoFetch?: boolean;
  pageSize?: number;
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const { autoFetch = true, pageSize = 25 } = options;
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    pageCount: 0,
    total: 0,
  });

  // Fetch transactions
  const getTransactions = useCallback(async (params?: {
    page?: number;
    search?: string;
    status?: string;
    type?: string;
    method?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionService.getTransactions({
        page: params?.page || 1,
        limit: pageSize,
        ...params,
      });
      
      if (response.data && Array.isArray(response.data)) {
        setTransactions(response.data);
        setPagination({
          page: response.meta?.pagination?.page || 1,
          pageSize: response.meta?.pagination?.pageSize || pageSize,
          pageCount: response.meta?.pagination?.pageCount || 0,
          total: response.meta?.pagination?.total || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Create transaction
  const createTransaction = useCallback(async (data: TransactionCreateRequest): Promise<Transaction | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionService.createTransaction(data);
      if (response.data) {
        // Refresh the transactions list
        await getTransactions();
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getTransactions]);

  // Update transaction
  const updateTransaction = useCallback(async (id: string, data: TransactionUpdateRequest): Promise<Transaction | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionService.updateTransaction(id, data);
      if (response.data) {
        // Update the transaction in the list
        setTransactions(prev => 
          prev.map(transaction => 
            transaction.documentId === id ? response.data : transaction
          )
        );
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await transactionService.deleteTransaction(id);
      
      // Remove the transaction from the list
      setTransactions(prev => prev.filter(transaction => transaction.documentId !== id));
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get transaction by ID
  const getTransaction = useCallback(async (id: string): Promise<Transaction | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionService.getTransaction(id);
      return response.data || null;
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      getTransactions();
    }
  }, [autoFetch, getTransactions]);

  return {
    transactions,
    isLoading,
    error,
    pagination,
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
  };
};

// Utility functions for transaction display
export const getTransactionStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const getTransactionTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'debit':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'credit':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const getTransactionMethodIcon = (method: string): string => {
  switch (method.toLowerCase()) {
    case 'upi':
      return '💳';
    case 'card':
      return '💳';
    case 'netbanking':
      return '🏦';
    case 'wallet':
      return '👛';
    case 'cash':
      return '💵';
    default:
      return '💰';
  }
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
