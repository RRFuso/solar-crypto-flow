import React from 'react';
import CryptoPanel from '../components/CryptoPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Painel de Criptomoedas</h1>
        <CryptoPanel />
      </div>
    </div>
  );
};

export default Index;