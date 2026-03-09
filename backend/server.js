import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Token pricing (per 1M tokens)
const PRICING = {
  'claude-haiku-4-5': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
  'claude-opus-4-6': { input: 15.00, output: 75.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4.1-nano': { input: 0.15, output: 0.60 },
  'gpt-5.2': { input: 3.00, output: 12.00 },
  'gpt-5.3-codex': { input: 4.00, output: 16.00 },
  'default': { input: 0.50, output: 2.00 }
};

// Cost tracking (in-memory, can be persisted to file)
let costHistory = [];
const COST_HISTORY_FILE = path.join(process.env.HOME || '', '.openclaw/.cost-history.json');

// Load cost history on startup
function loadCostHistory() {
  try {
    if (fs.existsSync(COST_HISTORY_FILE)) {
      const data = fs.readFileSync(COST_HISTORY_FILE, 'utf-8');
      costHistory = JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not load cost history:', e.message);
    costHistory = [];
  }
}

// Save cost history to file
function saveCostHistory() {
  try {
    fs.writeFileSync(COST_HISTORY_FILE, JSON.stringify(costHistory, null, 2));
  } catch (e) {
    console.warn('Could not save cost history:', e.message);
  }
}

function getModelPricing(model) {
  return PRICING[model] || PRICING['default'];
}

function calculateCost(model, inputTokens, outputTokens) {
  const pricing = getModelPricing(model);
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputTokens,
    outputTokens
  };
}

// Initialize
loadCostHistory();

// Performance metrics storage
let performanceHistory = [];
const MAX_METRICS = 288; // 24 hours * 12 samples/hour

// Collect system metrics
setInterval(async () => {
  try {
    const { execSync } = await import('child_process');
    
    // CPU usage (simple approach - sample current load)
    const cpuAvg = os.loadavg()[0];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPercent = ((totalMem - freeMem) / totalMem) * 100;
    
    // Disk usage (rough estimate)
    const diskPercent = 78; // Placeholder - would need actual disk check
    
    performanceHistory.push({
      timestamp: new Date().toISOString(),
      cpu: Math.min(100, cpuAvg * 25), // Normalize load avg to percentage
      memory: memPercent,
      disk: diskPercent
    });
    
    if (performanceHistory.length > MAX_METRICS) {
      performanceHistory.shift();
    }
  } catch (e) {
    // Silently skip
  }
}, 300000); // Every 5 minutes

// Service health checks
const serviceHealth = {
  gateway: { up: true, lastCheck: new Date(), lastFailure: null },
  frontend: { up: true, lastCheck: new Date(), lastFailure: null }
};

async function checkServiceHealth() {
  // Gateway check
  try {
    const resp = await fetch('http://127.0.0.1:18789/status', { signal: AbortSignal.timeout(2000) });
    serviceHealth.gateway.up = resp.ok;
    if (resp.ok) serviceHealth.gateway.lastCheck = new Date();
  } catch (e) {
    if (!serviceHealth.gateway.up) {
      serviceHealth.gateway.lastFailure = new Date();
    }
    serviceHealth.gateway.up = false;
  }
  
  // Frontend check
  try {
    const resp = await fetch('http://127.0.0.1:5173/', { signal: AbortSignal.timeout(2000) });
    serviceHealth.frontend.up = resp.ok;
    if (resp.ok) serviceHealth.frontend.lastCheck = new Date();
  } catch (e) {
    if (!serviceHealth.frontend.up) {
      serviceHealth.frontend.lastFailure = new Date();
    }
    serviceHealth.frontend.up = false;
  }
}

// Health check every 30 seconds
setInterval(checkServiceHealth, 30000);
checkServiceHealth(); // Initial check

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

// Get cost analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const child = spawn('openclaw', ['sessions', '--json']);
    let stdout = '';
    child.stdout.on('data', d => stdout += d);
    child.on('close', () => {
      try {
        const data = JSON.parse(stdout);
        const sessions = (data.sessions || []).filter(s => 
          !s.key.includes(':cron:') && 
          !s.key.includes(':subagent:') &&
          (s.key.includes(':main') || s.key.includes(':discord:') || s.key.includes(':telegram:'))
        );

        // Calculate costs for current sessions
        const agentCosts = {};
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCost = 0;

        sessions.forEach((s) => {
          const label = s.key.split(':').pop() || 'unknown';
          const model = s.model || 'gpt-4.1-nano';
          const inputTokens = Math.floor(Math.random() * 5000); // Simulated for now
          const outputTokens = Math.floor(Math.random() * 3000);
          
          const cost = calculateCost(model, inputTokens, outputTokens);
          
          agentCosts[label] = {
            model,
            ...cost,
            type: s.key.includes('discord') ? 'Discord' : 
                  s.key.includes('telegram') ? 'Telegram' : 'Main'
          };

          totalInputTokens += cost.inputTokens;
          totalOutputTokens += cost.outputTokens;
          totalCost += cost.totalCost;
        });

        // Record today's cost
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = costHistory.find(h => h.date === today);
        
        if (todayEntry) {
          todayEntry.cost = totalCost;
          todayEntry.inputTokens = totalInputTokens;
          todayEntry.outputTokens = totalOutputTokens;
        } else {
          costHistory.push({
            date: today,
            cost: totalCost,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens
          });
        }
        
        saveCostHistory();

        // Calculate daily average
        const last7Days = costHistory.slice(-7);
        const avgCostPerDay = last7Days.length > 0 
          ? last7Days.reduce((sum, h) => sum + h.cost, 0) / last7Days.length
          : 0;

        // Forecast
        const projectedMonthly = avgCostPerDay * 30;
        const budgetThreshold = 100; // $100/month default
        const budgetAlert = projectedMonthly > budgetThreshold;

        res.json({
          today: {
            date: today,
            totalCost,
            totalInputTokens,
            totalOutputTokens,
            agentCount: sessions.length
          },
          agents: agentCosts,
          history: costHistory.slice(-30), // Last 30 days
          analytics: {
            avgCostPerDay: parseFloat(avgCostPerDay.toFixed(2)),
            projectedMonthly: parseFloat(projectedMonthly.toFixed(2)),
            budgetThreshold,
            budgetAlert,
            last7Days: last7Days.map(h => ({ 
              date: h.date, 
              cost: parseFloat(h.cost.toFixed(2)) 
            }))
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

// Get session logs/history
app.get('/api/session/:sessionKey/logs', async (req, res) => {
  try {
    const { sessionKey } = req.params;
    const limit = Number(req.query.limit || 50);
    
    // Simulated logs - in production, would fetch from OpenClaw history
    const logs = [
      { time: new Date(Date.now() - 60000), type: 'spawn', text: `Session ${sessionKey} started` },
      { time: new Date(Date.now() - 50000), type: 'message', text: 'Agent: Hello! How can I help?' },
      { time: new Date(Date.now() - 45000), type: 'message', text: 'User: What is the weather?' },
      { time: new Date(Date.now() - 40000), type: 'turn', text: 'Turn 1 completed, tokens: 234 in, 156 out' },
      { time: new Date(Date.now() - 30000), type: 'message', text: 'Agent: The weather is sunny.' },
      { time: new Date(), type: 'timestamp', text: `Last active: ${new Date().toLocaleTimeString()}` }
    ];
    
    res.json({ sessionKey, logs: logs.slice(-limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get performance metrics history
app.get('/api/metrics', async (req, res) => {
  const last24h = performanceHistory.slice(-288); // Last 24 hours
  const last7d = performanceHistory.filter((_, i) => i % 12 === 0).slice(-168); // 7-day samples
  
  // Calculate current averages
  const current = performanceHistory[performanceHistory.length - 1] || {
    cpu: 35,
    memory: 62,
    disk: 78
  };
  
  // Calculate 24h averages
  const avg24h = {
    cpu: last24h.length > 0 ? (last24h.reduce((sum, m) => sum + m.cpu, 0) / last24h.length).toFixed(1) : 0,
    memory: last24h.length > 0 ? (last24h.reduce((sum, m) => sum + m.memory, 0) / last24h.length).toFixed(1) : 0,
    disk: last24h.length > 0 ? (last24h.reduce((sum, m) => sum + m.disk, 0) / last24h.length).toFixed(1) : 0
  };
  
  res.json({
    current: {
      timestamp: new Date().toISOString(),
      ...current
    },
    avg24h,
    history: last24h,
    alerts: {
      cpuHigh: current.cpu > 80,
      memoryHigh: current.memory > 85,
      diskHigh: current.disk > 85
    },
    services: serviceHealth
  });
});

// Service restart endpoint
app.post('/api/service/:name/restart', async (req, res) => {
  const { name } = req.params;
  
  try {
    // Log restart attempt
    if (!serviceHealth[name]) {
      return res.status(404).json({ error: `Service ${name} not found` });
    }
    
    // In production, would actually restart the service
    serviceHealth[name].up = true;
    serviceHealth[name].lastCheck = new Date();
    
    res.json({
      success: true,
      service: name,
      status: 'restart_initiated',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get service health
app.get('/api/services/health', async (req, res) => {
  const health = Object.entries(serviceHealth).map(([name, data]) => ({
    name,
    up: data.up,
    lastCheck: data.lastCheck,
    downtime: data.up ? null : Math.round((Date.now() - new Date(data.lastFailure).getTime()) / 1000)
  }));
  
  res.json({ services: health, timestamp: new Date().toISOString() });
});

// Send notification
app.post('/api/notify', async (req, res) => {
  const { message, channel = 'telegram', severity = 'info' } = req.body;
  
  try {
    // Log notification
    console.log(`[${severity.toUpperCase()}] ${channel}: ${message}`);
    
    // In production, would send to Telegram/Discord
    // For now, just return success
    res.json({
      success: true,
      channel,
      message,
      severity,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
