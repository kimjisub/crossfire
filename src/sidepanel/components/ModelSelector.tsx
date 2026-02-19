import { useEffect } from 'react';
import { useDebateStore } from '../store/useDebateStore';
import { useConfigStore } from '../store/useConfigStore';
import type { ConnectionState } from '../../shared/messages';

const STATUS_DOT: Record<ConnectionState, { color: string; animate: boolean }> = {
  unknown: { color: '#6e6e82', animate: false },
  checking: { color: '#fbbf24', animate: true },
  connected: { color: '#34d399', animate: false },
  disconnected: { color: '#f87171', animate: false },
};

export function ModelSelector() {
  const {
    selectedModels,
    connectionStatus,
    toggleModel,
    checkConnections,
    status,
  } = useDebateStore();
  const { config } = useConfigStore();
  const isLoading = status === 'loading';

  useEffect(() => {
    if (selectedModels.size === 0) return;
    checkConnections();
    const interval = setInterval(checkConnections, 1000);
    return () => clearInterval(interval);
  }, [selectedModels, checkConnections]);

  if (config.models.length === 0) {
    return (
      <div className="text-xs text-txt-muted py-3 text-center">
        Add models in Settings to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {config.models.map((model) => {
        const selected = selectedModels.has(model.id);
        const connState = connectionStatus[model.id] ?? 'unknown';
        const dot = selected ? STATUS_DOT[connState] : STATUS_DOT.unknown;

        return (
          <button
            key={model.id}
            onClick={() => toggleModel(model.id)}
            disabled={isLoading}
            className={`flex-auto min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] rounded-lg transition-all tracking-tight
              ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              fontWeight: selected ? 600 : 500,
              border: `1px solid ${selected ? model.color + '55' : 'rgba(255,255,255,0.12)'}`,
              background: selected ? model.color + '15' : 'var(--color-elevated)',
              color: selected ? model.color : 'var(--color-txt-muted)',
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${dot.animate ? 'animate-dot-blink' : ''}`}
              style={{
                background: dot.color,
                boxShadow: selected && connState === 'connected' ? `0 0 6px ${model.color}88` : undefined,
              }}
            />
            {model.name}
          </button>
        );
      })}
    </div>
  );
}
