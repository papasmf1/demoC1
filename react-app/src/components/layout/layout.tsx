import { ReactNode } from 'react';
import { Navbar } from './navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
};