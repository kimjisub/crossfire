import { useEffect, useRef } from 'react';
import { ModelSelector } from '../components/ModelSelector';
import { QueryInput } from '../components/QueryInput';
import { ResultView } from '../components/ResultView';
import { RankingView } from '../components/RankingView';
import { ConclusionView } from '../components/ConclusionView';
import { useDebateStore } from '../store/useDebateStore';

interface DebatePageProps {
  onOpenSettings: () => void;
}

export function DebatePage({ onOpenSettings }: DebatePageProps) {
  const { debatePhase, resetAll, turns } = useDebateStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const showRanking = debatePhase === 'finished' || debatePhase === 'concluding' || debatePhase === 'concluded';
  const showConclusion = debatePhase === 'concluding' || debatePhase === 'concluded';
  const hasTurns = turns.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, debatePhase]);

  return (
    <div className="flex flex-col h-screen bg-base">
      <header className="px-4 py-3 bg-surface border-b border-border flex flex-col gap-2.5">
        <div className="flex justify-end items-center gap-1.5">
          {hasTurns && (
            <button
              onClick={resetAll}
              title="Start over"
              className="w-8 h-8 flex items-center justify-center border border-border-strong rounded-lg bg-elevated text-txt-muted hover:border-err/40 hover:text-err transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 flex items-center justify-center border border-border-strong rounded-lg bg-elevated text-txt-muted hover:border-border-focus hover:text-txt-secondary transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <ModelSelector />
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <ResultView />
        {showRanking && <RankingView />}
        {showConclusion && <ConclusionView />}
        <div ref={bottomRef} />
      </div>

      <footer className="px-3 pt-2 pb-3 bg-surface border-t border-border">
        <QueryInput />
      </footer>
    </div>
  );
}
