export interface AIAdapter {
  injectPrompt(text: string): Promise<void>;
  submit(): Promise<void>;
  waitForResponse(timeout?: number): Promise<void>;
  extractLastResponse(): string;
  isStreaming(): boolean;
}
