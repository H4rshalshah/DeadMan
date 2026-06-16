'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket, subscribeToDashboard, subscribeToIncident, unsubscribeFromIncident } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import type { Incident, StepUpdate } from '@/lib/types';

// Debounce helper to prevent rapid refetch loops
type AnyFn = (...args: any[]) => void;
function debounce<T extends AnyFn>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  return debounced as unknown as T;
}

type EventHandler<T = unknown> = (data: T) => void;

interface UseWebSocketOptions {
  onIncidentNew?: EventHandler<Incident>;
  onIncidentUpdated?: EventHandler<Incident>;
  onStepUpdate?: EventHandler<StepUpdate>;
  onMonitorStatus?: EventHandler<{ id: string; status: string }>;
  incidentId?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket: Socket = getSocket();

    // Debounce all handlers to prevent rapid-fire refetch loops
    const handleIncidentNew = debounce((data: Incident) => {
      optionsRef.current.onIncidentNew?.(data);
    }, 300);

    const handleIncidentUpdated = debounce((data: Incident) => {
      optionsRef.current.onIncidentUpdated?.(data);
    }, 300);

    const handleStepUpdate = debounce((data: StepUpdate) => {
      optionsRef.current.onStepUpdate?.(data);
    }, 300);

    const handleMonitorStatus = debounce((data: { id: string; status: string }) => {
      optionsRef.current.onMonitorStatus?.(data);
    }, 300);

    socket.on('incident:new', handleIncidentNew);
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('step:update', handleStepUpdate);
    socket.on('monitor:status', handleMonitorStatus);

    // Join appropriate rooms
    subscribeToDashboard();
    if (options.incidentId) {
      subscribeToIncident(options.incidentId);
    }

    return () => {
      socket.off('incident:new', handleIncidentNew);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('step:update', handleStepUpdate);
      socket.off('monitor:status', handleMonitorStatus);

      if (options.incidentId) {
        unsubscribeFromIncident(options.incidentId);
      }
    };
  }, [options.incidentId]);
}
