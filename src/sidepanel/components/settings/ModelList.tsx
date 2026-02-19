import { useState } from 'react';
import type { ModelConfig, ProviderId } from '../../../shared/types';
import { PROVIDER_CONFIGS } from '../../../shared/types';
import { ModelEditor } from './ModelEditor';

interface ModelListProps {
  models: ModelConfig[];
  onAdd: (name: string, provider: ProviderId, systemPrompt: string, color?: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<ModelConfig, 'id'>>) => void;
  onDelete: (id: string) => void;
}

export function ModelList({ models, onAdd, onUpdate, onDelete }: ModelListProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);

  const handleSave = (data: { name: string; provider: ProviderId; color: string; systemPrompt: string }) => {
    if (editingModel) onUpdate(editingModel.id, data);
    else onAdd(data.name, data.provider, data.systemPrompt, data.color);
    setShowEditor(false);
    setEditingModel(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[15px] font-bold text-txt tracking-tight">모델 목록</span>
        {!showEditor && (
          <button
            onClick={() => { setEditingModel(null); setShowEditor(true); }}
            className="px-3 py-1.5 text-xs font-semibold border border-fire/30 rounded-lg bg-fire-dim text-fire cursor-pointer transition-all"
          >
            + 추가
          </button>
        )}
      </div>

      {models.length === 0 && !showEditor && (
        <div className="text-[13px] text-txt-muted py-6 text-center bg-surface rounded-xl border border-dashed border-border-strong">
          등록된 모델이 없습니다.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {models.map((model) => (
          <div
            key={model.id}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-surface border border-border rounded-lg"
            style={{ borderLeft: `3px solid ${model.color}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-txt tracking-tight">{model.name}</div>
              <div className="text-[11px] text-txt-muted mt-0.5">
                {PROVIDER_CONFIGS[model.provider].label}
                {model.systemPrompt && (
                  <span className="ml-1">
                    &middot; {model.systemPrompt.slice(0, 35)}{model.systemPrompt.length > 35 ? '...' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => { setEditingModel(model); setShowEditor(true); }}
              className="px-2.5 py-1 text-[11px] font-medium border border-border-strong rounded-md bg-elevated text-txt-secondary cursor-pointer"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(model.id)}
              className="px-2.5 py-1 text-[11px] font-medium border border-err/25 rounded-md bg-err/5 text-err cursor-pointer"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {showEditor && (
        <div className="mt-2">
          <ModelEditor
            model={editingModel ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingModel(null); }}
          />
        </div>
      )}
    </div>
  );
}
