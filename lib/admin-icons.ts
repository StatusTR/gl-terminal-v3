// Admin icons for identification
export const ADMIN_ICONS = [
  { id: 'dollar', emoji: '💵', name: 'Dollar' },
  { id: 'euro', emoji: '💶', name: 'Euro' },
  { id: 'bitcoin', emoji: '₿', name: 'Bitcoin' },
  { id: 'ethereum', emoji: '⟠', name: 'Ethereum' },
  { id: 'gold', emoji: '🪙', name: 'Gold' },
  { id: 'diamond', emoji: '💎', name: 'Diamant' },
  { id: 'rocket', emoji: '🚀', name: 'Rakete' },
  { id: 'chart', emoji: '📈', name: 'Chart' },
  { id: 'bank', emoji: '🏦', name: 'Bank' },
  { id: 'money_bag', emoji: '💰', name: 'Geldsack' },
  { id: 'credit_card', emoji: '💳', name: 'Kreditkarte' },
  { id: 'piggy_bank', emoji: '🐷', name: 'Sparschwein' },
  { id: 'crown', emoji: '👑', name: 'Krone' },
  { id: 'star', emoji: '⭐', name: 'Stern' },
  { id: 'fire', emoji: '🔥', name: 'Feuer' },
  { id: 'lightning', emoji: '⚡', name: 'Blitz' },
  { id: 'shield', emoji: '🛡️', name: 'Schild' },
  { id: 'target', emoji: '🎯', name: 'Ziel' },
  { id: 'trophy', emoji: '🏆', name: 'Pokal' },
  { id: 'gem', emoji: '💠', name: 'Edelstein' }
] as const;

export type AdminIconId = typeof ADMIN_ICONS[number]['id'];

export function getAdminIcon(iconId: string | null | undefined) {
  return ADMIN_ICONS.find(icon => icon.id === iconId) || null;
}
