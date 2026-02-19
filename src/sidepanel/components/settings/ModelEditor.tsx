import { useState } from 'react';
import type { ModelConfig, ProviderId } from '../../../shared/types';
import { PROVIDER_CONFIGS } from '../../../shared/types';

interface ModelEditorProps {
  model?: ModelConfig;
  onSave: (data: { name: string; provider: ProviderId; color: string; systemPrompt: string }) => void;
  onCancel: () => void;
}

const PROVIDERS = Object.values(PROVIDER_CONFIGS);

export function ModelEditor({ model, onSave, onCancel }: ModelEditorProps) {
  const [name, setName] = useState(model?.name ?? '');
  const [provider, setProvider] = useState<ProviderId>(model?.provider ?? 'chatgpt');
  const [color, setColor] = useState(model?.color ?? PROVIDER_CONFIGS.chatgpt.defaultColor);
  const [systemPrompt, setSystemPrompt] = useState(model?.systemPrompt ?? '');

  const handleProviderChange = (p: ProviderId) => {
    setProvider(p);
    if (!model) setColor(PROVIDER_CONFIGS[p].defaultColor);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), provider, color, systemPrompt });
  };

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-border-strong rounded-lg outline-none bg-elevated text-txt transition-all focus:border-border-focus focus:ring-3 focus:ring-fire-dim';

  return (
    <div className="border border-border rounded-xl p-3.5 flex flex-col gap-3 bg-surface">
      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          모델 이름
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 보수적 분석가"
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          Provider
        </label>
        <div className="flex gap-1.5">
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className="flex-1 py-2 px-2 text-xs rounded-lg cursor-pointer transition-all"
                style={{
                  fontWeight: active ? 600 : 400,
                  border: `1px solid ${active ? p.defaultColor + '55' : 'rgba(255,255,255,0.12)'}`,
                  background: active ? p.defaultColor + '15' : 'var(--color-elevated)',
                  color: active ? p.defaultColor : 'var(--color-txt-muted)',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          색상
        </label>
        <div className="flex items-center gap-2.5">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 border border-border-strong rounded-lg cursor-pointer p-0.5 bg-elevated"
          />
          <span className="text-xs text-txt-muted font-mono">{color}</span>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-txt-muted block mb-1.5 uppercase tracking-widest">
          시스템 프롬프트
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="이 모델의 역할이나 관점을 설명하세요..."
          rows={3}
          className={`${inputCls} resize-y leading-relaxed`}
        />
      </div>

      <div className="flex gap-1.5 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium border border-border-strong rounded-lg bg-elevated text-txt-secondary cursor-pointer"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={`px-4 py-2 text-xs font-semibold border-none rounded-lg
            ${name.trim() ? 'bg-fire text-white cursor-pointer' : 'bg-overlay text-txt-muted cursor-not-allowed'}
          `}
        >
          {model ? '수정' : '추가'}
        </button>
      </div>
    </div>
  );
}
