
import React from 'react';
import MarketRotationIndicator from './MarketRotationIndicator';

const HomePanel = () => {
  return (
    <div className="space-y-8">
      <div className="w-full h-[800px]">
        <MarketRotationIndicator />
      </div>
    </div>
  );
};

export default HomePanel;
