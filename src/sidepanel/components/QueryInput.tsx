import { useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { useDebateStore } from '../store/useDebateStore';

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/>
    </svg>
  );
}

export function QueryInput() {
  const {
    question,
    setQuestion,
    startQuery,
    sendFollowUp,
    startCrossDebate,
    startRankingRound,
    cancelRound,
    status,
    selectedModels,
    turns,
    debateMode,
    setDebateMode,
    debatePhase,
  } = useDebateStore();

  const isLoading = status === 'loading';
  const hasModels = selectedModels.size > 0;
  const hasTurns = turns.length > 0;
  const hasText = question.trim().length > 0;

  const lastTurn = turns[turns.length - 1];
  const respondedCount = lastTurn ? Object.keys(lastTurn.responses).length : 0;
  const inDebate = debatePhase === 'idle' || debatePhase === 'debating';

  const canCrossDebate =
    debateMode === 'manual' && status === 'complete' && hasTurns && respondedCount >= 2 && inDebate;
  const canRank =
    status === 'complete' && hasTurns && respondedCount >= 2 && inDebate;
  const canSubmit = hasText && !isLoading && hasModels;
  const showActions = !hasText && (canCrossDebate || canRank);

  const handleSubmit = useCallback(() => {
    const trimmed = question.trim();
    if (!trimmed || isLoading || !hasModels) return;
    if (!hasTurns) startQuery(trimmed);
    else sendFollowUp(trimmed);
  }, [question, isLoading, hasModels, hasTurns, startQuery, sendFollowUp]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value),
    [setQuestion],
  );

  return (
    <div className="rounded-xl border border-border-strong bg-elevated overflow-hidden transition-all focus-within:border-border-focus focus-within:ring-1 focus-within:ring-fire-dim">
      <textarea
        value={question}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={hasTurns ? 'Follow-up question...' : 'Enter a debate topic...'}
        disabled={isLoading}
        rows={2}
        className="w-full resize-none px-3.5 pt-3 pb-2 text-[13px] bg-transparent text-txt outline-none leading-relaxed placeholder:text-txt-muted"
      />

      <div className="flex items-center justify-between px-2.5 pb-2">
        {/* Left: manual/auto toggle */}
        <div className="flex items-center rounded-lg bg-base p-0.5 gap-0.5">
          {(['manual', 'auto'] as const).map((mode) => {
            const active = debateMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setDebateMode(mode)}
                disabled={isLoading}
                className={`px-2.5 py-1 text-[11px] border-none rounded-md cursor-pointer transition-all
                  ${active ? 'font-semibold bg-overlay text-txt' : 'font-normal bg-transparent text-txt-muted'}
                  ${isLoading ? 'cursor-not-allowed' : ''}
                `}
              >
                {mode === 'manual' ? 'Manual' : 'Auto'}
              </button>
            );
          })}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <button
              onClick={cancelRound}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg text-err bg-err/10 border border-err/20 cursor-pointer transition-all"
            >
              Stop
            </button>
          ) : showActions ? (
            <>
              {canCrossDebate && (
                <button
                  onClick={startCrossDebate}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border-none bg-purple-dim text-purple cursor-pointer transition-all"
                >
                  Cross
                </button>
              )}
              {canRank && (
                <button
                  onClick={startRankingRound}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border-none bg-amber-dim text-amber cursor-pointer transition-all"
                >
                  Rank
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border-none transition-all
                ${canSubmit ? 'bg-fire text-white cursor-pointer' : 'bg-overlay text-txt-muted cursor-not-allowed'}
              `}
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
