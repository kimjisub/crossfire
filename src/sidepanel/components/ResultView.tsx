import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { useDebateStore } from '../store/useDebateStore';
import { useConfigStore } from '../store/useConfigStore';
import type { ModelStreamStatus } from '../../shared/messages';

const STATUS_CFG: Record<ModelStreamStatus, { label: string; color: string; animate: boolean }> = {
  idle: { label: '대기', color: '#6e6e82', animate: false },
  thinking: { label: '생각 중', color: '#a78bfa', animate: true },
  streaming: { label: '응답 중', color: '#f97316', animate: true },
  complete: { label: '완료', color: '#34d399', animate: false },
  error: { label: '오류', color: '#f87171', animate: false },
};

const TURN_BADGE: Record<string, { label: string; cls: string }> = {
  'cross-debate': { label: '교차 토론', cls: 'text-purple bg-purple-dim' },
  'ranking': { label: '순위 평가', cls: 'text-amber bg-amber-dim' },
  'conclusion': { label: '최종 결론', cls: 'text-sky bg-sky/10' },
};

function ModelTabs({
  turnIndex,
  modelIds,
  responses,
  activeModelId,
  onSelect,
  modelStatus,
  isCurrentTurn,
}: {
  turnIndex: number;
  modelIds: string[];
  responses: Record<string, string>;
  activeModelId: string;
  onSelect: (turnIndex: number, modelId: string) => void;
  modelStatus: Record<string, ModelStreamStatus>;
  isCurrentTurn: boolean;
}) {
  const { getModel } = useConfigStore();

  return (
    <div className="flex gap-1 bg-base rounded-lg p-1 mb-3">
      {modelIds.map((modelId) => {
        const model = getModel(modelId);
        const active = modelId === activeModelId;
        const color = model?.color ?? '#888';
        const name = model?.name ?? modelId;
        const st = isCurrentTurn
          ? (modelStatus[modelId] ?? 'idle')
          : (responses[modelId] ? 'complete' : 'idle');
        const cfg = STATUS_CFG[st];

        return (
          <button
            key={modelId}
            onClick={() => onSelect(turnIndex, modelId)}
            className={`flex-1 min-w-0 py-2 px-1.5 text-xs border-none rounded-md cursor-pointer transition-all flex flex-col items-center gap-1 overflow-hidden tracking-tight
              ${active ? 'font-semibold bg-overlay' : 'font-normal bg-transparent'}
            `}
            style={{ color: active ? color : 'var(--color-txt-muted)' }}
          >
            <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{name}</span>
            <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: cfg.color }}>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.animate ? 'animate-dot-blink' : ''}`}
                style={{ background: cfg.color }}
              />
              {cfg.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ResultView() {
  const { turns, status, error, selectedModels, activeTabs, setActiveTab, modelStatus } =
    useDebateStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const modelIds = Array.from(selectedModels);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, activeTabs]);

  if (turns.length === 0) return null;

  return (
    <div className="px-4 py-3 flex flex-col gap-3">
      {turns.map((turn, turnIndex) => {
        const activeModelId = activeTabs[turnIndex] || modelIds[0];
        const activeResponse = activeModelId ? turn.responses[activeModelId] : undefined;
        const respondedCount = Object.keys(turn.responses).length;
        const isCurrentTurn = turnIndex === turns.length - 1;
        const badge = TURN_BADGE[turn.type];

        return (
          <div key={turnIndex} className="flex flex-col gap-2 animate-slide-up">
            {turn.userMessage && (
              <div className="px-3.5 py-2.5 bg-overlay rounded-xl border border-border text-[13px] leading-relaxed text-txt">
                <div className="text-[11px] font-semibold text-txt-muted mb-1 uppercase tracking-widest">
                  Question
                </div>
                {turn.userMessage}
              </div>
            )}

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="px-3.5 py-2 text-xs font-semibold text-txt-muted border-b border-border flex items-center gap-2 tracking-tight">
                <span className="text-txt-secondary">R{turnIndex + 1}</span>
                {badge && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
                {isCurrentTurn && status === 'loading' && (
                  <span className="ml-auto text-[11px] text-fire font-medium tabular-nums">
                    {respondedCount}/{modelIds.length}
                  </span>
                )}
              </div>

              <div className="px-3.5 py-2.5">
                <ModelTabs
                  turnIndex={turnIndex}
                  modelIds={modelIds}
                  responses={turn.responses}
                  activeModelId={activeModelId}
                  onSelect={setActiveTab}
                  modelStatus={modelStatus}
                  isCurrentTurn={isCurrentTurn}
                />

                <div className="md-body text-[13px] leading-relaxed min-h-7 text-txt">
                  {activeResponse ? (
                    <Markdown>{activeResponse}</Markdown>
                  ) : (
                    <span className="text-txt-muted text-xs animate-pulse inline-block">
                      응답 대기 중...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {error && (
        <div className="text-err text-xs px-3 py-2 bg-err/8 rounded-md border border-err/20">
          {error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
