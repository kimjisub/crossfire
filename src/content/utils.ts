export function waitForElement(
  selector: string,
  timeout = 10000,
  description?: string,
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      const label = description ?? selector;
      reject(new Error(`${label}을(를) 찾을 수 없습니다 (${Math.round(timeout / 1000)}s timeout)`));
    }, timeout);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export async function findElement(
  selectors: readonly string[],
  description: string,
  timeout = 3000,
): Promise<Element> {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }

  for (const selector of selectors) {
    try {
      return await waitForElement(selector, timeout);
    } catch {
      // try next selector
    }
  }

  throw new Error(`${description}을(를) 찾을 수 없습니다`);
}
