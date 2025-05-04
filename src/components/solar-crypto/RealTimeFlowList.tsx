
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  msg: string;
  timestamp?: string;
  [key: string]: any;
}

interface RealTimeFlowListProps {
  messages: Message[];
}

const RealTimeFlowList: React.FC<RealTimeFlowListProps> = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-500">
        Aguardando sinais do servidor...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((message, index) => {
        // Create timestamp if not provided
        const timestamp = message.timestamp 
          ? new Date(message.timestamp) 
          : new Date(Date.now() - index * 2500); // Mock staggered timestamps
        
        return (
          <div 
            key={`message-${index}`}
            className="p-3 border border-gray-800 rounded bg-gray-800/20 text-sm"
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-white">{message.msg}</div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
              </div>
            </div>
            
            {/* Display any additional properties */}
            {Object.entries(message).filter(([key]) => key !== 'msg' && key !== 'timestamp').map(([key, value]) => (
              <div key={key} className="mt-1 text-xs text-gray-400">
                <span className="text-gray-500">{key}:</span> {JSON.stringify(value)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default RealTimeFlowList;
