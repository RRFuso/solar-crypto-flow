import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Bot, User, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/ai_analyst';
import { getAIChatResponse } from '@/lib/ai_analyst';

interface HeliusOracleChatProps {
  className?: string;
}

const HeliusOracleChat: React.FC<HeliusOracleChatProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIChatResponse(updatedMessages);
      setMessages([...updatedMessages, { sender: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages([
        ...updatedMessages,
        { sender: 'ai', text: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = useMemo(() => [
    "Qual é o sentimento atual do mercado?",
    "Analise o fluxo de smart money para BTC",
    "Quais altcoins mostram sinais bullish?",
    "Qual é o risco atual do mercado?"
  ], []);

  const handleSuggestedQuestion = (question: string) => {
    setUserInput(question);
  };

  return (
    <div className={`bg-black border border-gray-800 rounded-xl flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/SOLCRY.webp" alt="Helius Oracle" className="w-10 h-10" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Helius Oracle</h2>
            <p className="text-xs text-gray-400">Análise de mercado em tempo real</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <img src="/SOLCRY.webp" alt="Helius Oracle" className="w-20 h-20 mb-4 animate-pulse-slow" />
            <h3 className="text-white font-semibold mb-2">Bem-vindo ao Helius Oracle</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-sm">
              Sua IA especializada em análise de mercado cripto, fluxo de smart money e tendências on-chain.
            </p>
            
            {/* Suggested Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 text-sm text-gray-300 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                  {msg.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-800 text-gray-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-none p-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analisando dados...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre o mercado cripto..."
            className="flex-1 min-h-[44px] max-h-32 bg-gray-900 border-gray-700 text-white placeholder-gray-500 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          ⚠️ Análises informativas. Não constitui aconselhamento financeiro.
        </p>
      </div>
    </div>
  );
};

export default HeliusOracleChat;
