import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import { ChatMessage } from '@/types/ai_analyst';
import { getAIChatResponse } from '@/lib/ai_analyst';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import astronautAvatar from '@/assets/astronaut-avatar.png';

const ModernAIChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: '🚀 Olá! Eu sou o Analista Solar, seu assistente de IA especializado em análise de mercado cripto. Como posso ajudá-lo a navegar pelos mercados hoje?'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIChatResponse(newMessages);
      setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
    } catch (error: any) {
      const errorMessage = error?.message || 'An unknown error occurred.';
      setMessages([...newMessages, { 
        sender: 'ai', 
        text: `🛰️ Desculpe, ocorreu um erro:\n\n${errorMessage}`
      }]);
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

  return (
    <Card className="w-full h-full flex flex-col bg-transparent shadow-none border-none">
      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 animate-fade-in ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={astronautAvatar} alt="Analista Solar" />
                  <AvatarFallback className="bg-primary/20 text-xs">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
              
              {msg.sender === 'user' && (
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-slate-300">Você</span>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 animate-fade-in">
              <Avatar className="h-10 w-10 ring-1 ring-primary/20 shrink-0">
                <AvatarImage src={astronautAvatar} alt="Analista Solar" />
                <AvatarFallback className="bg-primary/20 text-xs">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-800 text-slate-200 border border-slate-700 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-base">Analisando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex gap-4 items-start">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre o mercado..."
            disabled={isLoading}
            className="flex-1 bg-slate-800 border-slate-700 focus:ring-blue-500 text-base resize-none"
            rows={3}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white h-full"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Powered by Lovable AI
        </p>
      </div>
    </Card>
  );
};

export default ModernAIChatPanel;