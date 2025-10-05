
import React from 'react';

const DataPopulationPanel: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Data Population</h2>
      <p>This is the data population panel. Only admins can see this.</p>
      {/* Add data population controls here */}
    </div>
  );
};

export default DataPopulationPanel;
