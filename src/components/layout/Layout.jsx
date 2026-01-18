/**
 * Layout Component
 * Main layout wrapper with header
 */

import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <Header />
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
