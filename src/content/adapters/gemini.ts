import type { AIAdapter } from './types';
import { findElement } from '../utils';

const SELECTORS = {
  promptEditor: [
    'div.ql-editor[contenteditable="true"]',
    'rich-textarea div[contenteditable="true"]',
    'div[contenteditable="true"]',
  ],
  sendButton: [
    'button.send-button',
    'button[aria-label="Send message"]',
    'button[aria-label="메시지 보내기"]',
  ],
  responseContent: '.markdown.markdown-main-panel',
  streamingIndicator: '.markdown.markdown-main-panel[aria-busy="true"]',
} as const;

const DEFAULT_TIMEOUT = 120_000;

export class GeminiAdapter implements AIAdapter {
  async injectPrompt(text: string): Promise<void> {
    const editor = await findElement(SELECTORS.promptEditor, 'Gemini input field');
    (editor as HTMLElement).focus();
    document.execCommand('insertText', false, text);
  }

  async submit(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    const button = await findElement(SELECTORS.sendButton, 'Gemini send button');
    (button as HTMLButtonElement).click();
  }

  async waitForResponse(timeout = DEFAULT_TIMEOUT): Promise<void> {
    return new Promise((resolve, reject) => {
      let streamingStarted = false;

      const timeoutTimer = setTimeout(() => {
        observer.disconnect();
        reject(new Error('Gemini response timed out'));
      }, timeout);

      const observer = new MutationObserver(() => {
        const busyEl = document.querySelector(SELECTORS.streamingIndicator);

        if (!streamingStarted && busyEl) {
          streamingStarted = true;
          return;
        }

        if (streamingStarted && !busyEl) {
          observer.disconnect();
          clearTimeout(timeoutTimer);
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    });
  }

  extractLastResponse(): string {
    const elements = document.querySelectorAll(SELECTORS.responseContent);
    if (elements.length > 0) {
      const lastElement = elements[elements.length - 1];
      return lastElement.textContent?.trim() ?? '';
    }
    throw new Error('No model response found');
  }

  isStreaming(): boolean {
    return !!document.querySelector(SELECTORS.streamingIndicator);
  }
}
