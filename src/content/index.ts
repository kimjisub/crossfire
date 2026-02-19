import type { Message } from '../shared/messages';
import type { AIAdapter } from './adapters/types';
import { ChatGPTAdapter } from './adapters/chatgpt';
import { GeminiAdapter } from './adapters/gemini';
import { ClaudeAdapter } from './adapters/claude';

const POLL_INTERVAL = 500;
const STABLE_THRESHOLD = 8;

function createAdapter(): AIAdapter {
  const host = window.location.hostname;
  if (host.includes('chatgpt.com')) return new ChatGPTAdapter();
  if (host.includes('gemini.google.com')) return new GeminiAdapter();
  if (host.includes('claude.ai')) return new ClaudeAdapter();
  throw new Error(`Unsupported host: ${host}`);
}

const adapter = createAdapter();

let currentRoundId: number | undefined;

function sendMsg(message: Message): void {
  if (currentRoundId != null && 'payload' in message && message.payload && 'modelId' in message.payload) {
    (message.payload as Record<string, unknown>).roundId = currentRoundId;
  }
  chrome.runtime.sendMessage(message);
}

function tryExtractResponse(): string | null {
  try {
    return adapter.extractLastResponse();
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({ pong: true });
      return;
    }

    if (message.type === 'SET_MODEL_CONTEXT') {
      document.title = `[CrossFire] ${message.payload.modelName}`;
      sendResponse({ ok: true });
      return;
    }

    if (message.type !== 'INJECT_PROMPT') return;

    currentRoundId = message.payload.roundId;
    handleInjectPrompt(message.payload.prompt, message.payload.modelId)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));

    return true;
  },
);

async function handleInjectPrompt(
  prompt: string,
  modelId: string,
): Promise<void> {
  const initialResponse = tryExtractResponse() ?? '';

  try {
    await adapter.injectPrompt(prompt);
    await adapter.submit();

    sendMsg({ type: 'MODEL_STATUS', payload: { modelId, status: 'thinking' } });

    await new Promise<void>((resolve, reject) => {
      let lastText = '';
      let streamingStarted = false;
      let stableCount = 0;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(pollTimer);
        clearTimeout(timeoutTimer);
        resolve();
      };

      const timeoutTimer = setTimeout(() => {
        if (done) return;
        done = true;
        clearInterval(pollTimer);
        reject(new Error('Response timeout'));
      }, 120_000);

      const pollTimer = setInterval(() => {
        if (done) return;

        const currentText = tryExtractResponse();
        if (currentText === null || currentText === initialResponse) return;

        if (!streamingStarted) {
          streamingStarted = true;
          sendMsg({ type: 'MODEL_STATUS', payload: { modelId, status: 'streaming' } });
        }

        if (currentText !== lastText) {
          lastText = currentText;
          stableCount = 0;
          sendMsg({ type: 'STREAMING_UPDATE', payload: { modelId, response: currentText } });
        } else {
          stableCount++;
          if (stableCount >= STABLE_THRESHOLD && !adapter.isStreaming()) {
            finish();
          }
        }
      }, POLL_INTERVAL);

      adapter.waitForResponse().then(finish).catch(() => {});
    });

    const finalResponse = adapter.extractLastResponse();
    sendMsg({ type: 'STREAMING_UPDATE', payload: { modelId, response: finalResponse } });
    sendMsg({ type: 'MODEL_STATUS', payload: { modelId, status: 'complete' } });
    sendMsg({ type: 'RESPONSE_READY', payload: { modelId, response: finalResponse } });
  } catch (err) {
    sendMsg({ type: 'MODEL_STATUS', payload: { modelId, status: 'error' } });
    sendMsg({ type: 'ERROR', payload: { modelId, error: String(err) } });
  }
}
