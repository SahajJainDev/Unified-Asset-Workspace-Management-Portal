import React from 'react';
import Header from '../components/Header';
import UserSidebar from '../components/UserSidebar';
import SoftwareVerificationNoAdmin from '../components/SoftwareVerificationNoAdmin';

const SoftwareVerificationPage: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <UserSidebar activeTab="software-verify" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="p-6">
          <SoftwareVerificationNoAdmin />
        </div>
      </main>
    </div>
  );
};

export default SoftwareVerificationPage;
