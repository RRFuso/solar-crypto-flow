import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Loader2, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/ai_analyst';
import { getAIChatResponse } from '@/lib/ai_analyst';
import ReactMarkdown from 'react-markdown';
import { useSolarCoreCommand } from '@/contexts/SolarCoreCommandContext';
import { useFlowControls } from '@/contexts/FlowControlsContext';
import {
  getWebLLMEngine,
  chatWithLocalAI,
  unloadWebLLM,
  getWebLLMStatus,
  type WebLLMProgress,
} from '@/lib/ai/webLlmEngine';
import WebLLMStatusIndicator from './WebLLMStatusIndicator';

interface HeliusOracleChatProps {
  className?: string;
}

/** Parse AI response to extract solar-command blocks */
function parseSolarCommand(text: string): { cleanText: string; command: any | null } {
  const cmdRegex = /```solar-command\s*([\s\S]*?)```/;
  const match = text.match(cmdRegex);
  if (!match) return { cleanText: text, command: null };

  try {
    const command = JSON.parse(match[1].trim());
    const cleanText = text.replace(cmdRegex, '').trim();
    return { cleanText, command };
  } catch {
    return { cleanText: text, command: null };
  }
}

const HeliusOracleChat: React.FC<HeliusOracleChatProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { applyHeliusCommand, selectedNodeId, setSelectedNodeId } = useSolarCoreCommand();
  const { selectedCategory } = useFlowControls();

  // WebLLM state
  const [llmProgress, setLlmProgress] = useState<WebLLMProgress>({
    status: 'idle',
    progress: 0,
    text: '',
  });

  // Initialize WebLLM engine on mount
  useEffect(() => {
    getWebLLMEngine(setLlmProgress);
    return () => {
      unloadWebLLM();
    };
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to node clicks from Solar Core
  useEffect(() => {
    if (selectedNodeId && !isLoading) {
      const prompt = `Analise o ativo ${selectedNodeId} - fluxo de smart money, sentimento on-chain e sinais técnicos.`;
      setUserInput(prompt);
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, isLoading, setSelectedNodeId]);

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);

    const marketContext = JSON.stringify({
      activeCategory: selectedCategory,
      timestamp: new Date().toISOString(),
    });

    let aiResponse: string | null = null;

    // Try local AI first
    if (getWebLLMStatus() === 'ready') {
      try {
        const llmMessages = updatedMessages.map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text,
        }));
        aiResponse = await chatWithLocalAI(llmMessages, marketContext);
      } catch (err) {
        console.warn('[HeliusOracle] Local AI failed, falling back to edge function:', err);
      }
    }

    // Fallback to edge function
    if (!aiResponse) {
      try {
        aiResponse = await getAIChatResponse(updatedMessages);
      } catch (error) {
        setMessages([
          ...updatedMessages,
          { sender: 'ai', text: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.' },
        ]);
        setIsLoading(false);
        return;
      }
    }

    // Parse solar commands from AI response
    const { cleanText, command } = parseSolarCommand(aiResponse);

    if (command) {
      applyHeliusCommand({
        selectedSymbols: command.symbols,
        activeCategory: command.category,
        zoomLevel: command.zoom,
        smartMoneyThreshold: command.threshold,
        focusNodeId: command.focus,
      });
    }

    setMessages([...updatedMessages, { sender: 'ai', text: cleanText || aiResponse }]);
    setIsLoading(false);
  }, [userInput, isLoading, messages, applyHeliusCommand, selectedCategory]);

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
    "Destaque os ativos com maior potencial explosivo",
  ], []);

  const handleSuggestedQuestion = (question: string) => {
    setUserInput(question);
  };

  return (
    <div className={`bg-background border-0 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center gap-3">
          <img src="/SOLCRY.webp" alt="Helius Oracle" className="w-8 h-8" />
          <div className="flex-1">
            <h2 className="text-foreground font-bold text-sm">Helius Oracle</h2>
            <p className="text-[10px] text-muted-foreground">Comanda o Solar Core • Smart Money • On-Chain</p>
          </div>
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
        </div>
      </div>

      {/* WebLLM Status */}
      <WebLLMStatusIndicator progress={llmProgress} />

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <img src="/SOLCRY.webp" alt="Helius Oracle" className="w-20 h-20 mb-4 opacity-80" />
            <h3 className="text-foreground font-semibold text-base mb-1">Command Center</h3>
            <p className="text-muted-foreground text-xs mb-4 max-w-[280px]">
              Pergunte e o Oracle reconfigura o Solar Core com dados reais on-chain.
            </p>
            <div className="grid grid-cols-1 gap-1.5 w-full">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-2.5 bg-muted/30 hover:bg-muted/60 rounded-lg border border-border/50 text-xs text-muted-foreground transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.sender === 'user'
                    ? 'bg-primary'
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                  {msg.sender === 'user' ? (
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] p-2.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <div className="text-xs prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_strong]:text-amber-300 [&_code]:text-[10px] [&_code]:bg-black/30 [&_code]:px-1 [&_code]:rounded">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">
                      {getWebLLMStatus() === 'ready' ? 'IA Local processando...' : 'Analisando dados on-chain...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Comando para o Solar Core..."
            className="flex-1 min-h-[40px] max-h-24 bg-muted border-border text-foreground placeholder-muted-foreground resize-none text-xs"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 self-center"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
          ⚠️ Análises informativas. Não constitui aconselhamento financeiro.
        </p>
      </div>
    </div>
  );
};

export default HeliusOracleChat;
