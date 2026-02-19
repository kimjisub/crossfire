import { create } from 'zustand';
import type { ConnectionState, Message, ModelStreamStatus } from '../../shared/messages';
import { useConfigStore } from './useConfigStore';

type Status = 'idle' | 'loading' | 'complete';

type TurnType = 'initial' | 'follow-up' | 'cross-debate' | 'ranking' | 'conclusion';

type DebateMode = 'auto' | 'manual';

type DebatePhase = 'idle' | 'debating' | 'ranking' | 'finished' | 'concluding' | 'concluded';

interface RankingEntry {
  modelId: string;
  rank: number;
  reason: string;
}

interface Conclusion {
  modelId: string;
  modelName: string;
  color: string;
  response: string;
}

interface Turn {
  type: TurnType;
  userMessage?: string;
  responses: Record<string, string>;
}

interface DebateState {
  question: string;
  turns: Turn[];
  status: Status;
  error: string | null;
  selectedModels: Set<string>;
  connectionStatus: Record<string, ConnectionState>;
  modelStatus: Record<string, ModelStreamStatus>;
  activeTabs: Record<number, string>;

  debateMode: DebateMode;
  debatePhase: DebatePhase;
  rankings: Record<string, RankingEntry[]>;
  conclusion: Conclusion | null;

  setQuestion: (q: string) => void;
  setDebateMode: (mode: DebateMode) => void;
  startQuery: (text: string) => void;
  sendFollowUp: (text: string) => void;
  startCrossDebate: () => void;
  startRankingRound: () => void;
  startConclusion: () => void;
  addResponse: (modelId: string, response: string) => void;
  updateStreamingResponse: (modelId: string, response: string) => void;
  setModelStatus: (modelId: string, status: ModelStreamStatus) => void;
  completeTurn: () => void;
  setError: (error: string) => void;
  reset: () => void;
  resetAll: () => void;
  toggleModel: (modelId: string) => void;
  setConnectionStatus: (modelId: string, state: ConnectionState) => void;
  checkConnections: () => void;
  setActiveTab: (turnIndex: number, modelId: string) => void;
  cancelRound: () => void;
}

function buildInitialPrompt(modelId: string, question: string): string {
  const configStore = useConfigStore.getState();
  const model = configStore.getModel(modelId);
  const config = configStore.config;

  if (!model) return question;

  const participantList = config.models
    .filter((m) => useDebateStore.getState().selectedModels.has(m.id))
    .map((m) => m.name)
    .join(', ');

  return config.initialPromptTemplate
    .replace(/\{\{modelName\}\}/g, model.name)
    .replace(/\{\{systemPrompt\}\}/g, model.systemPrompt)
    .replace(/\{\{participantList\}\}/g, participantList)
    .replace(/\{\{passKeyword\}\}/g, config.passKeyword)
    .replace(/\{\{question\}\}/g, question);
}

function buildCrossDebatePrompt(
  modelId: string,
  respondedModelIds: string[],
  responses: Record<string, string>,
): string {
  const configStore = useConfigStore.getState();

  const otherResponses = respondedModelIds
    .filter((id) => id !== modelId)
    .map((id) => {
      const m = configStore.getModel(id);
      return `[${m?.name ?? id}] ${responses[id]}`;
    })
    .join('\n\n');

  return `다른 참여자들의 의견:\n\n${otherResponses}\n\n위 의견들에 대해 당신의 견해를 밝혀주세요. 더 이상 추가할 의견이 없으면 "${configStore.config.passKeyword}"를 출력하세요.`;
}

function extractJson(text: string): string | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  let start = -1;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (start === -1) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parseRankings(_modelId: string, response: string): RankingEntry[] {
  try {
    const jsonStr = extractJson(response);
    if (!jsonStr) return [];
    const parsed = JSON.parse(jsonStr);

    const arr = Array.isArray(parsed.rankings) ? parsed.rankings : Array.isArray(parsed) ? parsed : null;
    if (!arr) return [];

    return arr
      .filter((e: unknown) => e && typeof e === 'object' && 'rank' in e)
      .map((e: Record<string, unknown>) => ({
        modelId: String(e.modelId ?? e.model ?? e.name ?? ''),
        rank: Number(e.rank),
        reason: String(e.reason ?? ''),
      }));
  } catch {
    return [];
  }
}

export const useDebateStore = create<DebateState>((set, get) => ({
  question: '',
  turns: [],
  status: 'idle',
  error: null,
  selectedModels: new Set<string>(),
  connectionStatus: {},
  modelStatus: {},
  activeTabs: {},
  debateMode: 'manual',
  debatePhase: 'idle',
  rankings: {},
  conclusion: null,

  setQuestion: (question) => set({ question }),

  setDebateMode: (mode) => set({ debateMode: mode }),

  startQuery: (text) => {
    const { selectedModels } = get();
    const modelIds = Array.from(selectedModels);

    const prompts: Record<string, string> = {};
    for (const modelId of modelIds) {
      prompts[modelId] = buildInitialPrompt(modelId, text);
    }

    set({
      question: '',
      turns: [{ type: 'initial', userMessage: text, responses: {} }],
      status: 'loading',
      error: null,
      activeTabs: {},
      modelStatus: {},
      debatePhase: 'debating',
      rankings: {},
      conclusion: null,
    });

    const message: Message = {
      type: 'START_DEBATE_ROUND',
      payload: { prompts, modelIds },
    };
    chrome.runtime.sendMessage(message);
  },

  sendFollowUp: (text) => {
    const { selectedModels } = get();
    const modelIds = Array.from(selectedModels);
    set((state) => ({
      question: '',
      turns: [...state.turns, { type: 'follow-up', userMessage: text, responses: {} }],
      status: 'loading',
      modelStatus: {},
      error: null,
    }));
    const message: Message = {
      type: 'START_QUERY',
      payload: { question: text, modelIds },
    };
    chrome.runtime.sendMessage(message);
  },

  startCrossDebate: () => {
    const { turns, selectedModels } = get();
    const currentTurn = turns[turns.length - 1];
    if (!currentTurn) return;

    const modelIds = Array.from(selectedModels);
    const respondedModelIds = modelIds.filter((id) => currentTurn.responses[id]);
    if (respondedModelIds.length < 2) return;

    const prompts: Record<string, string> = {};
    for (const modelId of respondedModelIds) {
      prompts[modelId] = buildCrossDebatePrompt(
        modelId,
        respondedModelIds,
        currentTurn.responses,
      );
    }

    set((state) => ({
      turns: [...state.turns, { type: 'cross-debate', responses: {} }],
      status: 'loading',
      modelStatus: {},
      error: null,
    }));

    const message: Message = {
      type: 'START_DEBATE_ROUND',
      payload: { prompts, modelIds: respondedModelIds },
    };
    chrome.runtime.sendMessage(message);
  },

  startRankingRound: () => {
    const { selectedModels } = get();
    const configStore = useConfigStore.getState();
    const modelIds = Array.from(selectedModels);

    const prompts: Record<string, string> = {};
    for (const modelId of modelIds) {
      prompts[modelId] = configStore.config.finalRankingPromptTemplate;
    }

    set((state) => ({
      turns: [...state.turns, { type: 'ranking', responses: {} }],
      status: 'loading',
      modelStatus: {},
      debatePhase: 'ranking',
    }));

    const message: Message = {
      type: 'START_DEBATE_ROUND',
      payload: { prompts, modelIds },
    };
    chrome.runtime.sendMessage(message);
  },

  startConclusion: () => {
    const { rankings, selectedModels } = get();
    const configStore = useConfigStore.getState();
    const modelIds = Array.from(selectedModels);

    // 종합 점수 계산으로 1등 모델 결정
    const scores = new Map<string, number>();
    const nameToId = new Map<string, string>();
    for (const m of configStore.config.models) {
      nameToId.set(m.name.toLowerCase(), m.id);
      nameToId.set(m.id, m.id);
    }
    for (const id of modelIds) scores.set(id, 0);

    for (const entries of Object.values(rankings)) {
      for (const entry of entries) {
        let resolvedId: string | null = null;
        const raw = entry.modelId;
        if (nameToId.has(raw)) resolvedId = nameToId.get(raw)!;
        else {
          const lower = raw.toLowerCase();
          if (nameToId.has(lower)) resolvedId = nameToId.get(lower)!;
          else {
            for (const [key, id] of nameToId) {
              if (key.includes(lower) || lower.includes(key)) { resolvedId = id; break; }
            }
          }
        }
        if (resolvedId && scores.has(resolvedId)) {
          scores.set(resolvedId, (scores.get(resolvedId) ?? 0) + modelIds.length - entry.rank + 1);
        }
      }
    }

    let topModelId = modelIds[0];
    let topScore = 0;
    for (const [id, score] of scores) {
      if (score > topScore) { topScore = score; topModelId = id; }
    }

    const prompt = '지금까지의 토론을 종합하여, 원래 질문에 대한 최종 결론을 작성해주세요. 모든 참여자의 의견을 고려하여 균형 잡힌 결론을 내려주세요.';

    set((state) => ({
      turns: [...state.turns, { type: 'conclusion' as TurnType, responses: {} }],
      status: 'loading',
      modelStatus: {},
      debatePhase: 'concluding' as DebatePhase,
    }));

    const message: Message = {
      type: 'START_DEBATE_ROUND',
      payload: { prompts: { [topModelId]: prompt }, modelIds: [topModelId] },
    };
    chrome.runtime.sendMessage(message);
  },

  addResponse: (modelId, response) =>
    set((state) => {
      const turns = [...state.turns];
      const lastIdx = turns.length - 1;
      const currentTurn = turns[lastIdx];
      if (currentTurn) {
        turns[lastIdx] = {
          ...currentTurn,
          responses: { ...currentTurn.responses, [modelId]: response },
        };
      }
      const activeTabs = { ...state.activeTabs };
      if (!activeTabs[lastIdx]) {
        activeTabs[lastIdx] = modelId;
      }
      return { turns, activeTabs };
    }),

  updateStreamingResponse: (modelId, response) =>
    set((state) => {
      const turns = [...state.turns];
      const lastIdx = turns.length - 1;
      const currentTurn = turns[lastIdx];
      if (currentTurn) {
        turns[lastIdx] = {
          ...currentTurn,
          responses: { ...currentTurn.responses, [modelId]: response },
        };
      }
      const activeTabs = { ...state.activeTabs };
      if (!activeTabs[lastIdx]) {
        activeTabs[lastIdx] = modelId;
      }
      return { turns, activeTabs };
    }),

  setModelStatus: (modelId, status) =>
    set((state) => ({
      modelStatus: { ...state.modelStatus, [modelId]: status },
    })),

  completeTurn: () => {
    const { turns, selectedModels, debateMode, debatePhase } = get();
    const currentTurn = turns[turns.length - 1];
    if (!currentTurn) {
      set({ status: 'complete' });
      return;
    }

    if (currentTurn.type === 'conclusion') {
      const [modelId, response] = Object.entries(currentTurn.responses)[0] ?? [];
      const model = modelId ? useConfigStore.getState().getModel(modelId) : null;
      set({
        status: 'complete',
        debatePhase: 'concluded',
        conclusion: modelId && response
          ? { modelId, modelName: model?.name ?? modelId, color: model?.color ?? '#888', response }
          : null,
      });
      return;
    }

    if (currentTurn.type === 'ranking') {
      const newRankings: Record<string, RankingEntry[]> = {};
      for (const [modelId, response] of Object.entries(currentTurn.responses)) {
        newRankings[modelId] = parseRankings(modelId, response);
      }
      set({ status: 'complete', debatePhase: 'finished', rankings: newRankings });
      setTimeout(() => get().startConclusion(), 500);
      return;
    }

    const configStore = useConfigStore.getState();
    const passKeyword = configStore.config.passKeyword;
    const modelIds = Array.from(selectedModels);
    const allPassed = modelIds.every((id) => {
      const resp = currentTurn.responses[id];
      return resp && resp.includes(passKeyword);
    });

    if (allPassed && debatePhase === 'debating') {
      set({ status: 'complete' });
      setTimeout(() => get().startRankingRound(), 500);
      return;
    }

    if (debateMode === 'auto' && debatePhase === 'debating' && currentTurn.type === 'cross-debate') {
      const hasNonPassedModel = modelIds.some((id) => {
        const resp = currentTurn.responses[id];
        return resp && !resp.includes(passKeyword);
      });
      if (hasNonPassedModel) {
        set({ status: 'complete' });
        setTimeout(() => get().startCrossDebate(), 500);
        return;
      }
    }

    set({ status: 'complete' });
  },

  setError: (error) => set({ error }),

  reset: () =>
    set({
      question: '',
      turns: [],
      status: 'idle',
      error: null,
      activeTabs: {},
      modelStatus: {},
      debatePhase: 'idle',
      rankings: {},
      conclusion: null,
    }),

  resetAll: () => {
    const { selectedModels } = get();
    const modelIds = Array.from(selectedModels);

    // 상태 초기화
    set({
      question: '',
      turns: [],
      status: 'idle',
      error: null,
      activeTabs: {},
      modelStatus: {},
      connectionStatus: Object.fromEntries(modelIds.map((id) => [id, 'checking' as ConnectionState])),
      debatePhase: 'idle',
      rankings: {},
      conclusion: null,
    });

    // background에 전체 리셋 요청
    const message: Message = {
      type: 'RESET_ALL',
      payload: { modelIds },
    };
    chrome.runtime.sendMessage(message);
  },

  toggleModel: (modelId) => {
    const { selectedModels, setConnectionStatus } = get();
    const next = new Set(selectedModels);
    if (next.has(modelId)) {
      next.delete(modelId);
      set({ selectedModels: next });
    } else {
      next.add(modelId);
      set({ selectedModels: next });
      setConnectionStatus(modelId, 'checking');
      const message: Message = {
        type: 'OPEN_TAB',
        payload: { modelId },
      };
      chrome.runtime.sendMessage(message);
    }
  },

  setConnectionStatus: (modelId, connectionState) =>
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, [modelId]: connectionState },
    })),

  checkConnections: () => {
    const { selectedModels } = get();
    const modelIds = Array.from(selectedModels);
    for (const modelId of modelIds) {
      get().setConnectionStatus(modelId, 'checking');
    }
    const message: Message = {
      type: 'CHECK_CONNECTION',
      payload: { modelIds },
    };
    chrome.runtime.sendMessage(message);
  },

  setActiveTab: (turnIndex, modelId) =>
    set((state) => ({
      activeTabs: { ...state.activeTabs, [turnIndex]: modelId },
    })),

  cancelRound: () => set({ status: 'complete' }),
}));
