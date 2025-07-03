import React from 'react';

const SolarCryptoFlow: React.FC = () => {
  return (
    <div className="bg-[#121212] text-white min-h-screen flex flex-col p-4 font-sans">
      {/* Header */}
      <header className="w-full max-w-screen-2xl mx-auto mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Solar Crypto Flow</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300">Filtro 1</button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300">Filtro 2</button>
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300">Ação Principal</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-screen-2xl mx-auto overflow-hidden">
        {/* Solar System Visualization */}
        <div className="flex-1 flex items-center justify-center bg-gray-900/50 rounded-lg shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-yellow-400 rounded-full animate-pulse"></div>
            {/* Planets */}
            <div className="absolute w-8 h-8 bg-blue-400 rounded-full" style={{ transform: 'rotate(45deg) translateX(150px) rotate(-45deg)' }}></div>
            <div className="absolute w-12 h-12 bg-red-500 rounded-full" style={{ transform: 'rotate(120deg) translateX(250px) rotate(-120deg)' }}></div>
            <div className="absolute w-10 h-10 bg-green-400 rounded-full" style={{ transform: 'rotate(240deg) translateX(350px) rotate(-240deg)' }}></div>
          </div>
          <p className="z-10 text-lg">Visualização do Sistema Solar (Centralizado)</p>
        </div>

        {/* Bottom Sections */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Watchlist */}
          <div className="bg-gray-900/50 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">AI Watchlist</h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-48 bg-gray-800 p-3 rounded-md shadow-sm">
                    <p className="font-bold">Crypto {i + 1}</p>
                    <p className="text-sm text-gray-400">Dados da AI...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Price Action */}
          <div className="bg-gray-900/50 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Price Action</h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-48 bg-gray-800 p-3 rounded-md shadow-sm">
                    <p className="font-bold">Ativo {i + 1}</p>
                    <p className="text-sm text-green-400">+2.5%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SolarCryptoFlow;
