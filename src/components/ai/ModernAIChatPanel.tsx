import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, ChevronsUp, MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/ai_analyst';
import { getAIChatResponse } from '@/lib/ai_analyst';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIChatResponse(newMessages);
      setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages([...newMessages, { 
        sender: 'ai', 
        text: '🛰️ Desculpe, encontrei uma interferência cósmica. Tente novamente em alguns instantes.' 
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

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-lg"
      >
        <MessageSquare className="h-8 w-8 text-primary-foreground" />
      </Button>
    );
  }

  return (
    <Card className="w-[400px] h-[600px] flex flex-col bg-card/50 backdrop-blur-sm border-border/50 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={astronautAvatar} alt="Analista Solar" />
            <AvatarFallback className="bg-primary/20">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">Analista Solar</h3>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Analisando dados...' : 'Online'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}>
          <ChevronsUp className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-fade-in ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <Avatar className="h-8 w-8 ring-1 ring-primary/20 shrink-0">
                  <AvatarImage src={astronautAvatar} alt="Analista Solar" />
                  <AvatarFallback className="bg-primary/20 text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-secondary/50 text-secondary-foreground border border-border/30'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
              
              {msg.sender === 'user' && (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-primary">Você</span>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="h-8 w-8 ring-1 ring-primary/20 shrink-0">
                <AvatarImage src={astronautAvatar} alt="Analista Solar" />
                <AvatarFallback className="bg-primary/20 text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-secondary/50 text-secondary-foreground border border-border/30 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analisando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card/30">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre o mercado..."
            disabled={isLoading}
            className="flex-1 bg-background/50 border-border/50 focus:ring-primary/20"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            size="sm"
            className="bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Powered by Gemini AI
        </p>
      </div>
    </Card>
  );
};

export default ModernAIChatPanel;