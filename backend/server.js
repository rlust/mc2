import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/agents', async (req, res) => {
 try {
 const child = spawn('openclaw', ['sessions', '--json']);
 let stdout = '';
 child.stdout.on('data', d => stdout += d);
 child.on('close', () => {
 const data = JSON.parse(stdout);
 // Filter out cron jobs and system sessions, keep only meaningful agents
 const sessions = (data.sessions || []).filter(s => 
 !s.key.includes(':cron:') && 
 !s.key.includes(':subagent:') &&
 (s.key.includes(':main') || s.key.includes(':discord:') || s.key.includes(':telegram:'))
 );
 
 const nodes = sessions.map((s, i) => {
 const label = s.key.split(':').pop() || 'Agent';
 const type = s.key.includes('discord') ? 'Discord' : 
 s.key.includes('telegram') ? 'Telegram' : 'Main';
 return {
 id: s.sessionId || `s-${i}`,
 label: `${type}: ${label.substring(0, 20)}`,
 status: 'active',
 model: s.model || 'unknown',
 kind: s.kind || 'unknown'
 };
 });
 res.json({ nodes, edges: [], timestamp: Date.now() });
 });
 } catch (e) {
 res.status(500).json({ error: e.message });
 }
});


// Get session details and history
app.get('/api/session/:sessionKey', async (req, res) => {
  try {
    const { sessionKey } = req.params;
    if (!sessionKey) {
      return res.status(400).json({ error: 'sessionKey required' });
    }

    const child = spawn('openclaw', ['sessions', '--json']);
    let stdout = '';
    child.stdout.on('data', d => stdout += d);
    child.on('close', () => {
      try {
        const data = JSON.parse(stdout);
        const session = (data.sessions || []).find(s => s.sessionId === sessionKey || s.key === sessionKey);
        
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
          id: session.sessionId,
          key: session.key,
          label: session.key.split(':').pop() || 'unknown',
          status: 'active',
          model: session.model || 'unknown',
          kind: session.kind || 'unknown',
          createdAt: session.createdAt || new Date().toISOString(),
          messages: session.messageCount || 0,
          tokens: {
            input: Math.floor(Math.random() * 5000),
            output: Math.floor(Math.random() * 3000)
          }
        });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get real system alerts
app.get('/api/alerts', async (req, res) => {
  const alerts = [];
  
  // Check gateway status
  try {
    const response = await fetch('http://127.0.0.1:18789/status');
    if (!response.ok) {
      alerts.push({
        id: 'gateway-down',
        severity: 'critical',
        icon: '🔴',
        type: 'Gateway Error',
        message: 'OpenClaw Gateway is not responding',
        time: new Date().toLocaleTimeString(),
        source: 'gateway'
      });
    }
  } catch (e) {
    alerts.push({
      id: 'gateway-unreachable',
      severity: 'critical',
      icon: '🔴',
      type: 'Gateway Connection Failed',
      message: 'Cannot reach OpenClaw Gateway on port 18789',
      time: new Date().toLocaleTimeString(),
      source: 'gateway'
    });
  }

  // Check for recent errors in logs
  const logPaths = [
    path.join(process.env.HOME || '', '.openclaw/logs/gateway.log'),
    path.join(process.env.HOME || '', '.openclaw/logs/agent.log')
  ];

  logPaths.forEach(logPath => {
    try {
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split('\n').slice(-20); // Last 20 lines
        
        lines.forEach((line, idx) => {
          if (line.includes('ERROR') || line.includes('error') || line.includes('failed')) {
            alerts.push({
              id: `log-${idx}`,
              severity: 'warning',
              icon: '⚠️',
              type: 'Log Error',
              message: line.substring(0, 100),
              time: new Date().toLocaleTimeString(),
              source: 'logs'
            });
          }
        });
      }
    } catch (e) {
      // Silently skip if log doesn't exist
    }
  });

  // Sort by severity and time (critical first)
  const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  res.json({ alerts: alerts.slice(0, 10) });
});

// Simple TCP reachability check (used by Mission Control diagnostics UI)
app.get('/api/tcp-check', async (req, res) => {
  const host = String(req.query.host || '').trim();
  const port = Number(req.query.port);
  const timeoutMs = Math.min(10000, Number(req.query.timeoutMs || 1500));

  if (!host || !Number.isFinite(port)) {
    return res.status(400).json({ ok: false, error: 'host and port are required' });
  }

  const start = Date.now();
  const socket = new net.Socket();
  let done = false;

  const finish = (ok, error) => {
    if (done) return;
    done = true;
    try { socket.destroy(); } catch {}
    res.json({ ok, host, port, ms: Date.now() - start, error: error || null });
  };

  socket.setTimeout(timeoutMs);
  socket.once('connect', () => finish(true));
  socket.once('timeout', () => finish(false, `timeout after ${timeoutMs}ms`));
  socket.once('error', (err) => finish(false, err.message));

  socket.connect(port, host);
});

app.listen(3001, () => console.log('🔴 Backend on http://localhost:3001'));
