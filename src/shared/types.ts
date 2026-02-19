export type ProviderId = 'chatgpt' | 'gemini' | 'claude';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  url: string;
  urlPattern: string;
  defaultColor: string;
}

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  chatgpt: {
    id: 'chatgpt',
    label: 'ChatGPT',
    url: 'https://chatgpt.com/',
    urlPattern: 'https://chatgpt.com/*',
    defaultColor: '#10A37F',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    url: 'https://gemini.google.com/app',
    urlPattern: 'https://gemini.google.com/*',
    defaultColor: '#4285F4',
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    url: 'https://claude.ai/new',
    urlPattern: 'https://claude.ai/*',
    defaultColor: '#D97706',
  },
};

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderId;
  color: string;
  systemPrompt: string;
}

export interface CrossfireConfig {
  models: ModelConfig[];
  initialPromptTemplate: string;
  finalRankingPromptTemplate: string;
  passKeyword: string;
}

export const DEFAULT_INITIAL_PROMPT_TEMPLATE = `You are playing the role of "{{modelName}}".
{{systemPrompt}}

The following participants are in this debate: {{participantList}}

Debate rules:
- If you have nothing more to add, output "{{passKeyword}}".
- You may agree with, rebut, or supplement other participants' opinions.

---

Question: {{question}}`;

export const DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE = `The debate has concluded. Based on the discussion so far, please evaluate and rank each participant's contributions (including yourself).

Respond only in the following JSON format:
{
  "rankings": [
    { "modelId": "modelID", "rank": 1, "reason": "reason" },
    { "modelId": "modelID", "rank": 2, "reason": "reason" }
  ]
}`;

export const DEFAULT_PASS_KEYWORD = '[PASS]';

export const DEFAULT_CONFIG: CrossfireConfig = {
  models: [],
  initialPromptTemplate: DEFAULT_INITIAL_PROMPT_TEMPLATE,
  finalRankingPromptTemplate: DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE,
  passKeyword: DEFAULT_PASS_KEYWORD,
};
