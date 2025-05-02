import React from 'react';
import CryptoPanel from '../components/CryptoPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/75a6a36b-8f61-4896-aa4e-6025303baf1e.png" 
            alt="Synerdata Logo" 
            className="w-48 h-48 object-contain"
          />
        </div>
        <CryptoPanel />
      </div>
    </div>
  );
};

export default Index;