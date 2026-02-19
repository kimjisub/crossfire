import type { AIAdapter } from './types';
import { findElement } from '../utils';

const SELECTORS = {
  proseMirrorEditor: [
    'div.ProseMirror[contenteditable="true"]',
  ],
  sendButton: [
    'button[aria-label="Send Message"]',
    'button[aria-label="Send message"]',
    'button[aria-label="메시지 보내기"]',
  ],
  responseContainer: '.font-claude-response',
  streamingIndicator: '[data-is-streaming]',
} as const;

const DEFAULT_TIMEOUT = 120_000;

export class ClaudeAdapter implements AIAdapter {
  async injectPrompt(text: string): Promise<void> {
    const editor = await findElement(SELECTORS.proseMirrorEditor, 'Claude input field');
    editor.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    (editor as HTMLElement).focus();

    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    editor.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true }),
    );
  }

  async submit(): Promise<void> {
    const button = await findElement(SELECTORS.sendButton, 'Claude send button');
    (button as HTMLButtonElement).click();
  }

  async waitForResponse(timeout = DEFAULT_TIMEOUT): Promise<void> {
    return new Promise((resolve, reject) => {
      let streamingStarted = false;

      const timeoutTimer = setTimeout(() => {
        observer.disconnect();
        reject(new Error('Claude response timed out'));
      }, timeout);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(SELECTORS.streamingIndicator);
        if (!el) return;

        const isStreaming = el.getAttribute('data-is-streaming') === 'true';

        if (!streamingStarted && isStreaming) {
          streamingStarted = true;
          return;
        }

        if (streamingStarted && !isStreaming) {
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
    const elements = document.querySelectorAll(SELECTORS.responseContainer);
    if (elements.length === 0) {
      throw new Error('No assistant response found');
    }

    const lastElement = elements[elements.length - 1];

    // Claude response DOM: 2-row grid
    // row-start-1 = thinking (extended thinking content)
    // row-start-2 = actual response (standard-markdown)
    const contentRow = lastElement.querySelector('.row-start-2');
    if (contentRow) {
      return contentRow.textContent?.trim() ?? '';
    }

    return lastElement.textContent?.trim() ?? '';
  }

  isStreaming(): boolean {
    const el = document.querySelector(SELECTORS.streamingIndicator);
    return el?.getAttribute('data-is-streaming') === 'true';
  }
}
