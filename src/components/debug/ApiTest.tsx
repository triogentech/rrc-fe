"use client";
import React, { useState } from 'react';
import { authService } from '@/store/api/services';
import { getApiBaseUrl } from '@/config/api';

export default function ApiTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const apiUrl = getApiBaseUrl();
      console.log('Making API call to:', `${apiUrl}/auth/local`);
      
      const response = await authService.login({
        identifier: "7838624872",
        password: "rohan@123"
      });
      
      console.log('Full response:', response);
      setResult(`Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('API Test Error:', error);
      setResult(`Error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setResult('Testing direct fetch...');
    
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: "7838624872",
          password: "rohan@123"
        })
      });
      
      const data = await response.json();
      console.log('Direct fetch response:', { status: response.status, data });
      setResult(`Direct fetch - Status: ${response.status}, Data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Direct fetch error:', error);
      setResult(`Direct fetch error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 m-4">
      <h3 className="text-lg font-bold mb-4">API Debug Test</h3>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Service'}
          </button>
          
          <button
            onClick={testDirectFetch}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Direct Fetch'}
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-4 rounded border">
          <h4 className="font-semibold mb-2">Result:</h4>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result || 'Click a button to test...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
