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
        <h1 className="text-[15px] font-bold text-txt tracking-tight">설정</h1>
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
      </div>
    </div>
  );
}
