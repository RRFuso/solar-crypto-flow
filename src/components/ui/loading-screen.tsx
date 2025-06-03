
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Solar logo animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-black font-bold text-4xl">☀</span>
          </div>
          
          {/* Orbital rings */}
          <div className="absolute inset-0 -m-4">
            <div className="w-32 h-32 border border-yellow-400/30 rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-0 -m-8">
            <div className="w-40 h-40 border border-orange-400/20 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          </div>
          <div className="absolute inset-0 -m-12">
            <div className="w-48 h-48 border border-red-400/10 rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
          Solar Crypto
        </h1>
        
        {/* Loading text */}
        <p className="text-gray-400 text-lg mb-6">Inicializando sistema...</p>
        
        {/* Loading progress */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
        </div>
        
        {/* Particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400/50 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
