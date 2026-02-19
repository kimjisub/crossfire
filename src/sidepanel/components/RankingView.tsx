import { useDebateStore } from '../store/useDebateStore';
import { useConfigStore } from '../store/useConfigStore';

interface AggregatedScore {
  modelId: string;
  name: string;
  color: string;
  totalScore: number;
  avgRank: number;
  details: { rankedBy: string; rank: number; reason: string }[];
}

const MEDAL = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

export function RankingView() {
  const { rankings, selectedModels } = useDebateStore();
  const { config, getModel } = useConfigStore();

  const modelIds = Array.from(selectedModels);
  if (Object.keys(rankings).length === 0) return null;

  const nameToId = new Map<string, string>();
  for (const m of config.models) {
    nameToId.set(m.name.toLowerCase(), m.id);
    nameToId.set(m.id, m.id);
  }

  function resolveModelId(raw: string): string | null {
    if (nameToId.has(raw)) return nameToId.get(raw)!;
    const lower = raw.toLowerCase();
    if (nameToId.has(lower)) return nameToId.get(lower)!;
    for (const [key, id] of nameToId) {
      if (key.includes(lower) || lower.includes(key)) return id;
    }
    return null;
  }

  const aggregated: Map<string, AggregatedScore> = new Map();
  for (const modelId of modelIds) {
    const model = getModel(modelId);
    aggregated.set(modelId, {
      modelId, name: model?.name ?? modelId, color: model?.color ?? '#888',
      totalScore: 0, avgRank: 0, details: [],
    });
  }

  for (const [rankerId, entries] of Object.entries(rankings)) {
    const rankerName = getModel(rankerId)?.name ?? rankerId;
    for (const entry of entries) {
      const resolvedId = resolveModelId(entry.modelId);
      const agg = resolvedId ? aggregated.get(resolvedId) : null;
      if (agg) {
        agg.totalScore += modelIds.length - entry.rank + 1;
        agg.details.push({ rankedBy: rankerName, rank: entry.rank, reason: entry.reason });
      }
    }
  }

  for (const agg of aggregated.values()) {
    if (agg.details.length > 0) {
      agg.avgRank = agg.details.reduce((s, d) => s + d.rank, 0) / agg.details.length;
    }
  }

  const sorted = Array.from(aggregated.values()).sort((a, b) => b.totalScore - a.totalScore);
  if (!sorted.some((a) => a.details.length > 0)) {
    return (
      <div className="px-4 pb-2.5">
        <div className="bg-amber-dim border border-amber/20 rounded-xl px-3.5 py-3 text-xs text-amber">
          순위 데이터를 파싱하지 못했습니다. 결과 탭에서 원문을 확인하세요.
        </div>
      </div>
    );
  }

  const maxScore = sorted[0]?.totalScore ?? 1;

  return (
    <div className="px-4 pb-2.5 animate-slide-up">
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-3.5 py-2.5 text-[13px] font-bold text-amber border-b border-border flex items-center gap-2 tracking-tight">
          <span className="text-base">{'\u{1F3C6}'}</span>
          종합 순위
        </div>

        <div className="p-3 flex flex-col gap-1.5">
          {sorted.map((agg, index) => (
            <div
              key={agg.modelId}
              className={`flex items-start gap-2.5 p-3 rounded-lg border animate-slide-up
                ${index === 0 ? 'bg-amber-dim border-amber/15' : 'bg-elevated border-border'}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="text-base leading-snug min-w-[24px] text-center shrink-0">
                {MEDAL[index] ?? <span className="text-txt-muted text-sm font-bold">{index + 1}</span>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{
                      background: agg.color,
                      boxShadow: index === 0 ? `0 0 8px ${agg.color}66` : undefined,
                    }}
                  />
                  <span className="text-[13px] font-bold text-txt tracking-tight">{agg.name}</span>
                  <span className="text-[11px] text-txt-muted ml-auto whitespace-nowrap tabular-nums">
                    {agg.totalScore}pt
                  </span>
                </div>

                {/* Score bar */}
                <div className="h-1 rounded-sm bg-base mb-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-[width] duration-500 ease-out"
                    style={{ width: `${(agg.totalScore / maxScore) * 100}%`, background: agg.color }}
                  />
                </div>

                {agg.details.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {agg.details.map((d, i) => (
                      <div key={i} className="text-[11px] text-txt-muted leading-relaxed">
                        <span className="font-semibold text-txt-secondary">{d.rankedBy}</span>
                        {' '}{d.rank}위
                        {d.reason && <span> &mdash; {d.reason}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
