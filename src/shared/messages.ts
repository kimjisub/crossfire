export interface ModelResponse {
  modelId: string;
  response: string;
}

export type ConnectionState = 'unknown' | 'checking' | 'connected' | 'disconnected';

export type ModelStreamStatus = 'idle' | 'thinking' | 'streaming' | 'complete' | 'error';

export type Message =
  | { type: 'START_QUERY'; payload: { question: string; modelIds: string[] } }
  | { type: 'START_DEBATE_ROUND'; payload: { prompts: Record<string, string>; modelIds: string[] } }
  | { type: 'INJECT_PROMPT'; payload: { prompt: string; modelId: string; roundId?: number } }
  | { type: 'SET_MODEL_CONTEXT'; payload: { modelId: string; modelName: string } }
  | { type: 'RESPONSE_READY'; payload: { modelId: string; response: string; roundId?: number } }
  | { type: 'STREAMING_UPDATE'; payload: { modelId: string; response: string; roundId?: number } }
  | { type: 'MODEL_STATUS'; payload: { modelId: string; status: ModelStreamStatus; roundId?: number } }
  | { type: 'QUERY_COMPLETE'; payload: { results: ModelResponse[] } }
  | { type: 'ERROR'; payload: { modelId: string; error: string; roundId?: number } }
  | { type: 'OPEN_TAB'; payload: { modelId: string } }
  | { type: 'CHECK_CONNECTION'; payload: { modelIds: string[] } }
  | { type: 'CONNECTION_STATUS'; payload: { modelId: string; connected: boolean } }
  | { type: 'RESET_ALL'; payload: { modelIds: string[] } }
  | { type: 'RESET_ALL_COMPLETE' }
  | { type: 'PING' };

export type MessageType = Message['type'];
