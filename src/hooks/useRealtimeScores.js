import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSocket } from '../services/socket';

const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected'
};

export const useRealtimeScores = ({ juryId, onRemoteUpdate }) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [lastAck, setLastAck] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const skipNextPushRef = useRef(false);
  const socketRef = useRef();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnectionState(CONNECTION_STATES.CONNECTED);
      socket.emit('jury:join', { juryId });
      socket.emit('jury:sync-request');
    };

    const handleDisconnect = () => {
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
    };

    const handleReconnectAttempt = () => {
      setConnectionState(CONNECTION_STATES.CONNECTING);
    };

    const handleState = (payload) => {
      if (payload?.lastUpdated) {
        setLastSync(payload.lastUpdated);
      }
      if (payload?.scores && onRemoteUpdate) {
        skipNextPushRef.current = true;
        onRemoteUpdate(payload.scores);
      }
    };

    const handlePeerUpdate = (payload) => {
      if (payload?.scores && onRemoteUpdate) {
        skipNextPushRef.current = true;
        onRemoteUpdate(payload.scores);
      }
    };

    const handleAck = (payload) => {
      if (payload?.lastUpdated) {
        setLastAck(payload.lastUpdated);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('jury:status', handleState);
    socket.on('jury:state', handleState);
    socket.on('jury:update', handlePeerUpdate);
    socket.on('jury:ack', handleAck);

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
    };
  }, [juryId, onRemoteUpdate]);

  const broadcastScores = useCallback((scores) => {
    const socket = socketRef.current;
    if (!socket || connectionState !== CONNECTION_STATES.CONNECTED) {
      return;
    }

    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    socket.emit('jury:update', {
      juryId,
      scores,
      source: 'client',
      version: Date.now()
    });
  }, [connectionState, juryId]);

  return useMemo(() => ({
    connectionState,
    lastAck,
    lastSync,
    broadcastScores
  }), [connectionState, lastAck, lastSync, broadcastScores]);
};

export const CONNECTION_STATUS = CONNECTION_STATES;
