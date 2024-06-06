import React from 'react';

import Header from '@/components/layout/Header';

/**
 *
 * @param root0
 * @param root0.children

 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="appContainer">
      <Header />
      {children}
    </div>
  );
}
