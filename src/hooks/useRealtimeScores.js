import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSocket, SOCKET_URL } from '../services/socket';

const CLIENT_ID_STORAGE_KEY = 'sih-jury-client-id';

const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected'
};

export const useRealtimeScores = ({ juryId, onRemoteUpdate }) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [lastAck, setLastAck] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [serverVersion, setServerVersion] = useState(0);
  const [presence, setPresence] = useState([]);

  const skipNextPushRef = useRef(false);
  const socketRef = useRef(null);
  const pendingTimeoutRef = useRef(null);
  const pendingScoresRef = useRef(null);
  const latestScoresRef = useRef({});
  const clientIdRef = useRef(null);

  function ensureClientId() {
    if (clientIdRef.current) return clientIdRef.current;
    if (typeof window === 'undefined') {
      clientIdRef.current = `server-${Date.now()}`;
      return clientIdRef.current;
    }
    try {
      const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (existing) {
        clientIdRef.current = existing;
        return existing;
      }
      const generated = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `client-${Date.now()}`;
      window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
      clientIdRef.current = generated;
      return generated;
    } catch {
      clientIdRef.current = `client-${Date.now()}`;
      return clientIdRef.current;
    }
  }

  const clientId = ensureClientId();

  const fetchSnapshot = useCallback(async () => {
    if (!juryId) return;
    try {
      const response = await fetch(`${SOCKET_URL}/api/jury/${juryId}/state`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Snapshot fetch failed with status ${response.status}`);
      }
      const payload = await response.json();
      setLastSync(payload.lastUpdated || null);
      setServerVersion(Number(payload.version || 0));
      setPresence(payload.presence || []);
      if (payload.scores && onRemoteUpdate) {
        skipNextPushRef.current = true;
        latestScoresRef.current = payload.scores;
        onRemoteUpdate(payload.scores);
      }
    } catch (error) {
      console.warn('Failed to load jury snapshot:', error.message);
    }
  }, [juryId, onRemoteUpdate]);

  const sendUpdate = useCallback((scores, { force = false } = {}) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (!force && connectionState !== CONNECTION_STATES.CONNECTED) {
      pendingScoresRef.current = scores;
      return;
    }

    socket.emit('jury:update', {
      juryId,
      scores,
      source: 'client',
      version: serverVersion,
      clientId
    });
    pendingScoresRef.current = null;
  }, [clientId, connectionState, juryId, serverVersion]);

  const broadcastScores = useCallback((scores, options = {}) => {
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    latestScoresRef.current = scores;
    pendingScoresRef.current = scores;

    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
    }

    pendingTimeoutRef.current = setTimeout(() => {
      sendUpdate(pendingScoresRef.current, options);
      pendingTimeoutRef.current = null;
    }, 350);
  }, [sendUpdate]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnectionState(CONNECTION_STATES.CONNECTED);
      socket.emit('jury:join', { juryId, clientId, deviceLabel: navigator?.userAgent ?? 'Unknown device' });
      socket.emit('jury:sync-request');
      if (pendingScoresRef.current) {
        broadcastScores(pendingScoresRef.current, { force: true });
      }
    };

    const handleDisconnect = () => setConnectionState(CONNECTION_STATES.DISCONNECTED);
    const handleReconnectAttempt = () => setConnectionState(CONNECTION_STATES.CONNECTING);

    const handleState = (payload) => {
      if (payload?.lastUpdated) setLastSync(payload.lastUpdated);
      if (typeof payload?.version === 'number') setServerVersion(payload.version);
      if (payload?.presence) setPresence(payload.presence);
      if (payload?.scores && onRemoteUpdate) {
        skipNextPushRef.current = true;
        latestScoresRef.current = payload.scores;
        onRemoteUpdate(payload.scores);
      }
    };

    const handlePeerUpdate = (payload) => {
      if (payload?.scores && onRemoteUpdate) {
        skipNextPushRef.current = true;
        latestScoresRef.current = {
          ...latestScoresRef.current,
          ...payload.scores
        };
        onRemoteUpdate(payload.scores);
      }
    };

    const handleAck = (payload) => {
      if (payload?.lastUpdated) setLastAck(payload.lastUpdated);
      if (typeof payload?.version === 'number') setServerVersion(payload.version);
    };

    const handlePresence = (payload) => {
      if (payload?.connections) setPresence(payload.connections);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('jury:status', handleState);
    socket.on('jury:state', handleState);
    socket.on('jury:update', handlePeerUpdate);
    socket.on('jury:ack', handleAck);
    socket.on('jury:presence', handlePresence);

    setConnectionState(CONNECTION_STATES.CONNECTING);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('jury:status', handleState);
      socket.off('jury:state', handleState);
      socket.off('jury:update', handlePeerUpdate);
      socket.off('jury:ack', handleAck);
      socket.off('jury:presence', handlePresence);
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    };
  }, [juryId, onRemoteUpdate, clientId, broadcastScores]);

  return useMemo(() => ({
    connectionState,
    lastAck,
    lastSync,
    serverVersion,
    presence,
    clientId,
    broadcastScores
  }), [connectionState, lastAck, lastSync, serverVersion, presence, clientId, broadcastScores]);
};

export const CONNECTION_STATUS = CONNECTION_STATES;