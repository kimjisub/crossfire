import type { CrossfireConfig, ModelConfig } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/types';

export async function loadConfig(): Promise<CrossfireConfig> {
  const result = await chrome.storage.local.get('crossfireConfig');
  if (result.crossfireConfig) {
    return result.crossfireConfig as CrossfireConfig;
  }
  return DEFAULT_CONFIG;
}

export async function getModelConfig(modelId: string): Promise<ModelConfig | null> {
  const config = await loadConfig();
  return config.models.find((m) => m.id === modelId) ?? null;
}
