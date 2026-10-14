import React, { useEffect, useRef } from 'react';

const EMOJI_LIST = [
  '👍', '👏', '🙌', '🤝', '🚀', '🔥', '⚡', '✨',
  '💻', '☕', '📚', '🧪', '🧠', '💡', '🎯', '✅',
  '🎉', '👋', '👀', '💯', '🔧', '📦', '📊', '💬',
];

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-12 right-12 z-40 bg-[#F4F1EB] border border-[#202522]/15 rounded-xl shadow-lg p-3 w-64 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="text-[11px] font-mono uppercase tracking-wider text-[#777D76] mb-2 px-1">
        Reactions & Emojis
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#E5E0D7] rounded-lg transition-colors cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
