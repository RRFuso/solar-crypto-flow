
import React from 'react';
import FearGreedIndicator from "@/components/FearGreedIndicator";

const HomePanel = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        <div className="w-full h-[800px]">
          <FearGreedIndicator />
        </div>
      </div>
    </div>
  );
};

export default HomePanel;
