/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CareXProvider, useCareX } from './context/CareXContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/modals/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { HomeView } from './components/views/HomeView';
import { BookingView } from './components/views/BookingView';
import { NearbyView } from './components/views/NearbyView';
import { PatientPortalView } from './components/views/PatientPortalView';
import { ProviderPortalView } from './components/views/ProviderPortalView';
import { AdminPortalView } from './components/views/AdminPortalView';
import { AllScreensView } from './components/views/AllScreensView';

const AppContent: React.FC = () => {
  const { activeTab } = useCareX();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      <Header />
      
      <main className="flex-1">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'booking' && <BookingView />}
        {activeTab === 'nearby' && <NearbyView />}
        {activeTab === 'patient-portal' && <PatientPortalView />}
        {activeTab === 'provider-portal' && <ProviderPortalView />}
        {activeTab === 'admin-portal' && <AdminPortalView />}
        {activeTab === 'all-screens' && <AllScreensView />}
      </main>

      <Footer />
      <ToastContainer />
      <AuthModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <CareXProvider>
      <AppContent />
    </CareXProvider>
  );
}
