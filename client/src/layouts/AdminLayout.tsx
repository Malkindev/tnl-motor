import React from 'react';
import TwHeader from '../components/TwHeader';
import TwFooter from '../components/TwFooter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TwHeader />
      <main className="flex-1 container py-8">{children}</main>
      <TwFooter />
    </div>
  );
}
