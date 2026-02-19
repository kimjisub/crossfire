interface PromptEditorProps {
  initialPromptTemplate: string;
  finalRankingPromptTemplate: string;
  passKeyword: string;
  onInitialPromptChange: (template: string) => void;
  onFinalRankingPromptChange: (template: string) => void;
  onPassKeywordChange: (keyword: string) => void;
}

export function PromptEditor({
  initialPromptTemplate,
  finalRankingPromptTemplate,
  passKeyword,
  onInitialPromptChange,
  onFinalRankingPromptChange,
  onPassKeywordChange,
}: PromptEditorProps) {
  const textareaCls = 'w-full px-3 py-2 text-xs border border-border-strong rounded-lg font-mono resize-y outline-none leading-relaxed bg-elevated text-txt transition-all focus:border-border-focus focus:ring-3 focus:ring-fire-dim';

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[15px] font-bold text-txt m-0 tracking-tight">Prompt Settings</h3>

      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          Initial Prompt Template
        </label>
        <div className="text-[11px] text-txt-muted mb-1.5 leading-snug">
          {'{{modelName}} {{participantList}} {{passKeyword}} {{systemPrompt}} {{question}}'}
        </div>
        <textarea
          value={initialPromptTemplate}
          onChange={(e) => onInitialPromptChange(e.target.value)}
          rows={8}
          className={textareaCls}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          Final Ranking Prompt Template
        </label>
        <textarea
          value={finalRankingPromptTemplate}
          onChange={(e) => onFinalRankingPromptChange(e.target.value)}
          rows={6}
          className={textareaCls}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          Pass Keyword
        </label>
        <div className="text-[11px] text-txt-muted mb-1.5">
          Keyword models output when they have nothing more to add
        </div>
        <input
          type="text"
          value={passKeyword}
          onChange={(e) => onPassKeywordChange(e.target.value)}
          className="w-44 px-3 py-2 text-[13px] border border-border-strong rounded-lg font-mono outline-none bg-elevated text-txt transition-all focus:border-border-focus focus:ring-3 focus:ring-fire-dim"
        />
      </div>
    </div>
  );
}
