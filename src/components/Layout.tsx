import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header, Footer } from "./Navigation";
import { ChatBot } from "./ChatBot";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle } from "lucide-react";

export const Layout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdminRoute && <Footer />}

      {/* Persistent WhatsApp FAB */}
      {!isAdminRoute && (
        <motion.a
          href="https://chat.whatsapp.com/Km6ogIZvAn6BkhVvCG6C93"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-24 right-5 md:bottom-6 md:right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#128C7E] transition-colors"
        >
          <MessageCircle size={24} fill="currentColor" />
        </motion.a>
      )}

      {!isAdminRoute && <ChatBot />}
    </div>
  );
};
