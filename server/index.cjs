const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT || 50);
const STATE_DIR = process.env.STATE_PERSIST_DIR || path.join(__dirname, '..', 'state');
const ENABLE_PERSIST = process.env.STATE_PERSIST !== 'false';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

const jurySessions = new Map();

const loadPersistedSessions = () => {
  if (!ENABLE_PERSIST) return;
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(STATE_DIR).filter((file) => file.endsWith('.json'));
  files.forEach((file) => {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(STATE_DIR, file), 'utf-8'));
      const juryId = String(content.juryId || file.replace(/\.json$/, ''));
      jurySessions.set(juryId, {
        scores: content.scores || {},
        history: Array.isArray(content.history) ? content.history : [],
        lastUpdated: content.lastUpdated || null,
        version: Number(content.version || 0),
        presence: new Map()
      });
    } catch (error) {
      console.warn(`Failed to load state for ${file}:`, error.message);
    }
  });
};

const persistSession = (juryId, session) => {
  if (!ENABLE_PERSIST) return;
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    const payload = {
      juryId,
      scores: session.scores,
      history: session.history,
      lastUpdated: session.lastUpdated,
      version: session.version
    };
    fs.writeFileSync(path.join(STATE_DIR, `${juryId}.json`), JSON.stringify(payload, null, 2));
  } catch (error) {
    console.warn(`Failed to persist session ${juryId}:`, error.message);
  }
};

const getSession = (juryId) => {
  if (!jurySessions.has(juryId)) {
    jurySessions.set(juryId, {
      scores: {},
      history: [],
      lastUpdated: null,
      version: 0,
      presence: new Map()
    });
  }
  return jurySessions.get(juryId);
};

const sanitizeScores = (scores) => {
  if (!scores || typeof scores !== 'object') return {};
  return Object.entries(scores).reduce((acc, [teamId, teamScores]) => {
    if (teamScores && typeof teamScores === 'object') {
      acc[teamId] = Object.entries(teamScores).reduce((innerAcc, [criteria, value]) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          innerAcc[criteria] = value;
        }
        return innerAcc;
      }, {});
    }
    return acc;
  }, {});
};

const appendHistory = (session, entry) => {
  session.history.unshift(entry);
  if (session.history.length > HISTORY_LIMIT) {
    session.history.length = HISTORY_LIMIT;
  }
};

const sessionPayload = (juryId, session) => ({
  juryId,
  scores: session.scores,
  lastUpdated: session.lastUpdated,
  version: session.version,
  history: session.history,
  presence: Array.from(session.presence.values())
});

loadPersistedSessions();

io.on('connection', (socket) => {
  let joinedJuryId = null;
  let joinedClientMeta = null;

  const emitSession = () => {
    if (!joinedJuryId) return;
    const session = getSession(joinedJuryId);
    socket.emit('jury:state', sessionPayload(joinedJuryId, session));
  };

  const broadcastPresence = (juryId) => {
    const session = getSession(juryId);
    io.to(juryId).emit('jury:presence', {
      juryId,
      connections: Array.from(session.presence.values())
    });
  };

  socket.on('jury:join', ({ juryId, clientId, deviceLabel }) => {
    if (!juryId) return;
    joinedJuryId = String(juryId);
    socket.join(joinedJuryId);
    const session = getSession(joinedJuryId);
    joinedClientMeta = {
      socketId: socket.id,
      clientId: clientId || `anon-${socket.id}`,
      deviceLabel: deviceLabel || 'Unknown device',
      joinedAt: new Date().toISOString()
    };
    session.presence.set(socket.id, joinedClientMeta);
    emitSession();
    socket.emit('jury:status', { state: 'joined', juryId: joinedJuryId });
    broadcastPresence(joinedJuryId);
  });

  socket.on('jury:sync-request', () => {
    emitSession();
  });

  socket.on('jury:update', (payload) => {
    if (!joinedJuryId || !payload) return;

    const { scores, source = 'client', version } = payload;
    const sanitizedScores = sanitizeScores(scores);
    const session = getSession(joinedJuryId);

    const mergedScores = { ...session.scores };
    Object.entries(sanitizedScores).forEach(([teamId, teamScores]) => {
      mergedScores[teamId] = {
        ...(mergedScores[teamId] || {}),
        ...teamScores
      };
    });
    session.scores = mergedScores;

    session.version = Number(session.version || 0) + 1;

    const updateRecord = {
      at: new Date().toISOString(),
      source,
      version: session.version,
      delta: sanitizedScores
    };

    appendHistory(session, updateRecord);
    session.lastUpdated = updateRecord.at;

    socket.to(joinedJuryId).emit('jury:update', {
      juryId: joinedJuryId,
      scores: sanitizedScores,
      lastUpdated: session.lastUpdated,
      source: 'peer',
      version: session.version
    });

    socket.emit('jury:ack', {
      juryId: joinedJuryId,
      lastUpdated: session.lastUpdated,
      version: session.version
    });

    persistSession(joinedJuryId, session);
  });

  socket.on('disconnect', () => {
    if (joinedJuryId) {
      const session = getSession(joinedJuryId);
      session.presence.delete(socket.id);
      socket.leave(joinedJuryId);
      broadcastPresence(joinedJuryId);
      joinedJuryId = null;
      joinedClientMeta = null;
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: jurySessions.size });
});

app.get('/api/jury/:juryId/state', (req, res) => {
  const juryId = String(req.params.juryId);
  const session = getSession(juryId);
  res.json(sessionPayload(juryId, session));
});

server.listen(PORT, () => {
  console.log(`Realtime server listening on http://localhost:${PORT}`);
});
