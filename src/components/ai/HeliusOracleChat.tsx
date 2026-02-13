import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Loader2, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/ai_analyst';
import { getAIChatResponse } from '@/lib/ai_analyst';
import ReactMarkdown from 'react-markdown';
import InlineFlowVisualization from './InlineFlowVisualization';

interface HeliusOracleChatProps {
  className?: string;
}

/** Parse AI response to extract flow-data blocks */
function parseFlowData(text: string): { cleanText: string; flowData: any | null } {
  const flowRegex = /```flow-data\s*([\s\S]*?)```/;
  const match = text.match(flowRegex);
  if (!match) return { cleanText: text, flowData: null };

  try {
    const flowData = JSON.parse(match[1].trim());
    const cleanText = text.replace(flowRegex, '').trim();
    return { cleanText, flowData };
  } catch {
    return { cleanText: text, flowData: null };
  }
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

  const handleSendMessage = useCallback(async () => {
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
  }, [userInput, isLoading, messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = useMemo(() => [
    "Analise o fluxo de smart money atual",
    "Quais tokens têm maior entrada de baleias?",
    "Qual é o sentimento geral do mercado?",
    "Monte um mapa de fluxo de capital institucional"
  ], []);

  const handleSuggestedQuestion = (question: string) => {
    setUserInput(question);
  };

  return (
    <div className={`bg-background border border-border rounded-xl flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-border bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-t-xl">
        <div className="flex flex-col items-center justify-center text-center relative">
          <h2 className="text-foreground font-bold text-lg">Helius Oracle</h2>
          <p className="text-xs text-muted-foreground">Análise de mercado em tempo real • Smart Money • On-Chain</p>
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <img src="/SOLCRY.webp" alt="Helius Oracle" className="w-32 h-32 mb-6 animate-pulse-slow" />
            <h3 className="text-foreground font-semibold text-xl mb-2">Bem-vindo ao Helius Oracle</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              IA com acesso completo a dados on-chain, smart money, sinais técnicos e mercado em tempo real.
            </p>
            
            {/* Suggested Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border text-sm text-muted-foreground transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const { cleanText, flowData } = msg.sender === 'ai' 
                ? parseFlowData(msg.text) 
                : { cleanText: msg.text, flowData: null };

              return (
                <div key={index}>
                  <div className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.sender === 'user' 
                        ? 'bg-primary' 
                        : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    }`}>
                      {msg.sender === 'user' ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted text-foreground rounded-tl-none'
                      }`}
                    >
                      {msg.sender === 'ai' ? (
                        <div className="text-sm prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-amber-300 [&_code]:text-xs [&_code]:bg-black/30 [&_code]:px-1 [&_code]:rounded">
                          <ReactMarkdown>{cleanText}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{cleanText}</p>
                      )}
                    </div>
                  </div>
                  {/* Inline flow visualization */}
                  {flowData && (
                    <div className="ml-11 mt-2">
                      <InlineFlowVisualization data={flowData} />
                    </div>
                  )}
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Consultando dados on-chain e mercado...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre smart money, fluxos, mercado..."
            className="flex-1 min-h-[44px] max-h-32 bg-muted border-border text-foreground placeholder-muted-foreground resize-none"
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
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          ⚠️ Análises informativas. Não constitui aconselhamento financeiro.
        </p>
      </div>
    </div>
  );
};

export default HeliusOracleChat;
