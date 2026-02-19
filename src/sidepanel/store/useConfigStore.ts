import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { CrossfireConfig, ModelConfig, ProviderId } from '../../shared/types';
import { DEFAULT_CONFIG, PROVIDER_CONFIGS } from '../../shared/types';

interface ConfigState {
  config: CrossfireConfig;
  loaded: boolean;

  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  addModel: (name: string, provider: ProviderId, systemPrompt: string, color?: string) => void;
  updateModel: (id: string, updates: Partial<Omit<ModelConfig, 'id'>>) => void;
  deleteModel: (id: string) => void;
  setInitialPromptTemplate: (template: string) => void;
  setFinalRankingPromptTemplate: (template: string) => void;
  setPassKeyword: (keyword: string) => void;
  getModel: (modelId: string) => ModelConfig | undefined;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  loaded: false,

  loadConfig: async () => {
    const result = await chrome.storage.local.get('crossfireConfig');
    if (result.crossfireConfig) {
      set({ config: result.crossfireConfig as CrossfireConfig, loaded: true });
    } else {
      set({ config: DEFAULT_CONFIG, loaded: true });
    }
  },

  saveConfig: async () => {
    const { config } = get();
    await chrome.storage.local.set({ crossfireConfig: config });
  },

  addModel: (name, provider, systemPrompt, color) => {
    const newModel: ModelConfig = {
      id: nanoid(),
      name,
      provider,
      color: color ?? PROVIDER_CONFIGS[provider].defaultColor,
      systemPrompt,
    };
    set((state) => ({
      config: { ...state.config, models: [...state.config.models, newModel] },
    }));
    get().saveConfig();
  },

  updateModel: (id, updates) => {
    set((state) => ({
      config: {
        ...state.config,
        models: state.config.models.map((m) =>
          m.id === id ? { ...m, ...updates } : m,
        ),
      },
    }));
    get().saveConfig();
  },

  deleteModel: (id) => {
    set((state) => ({
      config: {
        ...state.config,
        models: state.config.models.filter((m) => m.id !== id),
      },
    }));
    get().saveConfig();
  },

  setInitialPromptTemplate: (template) => {
    set((state) => ({
      config: { ...state.config, initialPromptTemplate: template },
    }));
    get().saveConfig();
  },

  setFinalRankingPromptTemplate: (template) => {
    set((state) => ({
      config: { ...state.config, finalRankingPromptTemplate: template },
    }));
    get().saveConfig();
  },

  setPassKeyword: (keyword) => {
    set((state) => ({
      config: { ...state.config, passKeyword: keyword },
    }));
    get().saveConfig();
  },

  getModel: (modelId) => {
    return get().config.models.find((m) => m.id === modelId);
  },
}));
