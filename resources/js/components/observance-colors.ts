export const OBSERVANCE_COLOR_MAP: Record<string, { bg: string; text: string; badge: string; border?: string; ring?: string; hoverRing?: string; hoverBorder?: string; grad?: string }> = {
  'half-day': {
    bg: 'bg-yellow-100/10 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-300',
    badge: 'bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 dark:bg-yellow-900/50',
    border: 'border border-yellow-500/60',
    ring: 'ring-2 ring-yellow-500/40',
    hoverRing: 'ring-yellow-500/60',
    hoverBorder: 'border-yellow-500/80',
    grad: 'bg-gradient-to-br from-yellow-500/10 to-transparent',
  },
  'rainy-day': {
    bg: 'bg-blue-100/10 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-300',
    badge: 'bg-blue-400/20 text-blue-800 dark:text-blue-300 dark:bg-blue-900/50',
    border: 'border border-blue-500/60',
    ring: 'ring-2 ring-blue-500/40',
    hoverRing: 'ring-blue-500/60',
    hoverBorder: 'border-blue-500/80',
    grad: 'bg-gradient-to-br from-blue-500/10 to-transparent',
  },
  'whole-day': {
    bg: 'bg-purple-100/10 dark:bg-purple-900/20',
    text: 'text-purple-800 dark:text-purple-300',
    badge: 'bg-purple-400/20 text-purple-800 dark:text-purple-300 dark:bg-purple-900/50',
    border: 'border border-purple-500/60',
    ring: 'ring-2 ring-purple-500/40',
    hoverRing: 'ring-purple-500/60',
    hoverBorder: 'border-purple-500/80',
    grad: 'bg-gradient-to-br from-purple-500/10 to-transparent',
  },
  'DEFAULT': {
    bg: 'bg-gray-100/10 dark:bg-gray-800/30',
    text: 'text-gray-800 dark:text-gray-300',
    badge: 'bg-gray-400/20 text-gray-700 dark:text-gray-300 dark:bg-gray-600/50',
    border: 'border border-gray-500/40',
    ring: 'ring-2 ring-gray-500/30',
    hoverRing: 'ring-gray-500/50',
    hoverBorder: 'border-gray-500/60',
    grad: 'bg-gradient-to-br from-gray-500/10 to-transparent',
  },
};

export const OBSERVANCE_PRETTY: Record<string, string> = {
  'half-day': 'Half-day',
  'rainy-day': 'Rainy day',
  'whole-day': 'Whole-day',
};
