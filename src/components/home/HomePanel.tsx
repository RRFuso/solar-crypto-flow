
import React from 'react';
import FearGreedIndicator from "@/components/FearGreedIndicator";

const HomePanel = () => {
  return (
    <div className="space-y-8">
      <div className="w-full h-[800px]">
        <FearGreedIndicator />
      </div>
    </div>
  );
};

export default HomePanel;
