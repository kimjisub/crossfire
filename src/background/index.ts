import type { Message, ModelResponse } from '../shared/messages';
import { PROVIDER_CONFIGS } from '../shared/types';
import { getModelConfig } from './config';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const activeTabMap = new Map<string, number>();

chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [modelId, id] of activeTabMap) {
    if (id === tabId) {
      activeTabMap.delete(modelId);
      break;
    }
  }
});

function getAssignedTabIds(): Set<number> {
  return new Set(activeTabMap.values());
}

async function findOrCreateTab(modelId: string): Promise<chrome.tabs.Tab> {
  const modelConfig = await getModelConfig(modelId);
  if (!modelConfig) throw new Error(`Model config not found: ${modelId}`);

  const provider = PROVIDER_CONFIGS[modelConfig.provider];

  const cachedTabId = activeTabMap.get(modelId);
  if (cachedTabId != null) {
    try {
      const tab = await chrome.tabs.get(cachedTabId);
      if (tab) return tab;
    } catch {
      activeTabMap.delete(modelId);
    }
  }

  const assignedTabIds = getAssignedTabIds();
  const existingTabs = await chrome.tabs.query({ url: provider.urlPattern });
  const unassignedTab = existingTabs.find(
    (t) => t.id != null && !assignedTabIds.has(t.id),
  );

  if (unassignedTab && unassignedTab.id != null) {
    activeTabMap.set(modelId, unassignedTab.id);
    return unassignedTab;
  }

  const newTab = await chrome.tabs.create({ url: provider.url, active: false });
  if (newTab.id != null) {
    activeTabMap.set(modelId, newTab.id);
  }
  return newTab;
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timed out (30s)'));
    }, 30_000);

    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
    ) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function checkConnection(modelId: string): Promise<boolean> {
  try {
    const cachedTabId = activeTabMap.get(modelId);
    if (cachedTabId == null) return false;

    let tab: chrome.tabs.Tab;
    try {
      tab = await chrome.tabs.get(cachedTabId);
    } catch {
      activeTabMap.delete(modelId);
      return false;
    }

    if (tab.status !== 'complete') return false;
    const response = await chrome.tabs.sendMessage(tab.id!, { type: 'PING' });
    return response?.pong === true;
  } catch {
    return false;
  }
}

async function handleOpenTab(modelId: string): Promise<void> {
  try {
    const modelConfig = await getModelConfig(modelId);
    if (!modelConfig) {
      chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', payload: { modelId, connected: false } } as Message);
      return;
    }

    const provider = PROVIDER_CONFIGS[modelConfig.provider];
    const newTab = await chrome.tabs.create({ url: provider.url, active: false });
    const tabId = newTab.id;
    if (tabId == null) {
      chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', payload: { modelId, connected: false } } as Message);
      return;
    }

    activeTabMap.set(modelId, tabId);
    await waitForTabLoad(tabId);
    await new Promise((r) => setTimeout(r, 500));

    const contextMsg: Message = {
      type: 'SET_MODEL_CONTEXT',
      payload: { modelId, modelName: modelConfig.name },
    };
    await chrome.tabs.sendMessage(tabId, contextMsg);

    const connected = await checkConnection(modelId);
    chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', payload: { modelId, connected } } as Message);
  } catch {
    chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', payload: { modelId, connected: false } } as Message);
  }
}

async function handleCheckConnection(modelIds: string[]): Promise<void> {
  const checks = modelIds.map(async (modelId) => {
    const connected = await checkConnection(modelId);
    const statusMsg: Message = {
      type: 'CONNECTION_STATUS',
      payload: { modelId, connected },
    };
    chrome.runtime.sendMessage(statusMsg);
  });
  await Promise.all(checks);
}

async function handleResetAll(modelIds: string[]): Promise<void> {
  // Close all assigned tabs
  const closePromises: Promise<void>[] = [];
  for (const [, tabId] of activeTabMap) {
    closePromises.push(chrome.tabs.remove(tabId).catch(() => {}));
  }
  await Promise.all(closePromises);
  activeTabMap.clear();

  // Open new tabs for selected models
  for (const modelId of modelIds) {
    try {
      const modelConfig = await getModelConfig(modelId);
      if (!modelConfig) continue;

      const provider = PROVIDER_CONFIGS[modelConfig.provider];
      const newTab = await chrome.tabs.create({ url: provider.url, active: false });
      const tabId = newTab.id;
      if (tabId == null) continue;

      activeTabMap.set(modelId, tabId);
      await waitForTabLoad(tabId);
      await new Promise((r) => setTimeout(r, 500));

      const contextMsg: Message = {
        type: 'SET_MODEL_CONTEXT',
        payload: { modelId, modelName: modelConfig.name },
      };
      await chrome.tabs.sendMessage(tabId, contextMsg);
    } catch {
      // Continue on individual model failure
    }
  }

  chrome.runtime.sendMessage({ type: 'RESET_ALL_COMPLETE' } as Message);
}

let currentRoundId = 0;
let pendingModels = new Set<string>();
let collectedResults: ModelResponse[] = [];

function removePendingModel(modelId: string): void {
  pendingModels.delete(modelId);
  if (pendingModels.size === 0) {
    const queryComplete: Message = {
      type: 'QUERY_COMPLETE',
      payload: { results: collectedResults },
    };
    chrome.runtime.sendMessage(queryComplete);
  }
}

async function injectToModel(modelId: string, prompt: string): Promise<void> {
  const modelConfig = await getModelConfig(modelId);
  if (!modelConfig) throw new Error(`Model config not found: ${modelId}`);

  const tab = await findOrCreateTab(modelId);
  const tabId = tab.id;
  if (tabId == null) throw new Error(`Failed to get tab ID for ${modelId}`);

  if (tab.status !== 'complete') {
    await waitForTabLoad(tabId);
  }

  await new Promise((r) => setTimeout(r, 1000));

  const contextMessage: Message = {
    type: 'SET_MODEL_CONTEXT',
    payload: { modelId, modelName: modelConfig.name },
  };
  await chrome.tabs.sendMessage(tabId, contextMessage);

  const injectMessage: Message = {
    type: 'INJECT_PROMPT',
    payload: { prompt, modelId, roundId: currentRoundId },
  };
  await chrome.tabs.sendMessage(tabId, injectMessage);
}

function handleModelError(modelId: string, err: unknown): void {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  const errorMsg: Message = {
    type: 'ERROR',
    payload: { modelId, error: errorMessage },
  };
  chrome.runtime.sendMessage(errorMsg);
  removePendingModel(modelId);
}

async function handleStartQuery(
  question: string,
  modelIds: string[],
): Promise<void> {
  currentRoundId++;
  pendingModels = new Set(modelIds);
  collectedResults = [];

  const promises = modelIds.map(async (modelId) => {
    try {
      await injectToModel(modelId, question);
    } catch (err) {
      handleModelError(modelId, err);
    }
  });

  await Promise.all(promises);
}

async function handleStartDebateRound(
  prompts: Record<string, string>,
  modelIds: string[],
): Promise<void> {
  currentRoundId++;
  pendingModels = new Set(modelIds);
  collectedResults = [];

  const promises = modelIds.map(async (modelId) => {
    try {
      const prompt = prompts[modelId];
      if (!prompt) throw new Error(`No prompt for model ${modelId}`);
      await injectToModel(modelId, prompt);
    } catch (err) {
      handleModelError(modelId, err);
    }
  });

  await Promise.all(promises);
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, _sendResponse) => {
    switch (message.type) {
      case 'START_QUERY':
        handleStartQuery(message.payload.question, message.payload.modelIds);
        break;

      case 'START_DEBATE_ROUND':
        handleStartDebateRound(message.payload.prompts, message.payload.modelIds);
        break;

      case 'OPEN_TAB':
        handleOpenTab(message.payload.modelId);
        break;

      case 'CHECK_CONNECTION':
        handleCheckConnection(message.payload.modelIds);
        break;

      case 'RESET_ALL':
        handleResetAll(message.payload.modelIds);
        break;

      case 'RESPONSE_READY':
        if (message.payload.roundId != null && message.payload.roundId !== currentRoundId) break;
        collectedResults.push({
          modelId: message.payload.modelId,
          response: message.payload.response,
        });
        chrome.runtime.sendMessage(message);
        removePendingModel(message.payload.modelId);
        break;

      case 'STREAMING_UPDATE':
      case 'MODEL_STATUS':
        if (message.payload.roundId != null && message.payload.roundId !== currentRoundId) break;
        chrome.runtime.sendMessage(message);
        break;

      case 'ERROR':
        if (message.payload.roundId != null && message.payload.roundId !== currentRoundId) break;
        chrome.runtime.sendMessage(message);
        removePendingModel(message.payload.modelId);
        break;

      default:
        break;
    }
  },
);
