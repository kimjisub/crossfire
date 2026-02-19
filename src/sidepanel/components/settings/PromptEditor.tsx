import {
  DEFAULT_INITIAL_PROMPT_TEMPLATE,
  DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE,
  DEFAULT_PASS_KEYWORD,
} from '../../../shared/types';

interface PromptEditorProps {
  initialPromptTemplate: string;
  finalRankingPromptTemplate: string;
  passKeyword: string;
  onInitialPromptChange: (template: string) => void;
  onFinalRankingPromptChange: (template: string) => void;
  onPassKeywordChange: (keyword: string) => void;
}

const resetBtnCls = 'px-2 py-0.5 text-[10px] text-txt-muted border border-border-strong rounded-md bg-elevated cursor-pointer transition-all hover:border-border-focus';

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
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-txt m-0 tracking-tight">Prompt Settings</h3>
        <button
          onClick={() => {
            onInitialPromptChange(DEFAULT_INITIAL_PROMPT_TEMPLATE);
            onFinalRankingPromptChange(DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE);
            onPassKeywordChange(DEFAULT_PASS_KEYWORD);
          }}
          className="px-2.5 py-1 text-[11px] text-txt-muted border border-border-strong rounded-lg bg-elevated cursor-pointer transition-all hover:border-border-focus"
        >
          Reset All
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-txt-muted uppercase tracking-widest">
            Initial Prompt Template
          </label>
          <button onClick={() => onInitialPromptChange(DEFAULT_INITIAL_PROMPT_TEMPLATE)} className={resetBtnCls}>
            Reset
          </button>
        </div>
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
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-txt-muted uppercase tracking-widest">
            Final Ranking Prompt Template
          </label>
          <button onClick={() => onFinalRankingPromptChange(DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE)} className={resetBtnCls}>
            Reset
          </button>
        </div>
        <textarea
          value={finalRankingPromptTemplate}
          onChange={(e) => onFinalRankingPromptChange(e.target.value)}
          rows={6}
          className={textareaCls}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-txt-muted uppercase tracking-widest">
            Pass Keyword
          </label>
          <button onClick={() => onPassKeywordChange(DEFAULT_PASS_KEYWORD)} className={resetBtnCls}>
            Reset
          </button>
        </div>
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
