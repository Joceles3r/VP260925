import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { initEmojiOrchestrator, triggerEmoji } from '@/components/emoji/emoji_orchestrator';

// Configuration des emojis
const emojiConfig = {
  enabled: true,
  global: {
    maxPerMinute: 6,
    cooldownMs: 3000
  },
  profiles: {
    visitor: { density: "low" as const },
    investisseur: { density: "medium" as const },
    porteur: { density: "low" as const },
    admin: { density: "low" as const }
  },
  events: {
    category_open: {
      packs: {
        films: ["🎬", "📽️", "🍿", "✨"],
        videos: ["🎬", "📽️", "✨"],
        documentaires: ["🎥", "🧭", "✨"],
        voix_info: ["📰", "🎙️", "✨"],
        livres: ["📚", "📖", "✨"],
        live_show: ["🔴", "🎥", "✨"],
        petites_annonces: ["📌", "📸", "🎭", "✨"]
      },
      count: { low: 6, medium: 10, high: 14 }
    },
    invest_success: {
      emojis: ["💸", "🚀", "✨"],
      count: { low: 8, medium: 12, high: 16 }
    },
    purchase_success: {
      emojis: ["🎟️", "🎉", "🍿"],
      count: { low: 8, medium: 12, high: 16 }
    },
    follow_creator: {
      emojis: ["⭐", "🤝", "✨"],
      count: { low: 6, medium: 10, high: 12 }
    },
    live_show_start: {
      emojis: ["🔴", "🎉", "✨"],
      count: { low: 8, medium: 12, high: 16 },
      oncePerSession: true
    },
    announcement_new: {
      emojis: ["📣", "✨"],
      count: { low: 4, medium: 6, high: 8 }
    },
    category_off_view: {
      emojis: ["🚧", "🛠️"],
      static: true
    }
  }
};

export function useEmojiSystem() {
  const { user } = useAuth();
  const initialized = useRef(false);

  // Initialize emoji orchestrator
  useEffect(() => {
    if (!initialized.current) {
      initEmojiOrchestrator(emojiConfig);
      initialized.current = true;
    }
  }, []);

  // Get user profile for emoji density
  const getUserProfile = () => {
    if (!user) return 'visitor';
    if (user.profileType === 'creator') return 'porteur';
    if (user.profileType === 'admin') return 'admin';
    return 'investisseur';
  };

  // Trigger emoji burst
  const trigger = (event: string, context: {
    section?: string;
    x?: number;
    y?: number;
  } = {}) => {
    triggerEmoji(event, {
      ...context,
      profile: getUserProfile()
    });
  };

  // Specific trigger functions
  const triggerCategoryOpen = (category: string, x?: number, y?: number) => {
    trigger('category_open', { section: category, x, y });
  };

  const triggerInvestSuccess = (x?: number, y?: number) => {
    trigger('invest_success', { x, y });
  };

  const triggerPurchaseSuccess = (x?: number, y?: number) => {
    trigger('purchase_success', { x, y });
  };

  const triggerFollowCreator = (x?: number, y?: number) => {
    trigger('follow_creator', { x, y });
  };

  const triggerLiveShowStart = (x?: number, y?: number) => {
    trigger('live_show_start', { x, y });
  };

  const triggerAnnouncement = (x?: number, y?: number) => {
    trigger('announcement_new', { x, y });
  };

  const triggerCategoryOff = (x?: number, y?: number) => {
    trigger('category_off_view', { x, y });
  };

  return {
    triggerCategoryOpen,
    triggerInvestSuccess,
    triggerPurchaseSuccess,
    triggerFollowCreator,
    triggerLiveShowStart,
    triggerAnnouncement,
    triggerCategoryOff,
    trigger
  };
}