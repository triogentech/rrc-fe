"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const auth = localStorage.getItem('isAuthenticated');
        const email = localStorage.getItem('userEmail');
        
        if (auth === 'true' && email) {
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          // Clear any invalid data
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userEmail');
          setIsAuthenticated(false);
          setIsLoading(false);
          router.push('/signin');
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Add a small delay to prevent flash of content
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/signin');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
