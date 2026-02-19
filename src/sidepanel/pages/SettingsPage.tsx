import { useConfigStore } from '../store/useConfigStore';
import { ModelList } from '../components/settings/ModelList';
import { PromptEditor } from '../components/settings/PromptEditor';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const {
    config,
    addModel,
    updateModel,
    deleteModel,
    setInitialPromptTemplate,
    setFinalRankingPromptTemplate,
    setPassKeyword,
  } = useConfigStore();

  return (
    <div className="flex flex-col h-screen bg-base">
      <header className="px-4 py-3.5 bg-surface border-b border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center border border-border-strong rounded-lg bg-elevated text-txt-secondary text-sm cursor-pointer transition-all hover:border-border-focus"
        >
          &larr;
        </button>
        <h1 className="text-[15px] font-bold text-txt tracking-tight">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        <ModelList
          models={config.models}
          onAdd={addModel}
          onUpdate={updateModel}
          onDelete={deleteModel}
        />
        <div className="border-t border-border pt-4">
          <PromptEditor
            initialPromptTemplate={config.initialPromptTemplate}
            finalRankingPromptTemplate={config.finalRankingPromptTemplate}
            passKeyword={config.passKeyword}
            onInitialPromptChange={setInitialPromptTemplate}
            onFinalRankingPromptChange={setFinalRankingPromptTemplate}
            onPassKeywordChange={setPassKeyword}
          />
        </div>

        <a
          href="https://github.com/kimjisub/crossfire"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 text-xs text-txt-muted hover:text-txt border border-border rounded-lg transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub Repository
        </a>
      </div>
    </div>
  );
}
