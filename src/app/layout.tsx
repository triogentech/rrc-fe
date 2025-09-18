import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ReduxProvider } from '@/store/providers/ReduxProvider';
import AuthDebugger from '@/components/debug/AuthDebugger';

// Import test utilities in development
if (process.env.NODE_ENV === 'development') {
  require('@/utils/testAuth');
  require('@/utils/debugDriverCreation');
}

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider>
              <SidebarProvider>
                {children}
                {/* <AuthDebugger /> */}
              </SidebarProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
