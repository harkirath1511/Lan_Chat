import React from 'react';
import { CONSTELLATION_NODES, ConstellationNode } from '../three/ConversationConstellation';

interface NodeSelectorBarProps {
  selectedNodeId: string | null;
  onSelectNode: (node: ConstellationNode) => void;
}

export const NodeSelectorBar: React.FC<NodeSelectorBarProps> = ({
  selectedNodeId,
  onSelectNode,
}) => {
  return (
    <div
      className="w-full mt-4 pt-3 border-t border-[#202522]/10"
      role="region"
      aria-label="Local network nodes directory"
    >
      <div className="flex items-center justify-between text-xs text-[#777D76] mb-2 px-1">
        <span className="font-mono text-[11px] uppercase tracking-wider">
          Discovered LAN Nodes ({CONSTELLATION_NODES.length})
        </span>
        <span className="hidden sm:inline text-[11px]">Click or Tab + Enter to inspect</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {CONSTELLATION_NODES.map((node) => {
          const isSelected = selectedNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#294E43] ${
                isSelected
                  ? 'bg-[#294E43] text-[#F4F1EB] border-[#294E43] shadow-sm'
                  : 'bg-[#F4F1EB] hover:bg-[#E5E0D7]/60 text-[#202522] border-[#202522]/15'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-medium truncate">{node.label}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-[#D36C43]' : 'bg-[#294E43]'
                  }`}
                />
              </div>
              <div
                className={`text-[10px] font-mono truncate ${
                  isSelected ? 'text-[#F4F1EB]/80' : 'text-[#777D76]'
                }`}
              >
                {node.ip}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
