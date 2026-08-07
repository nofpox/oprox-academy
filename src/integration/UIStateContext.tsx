// OPROX Phase 11 — Global UI State Management Context

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppMode } from '../types';
import {
  LoadingContract,
  ErrorContract,
  UINotification,
  SystemEvent,
  OproxEventName,
  EventListenerCallback,
  OPROX_EVENTS
} from './types';

interface UIStateContextType {
  // Navigation & Mode
  currentMode: AppMode;
  setCurrentMode: (mode: AppMode) => void;
  activePlatformSubpage: string;
  setActivePlatformSubpage: (subpageId: string) => void;
  activeProjectTitle: string;
  setActiveProjectTitle: (title: string) => void;
  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
  launchIdeWithPrompt: (prompt: string, projectTitle?: string) => void;

  // Environment & Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  serverOnline: boolean;

  // Contracts & Notifications State
  notifications: UINotification[];
  addNotification: (notification: Omit<UINotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  loadingState: LoadingContract | null;
  setLoadingState: (state: LoadingContract | null) => void;
  errorState: ErrorContract | null;
  setErrorState: (error: ErrorContract | null) => void;
  clearError: () => void;

  // System Event Bus
  dispatchSystemEvent: <T = any>(eventName: OproxEventName, payload: T, sourceComponent?: string) => void;
  subscribeSystemEvent: <T = any>(eventName: OproxEventName, callback: EventListenerCallback<T>) => () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentModeState] = useState<AppMode>('dashboard');
  const [activePlatformSubpage, setActivePlatformSubpage] = useState<string>('overview-dashboard');
  const [activeProjectTitle, setActiveProjectTitle] = useState<string>('OPROX Enterprise Core');
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  // Contracts State
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingContract | null>(null);
  const [errorState, setErrorState] = useState<ErrorContract | null>(null);

  // Event Listeners Registry
  const [eventListeners] = useState<Map<OproxEventName, Set<EventListenerCallback>>>(new Map());

  // Health check on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'online') setServerOnline(true);
      })
      .catch(() => setServerOnline(false));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<UINotification, 'id' | 'timestamp'>) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newNotif: UINotification = {
        ...notification,
        id,
        timestamp: new Date().toLocaleTimeString()
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);

      if (notification.autoDismissMs !== 0) {
        const timeout = notification.autoDismissMs || 4000;
        setTimeout(() => {
          dismissNotification(id);
        }, timeout);
      }
    },
    [dismissNotification]
  );

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  // System Event Bus Dispatch
  const dispatchSystemEvent = useCallback(
    <T = any,>(eventName: OproxEventName, payload: T, sourceComponent: string = 'UIStateProvider') => {
      const event: SystemEvent<T> = {
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventName,
        domain: eventName.split(':')[1] || 'system',
        payload,
        timestamp: new Date().toISOString(),
        userId: 'usr_admin_oprox',
        sourceComponent
      };

      const listeners = eventListeners.get(eventName);
      if (listeners) {
        listeners.forEach((cb) => cb(event));
      }
    },
    [eventListeners]
  );

  // Subscribe to system events
  const subscribeSystemEvent = useCallback(
    <T = any,>(eventName: OproxEventName, callback: EventListenerCallback<T>) => {
      if (!eventListeners.has(eventName)) {
        eventListeners.set(eventName, new Set());
      }
      const set = eventListeners.get(eventName)!;
      set.add(callback as EventListenerCallback);

      return () => {
        set.delete(callback as EventListenerCallback);
      };
    },
    [eventListeners]
  );

  // Enhanced mode change dispatcher
  const setCurrentMode = useCallback(
    (mode: AppMode) => {
      setCurrentModeState(mode);
      dispatchSystemEvent(OPROX_EVENTS.MODE_SWITCH, { previousMode: currentMode, nextMode: mode });
    },
    [currentMode, dispatchSystemEvent]
  );

  const launchIdeWithPrompt = useCallback(
    (prompt: string, projectTitle?: string) => {
      setActivePrompt(prompt);
      if (projectTitle) setActiveProjectTitle(projectTitle);
      setCurrentMode('ide');
      addNotification({
        type: 'info',
        title: 'IDE Engine Launched',
        message: `Synthesizing workspace for prompt: "${prompt.substring(0, 40)}..."`
      });
    },
    [addNotification, setCurrentMode]
  );

  return (
    <UIStateContext.Provider
      value={{
        currentMode,
        setCurrentMode,
        activePlatformSubpage,
        setActivePlatformSubpage,
        activeProjectTitle,
        setActiveProjectTitle,
        activePrompt,
        setActivePrompt,
        launchIdeWithPrompt,
        theme,
        toggleTheme,
        serverOnline,
        notifications,
        addNotification,
        dismissNotification,
        loadingState,
        setLoadingState,
        errorState,
        setErrorState,
        clearError,
        dispatchSystemEvent,
        subscribeSystemEvent
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};
