const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT || 50);

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

const getSession = (juryId) => {
  if (!jurySessions.has(juryId)) {
    jurySessions.set(juryId, {
      scores: {},
      history: [],
      lastUpdated: null
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

io.on('connection', (socket) => {
  let joinedJuryId = null;

  const emitSession = () => {
    if (!joinedJuryId) return;
    const session = getSession(joinedJuryId);
    socket.emit('jury:state', {
      juryId: joinedJuryId,
      scores: session.scores,
      lastUpdated: session.lastUpdated,
      history: session.history
    });
  };

  socket.on('jury:join', ({ juryId }) => {
    if (!juryId) return;
    joinedJuryId = String(juryId);
    socket.join(joinedJuryId);
    emitSession();
    socket.emit('jury:status', { state: 'joined', juryId: joinedJuryId });
  });

  socket.on('jury:sync-request', () => {
    emitSession();
  });

  socket.on('jury:update', (payload) => {
    if (!joinedJuryId || !payload) return;

    const { scores, source = 'client', version } = payload;
    const sanitizedScores = sanitizeScores(scores);
    const session = getSession(joinedJuryId);

    session.scores = {
      ...session.scores,
      ...sanitizedScores
    };

    const updateRecord = {
      at: new Date().toISOString(),
      source,
      version: version ?? null,
      delta: sanitizedScores
    };

    appendHistory(session, updateRecord);
    session.lastUpdated = updateRecord.at;

    socket.to(joinedJuryId).emit('jury:update', {
      juryId: joinedJuryId,
      scores: sanitizedScores,
      lastUpdated: session.lastUpdated,
      source: 'peer'
    });

    socket.emit('jury:ack', {
      juryId: joinedJuryId,
      lastUpdated: session.lastUpdated
    });
  });

  socket.on('disconnect', () => {
    if (joinedJuryId) {
      socket.leave(joinedJuryId);
      joinedJuryId = null;
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: jurySessions.size });
});

server.listen(PORT, () => {
  console.log(`Realtime server listening on http://localhost:${PORT}`);
});
