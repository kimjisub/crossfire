import Markdown from 'react-markdown';
import { useDebateStore } from '../store/useDebateStore';

export function ConclusionView() {
  const { conclusion, debatePhase } = useDebateStore();

  if (debatePhase === 'concluding') {
    return (
      <div className="px-4 pb-2.5 animate-slide-up">
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-3.5 py-2.5 text-[13px] font-bold text-sky border-b border-border flex items-center gap-2 tracking-tight">
            <span className="text-base">{'\u{1F4DD}'}</span>
            최종 결론
          </div>
          <div className="py-8 px-4 text-center text-[13px] text-txt-muted">
            <span className="animate-pulse inline-block">
              1등 모델이 최종 결론을 작성 중입니다...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (debatePhase !== 'concluded' || !conclusion) return null;

  return (
    <div className="px-4 pb-2.5 animate-slide-up">
      <div className="bg-surface rounded-xl border border-border overflow-hidden relative">
        <div
          className="absolute top-0 inset-x-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${conclusion.color}, #60a5fa)` }}
        />

        <div className="px-3.5 pt-3 pb-2.5 text-[13px] font-bold text-sky border-b border-border flex items-center gap-2 tracking-tight">
          <span className="text-base">{'\u{1F4DD}'}</span>
          <span>최종 결론</span>
          <span
            className="text-[11px] font-medium rounded-md px-2 py-0.5 inline-flex items-center gap-1.5 ml-auto"
            style={{
              color: conclusion.color,
              background: conclusion.color + '18',
              border: `1px solid ${conclusion.color}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: conclusion.color }}
            />
            {conclusion.modelName}
          </span>
        </div>

        <div className="md-body px-4 py-3.5 text-[13px] leading-relaxed text-txt">
          <Markdown>{conclusion.response}</Markdown>
        </div>
      </div>
    </div>
  );
}
