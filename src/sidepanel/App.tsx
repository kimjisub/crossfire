import { useEffect, useState } from 'react';
import { DebatePage } from './pages/DebatePage';
import { SettingsPage } from './pages/SettingsPage';
import { useDebateStore } from './store/useDebateStore';
import { useConfigStore } from './store/useConfigStore';
import type { Message } from '../shared/messages';

type Page = 'debate' | 'settings';

export function App() {
  const [page, setPage] = useState<Page>('debate');

  const {
    addResponse,
    updateStreamingResponse,
    setModelStatus,
    setError,
    setConnectionStatus,
    completeTurn,
    checkConnections,
  } = useDebateStore();

  const { loadConfig } = useConfigStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const listener = (message: Message) => {
      switch (message.type) {
        case 'STREAMING_UPDATE':
          updateStreamingResponse(message.payload.modelId, message.payload.response);
          break;
        case 'MODEL_STATUS':
          setModelStatus(message.payload.modelId, message.payload.status);
          break;
        case 'RESPONSE_READY':
          addResponse(message.payload.modelId, message.payload.response);
          break;
        case 'QUERY_COMPLETE':
          completeTurn();
          break;
        case 'ERROR':
          setError(`[${message.payload.modelId}] ${message.payload.error}`);
          break;
        case 'CONNECTION_STATUS':
          setConnectionStatus(
            message.payload.modelId,
            message.payload.connected ? 'connected' : 'disconnected',
          );
          break;
        case 'RESET_ALL_COMPLETE':
          checkConnections();
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [addResponse, updateStreamingResponse, setModelStatus, setError, setConnectionStatus, completeTurn, checkConnections]);

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('debate')} />;
  }

  return <DebatePage onOpenSettings={() => setPage('settings')} />;
}
