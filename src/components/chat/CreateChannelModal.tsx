import React, { useState } from 'react';
import { X, Hash, Plus } from 'lucide-react';
import { Conversation } from '../../types/chat';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<Conversation>;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanName) {
      setError('Please provide a channel name.');
      return;
    }
    if (cleanName.length < 2) {
      setError('Channel name must be at least 2 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate(cleanName, description.trim());
      setName('');
      setDescription('');
      setError(null);
      onClose();
    } catch {
      setError('Could not create channel. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202522]/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F4F1EB] border border-[#202522]/15 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#202522]/10 mb-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#294E43]" />
            <h3 id="create-channel-title" className="font-serif text-lg font-semibold text-[#202522]">
              Create Local Channel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777D76] hover:text-[#202522] rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="channelName"
              className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1.5"
            >
              Channel Name <span className="text-[#D36C43]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#777D76]">
                #
              </span>
              <input
                id="channelName"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. lab-prep or algorithms-study"
                className="w-full bg-[#E5E0D7]/40 border border-[#202522]/20 rounded-xl pl-8 pr-3 py-2 text-sm text-[#202522] focus:outline-none focus:border-[#294E43]"
              />
            </div>
            {error && <p className="mt-1 text-xs text-[#D36C43]">{error}</p>}
          </div>

          <div>
            <label
              htmlFor="channelDesc"
              className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1.5"
            >
              Topic / Purpose
            </label>
            <textarea
              id="channelDesc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this channel focus on?"
              className="w-full bg-[#E5E0D7]/40 border border-[#202522]/20 rounded-xl p-3 text-sm text-[#202522] focus:outline-none focus:border-[#294E43] resize-none"
            />
          </div>

          <p className="text-[11px] text-[#777D76]">
            This channel will be discoverable by all simulated peers on subnet 192.168.1.0/24.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#202522] hover:bg-[#E5E0D7] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#F4F1EB] bg-[#294E43] hover:bg-[#1F3C34] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
