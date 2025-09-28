import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { initEmojiOrchestrator, triggerEmoji } from '@/components/emoji/emoji_orchestrator';
import emojiConfig from '@/components/emoji/emoji_config.json';


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

  const triggerSurprise = (x?: number, y?: number) => {
    trigger('surprise', { x, y });
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
    triggerSurprise,
    triggerCategoryOff,
    trigger
  };
}