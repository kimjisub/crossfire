import type { AIAdapter } from './types';
import { findElement } from '../utils';

const SELECTORS = {
  promptTextarea: [
    '#prompt-textarea',
    'div[contenteditable="true"][id="prompt-textarea"]',
  ],
  sendButton: [
    '[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="프롬프트 보내기"]',
  ],
  stopButton: [
    '[data-testid="stop-button"]',
    'button[aria-label="Stop generating"]',
    'button[aria-label="생성 중지"]',
  ],
  assistantMessage: '[data-message-author-role="assistant"]',
} as const;

const DEFAULT_TIMEOUT = 120_000;
const STABILIZE_DELAY = 2_000;

export class ChatGPTAdapter implements AIAdapter {
  async injectPrompt(text: string): Promise<void> {
    const editor = await findElement(SELECTORS.promptTextarea, 'ChatGPT 입력 필드');
    (editor as HTMLElement).focus();
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    editor.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true }),
    );
  }

  async submit(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    const button = await findElement(SELECTORS.sendButton, 'ChatGPT 전송 버튼');
    (button as HTMLButtonElement).click();
  }

  async waitForResponse(timeout = DEFAULT_TIMEOUT): Promise<void> {
    const initialCount = document.querySelectorAll(SELECTORS.assistantMessage).length;

    return new Promise((resolve, reject) => {
      let stabilizeTimer: ReturnType<typeof setTimeout> | null = null;

      const timeoutTimer = setTimeout(() => {
        observer.disconnect();
        if (stabilizeTimer) clearTimeout(stabilizeTimer);
        reject(new Error('ChatGPT 응답 시간이 초과되었습니다'));
      }, timeout);

      const tryStabilize = () => {
        if (stabilizeTimer) clearTimeout(stabilizeTimer);
        stabilizeTimer = setTimeout(() => {
          // stop 버튼이 아직 있으면 스트리밍 중이므로 대기
          if (this.isStreaming()) return;
          observer.disconnect();
          clearTimeout(timeoutTimer);
          resolve();
        }, STABILIZE_DELAY);
      };

      const observer = new MutationObserver(() => {
        const currentCount = document.querySelectorAll(SELECTORS.assistantMessage).length;
        if (currentCount > initialCount) {
          tryStabilize();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
  }

  extractLastResponse(): string {
    const messages = document.querySelectorAll(SELECTORS.assistantMessage);
    if (messages.length === 0) {
      throw new Error('No assistant response found');
    }
    const lastMessage = messages[messages.length - 1];
    return lastMessage.textContent?.trim() ?? '';
  }

  isStreaming(): boolean {
    return SELECTORS.stopButton.some((s) => !!document.querySelector(s));
  }
}
