import { create } from "zustand";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface AIStore {
  messages: ChatMessage[];
  isPanelOpen: boolean;
  isLoading: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  addMessage: (role: MessageRole, content: string) => ChatMessage;
  updateMessage: (id: string, content: string, isTyping?: boolean) => void;
  clearMessages: () => void;
  setLoading: (v: boolean) => void;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI Market Analyst. I can help with portfolio analysis, market insights, risk assessment, and trade ideas.\n\nWhat would you like to explore today?",
  timestamp: new Date(),
};

export const useAIStore = create<AIStore>((set) => ({
  messages: [WELCOME],
  isPanelOpen: false,
  isLoading: false,

  openPanel:  () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),

  addMessage: (role, content) => {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role,
      content,
      timestamp: new Date(),
      isTyping: false,
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  updateMessage: (id, content, isTyping) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content, isTyping: isTyping ?? false } : m,
      ),
    })),

  clearMessages: () => set({ messages: [WELCOME], isLoading: false }),

  setLoading: (v) => set({ isLoading: v }),
}));
