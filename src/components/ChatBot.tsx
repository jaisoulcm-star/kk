import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, User, Sparkles, Loader2 } from "lucide-react";
import { chatWithHeritageAssistant } from "../services/geminiService";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Namaste! I am your KrishiMart Agronomy Assistant. How may I assist you with organic bio-nutrients, heirloom seeds, or crop planning today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const responseText = await chatWithHeritageAssistant(inputText, history);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: responseText || "I'm sorry, I couldn't process that. Could you try again?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "My apologies, I'm having trouble connecting to the agronomy advisor right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-20 md:bottom-6 md:right-28 z-[70]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[85vw] md:w-[400px] h-[500px] bg-heritage-cream rounded-2xl shadow-2xl border border-heritage-gold/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-stone-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-heritage-maroon flex items-center justify-center border border-heritage-gold/30">
                  <Sparkles size={20} className="text-heritage-gold" />
                </div>
                <div>
                  <h3 className="font-serif italic leading-none">Agronomy Assistant</h3>
                  <span className="text-[10px] text-heritage-gold uppercase tracking-widest font-bold">KrishiMart AI</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
                id="close-chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      message.role === "user"
                        ? "bg-heritage-maroon text-white rounded-tr-none"
                        : "bg-white text-stone-800 shadow-sm border border-stone-100 rounded-tl-none italic font-serif"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-stone-100 italic font-serif text-sm flex items-center gap-2 text-stone-500">
                    <Loader2 size={14} className="animate-spin" />
                    Consulting agronomy recommendations...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-stone-100">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about our bio-inputs, seeds, and fertilizers..."
                  className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-heritage-gold transition-colors"
                  id="chat-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-heritage-maroon text-white flex items-center justify-center hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  id="send-message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-stone-900 text-white" : "bg-heritage-maroon text-white"
        } border-2 border-heritage-gold/30`}
        id="chat-toggle"
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
};
