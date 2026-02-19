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

export const DEFAULT_INITIAL_PROMPT_TEMPLATE = `당신은 "{{modelName}}" 역할입니다.
{{systemPrompt}}

이 토론에는 다음 참여자들이 있습니다: {{participantList}}

토론 규칙:
- 더 이상 추가할 의견이 없으면 "{{passKeyword}}"를 출력하세요.
- 다른 참여자의 의견에 대해 동의, 반박, 보완할 수 있습니다.

---

질문: {{question}}`;

export const DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE = `토론이 종료되었습니다. 지금까지의 토론을 바탕으로, 각 참여자(자신 포함)의 기여도를 평가하여 순위를 매겨주세요.

다음 JSON 형식으로만 응답하세요:
{
  "rankings": [
    { "modelId": "모델ID", "rank": 1, "reason": "이유" },
    { "modelId": "모델ID", "rank": 2, "reason": "이유" }
  ]
}`;

export const DEFAULT_PASS_KEYWORD = '[PASS]';

export const DEFAULT_CONFIG: CrossfireConfig = {
  models: [],
  initialPromptTemplate: DEFAULT_INITIAL_PROMPT_TEMPLATE,
  finalRankingPromptTemplate: DEFAULT_FINAL_RANKING_PROMPT_TEMPLATE,
  passKeyword: DEFAULT_PASS_KEYWORD,
};
