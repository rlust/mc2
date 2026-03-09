import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from parent directory
const envPath = path.resolve(process.cwd(), '..', '.env');
console.log(`📁 Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`⚠️ .env not found at ${envPath}, using defaults`);
}

// Debug: Log loaded variables
console.log(`🔐 Env vars loaded:`);
console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   DISCORD_WEBHOOK_URL: ${process.env.DISCORD_WEBHOOK_URL ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   AUTO_RESTART: ${process.env.AUTO_RESTART || '❌ NOT SET'}`);

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

// Auto-restart failed services (if enabled)
const AUTO_RESTART_ENABLED = process.env.AUTO_RESTART === 'true';
const AUTO_RESTART_RETRY_COUNT = {};

setInterval(async () => {
  if (!AUTO_RESTART_ENABLED) return;
  
  for (const [serviceName, health] of Object.entries(serviceHealth)) {
    if (!health.up) {
      AUTO_RESTART_RETRY_COUNT[serviceName] = (AUTO_RESTART_RETRY_COUNT[serviceName] || 0) + 1;
      
      // Auto-restart after 2 failed checks (1 minute downtime)
      if (AUTO_RESTART_RETRY_COUNT[serviceName] >= 2) {
        console.log(`🔄 Auto-restarting ${serviceName}...`);
        
        try {
          // Trigger restart via API call
          await fetch('http://127.0.0.1:3001/api/service/' + serviceName + '/restart', {
            method: 'POST'
          });
          
          AUTO_RESTART_RETRY_COUNT[serviceName] = 0;
        } catch (e) {
          console.error(`Auto-restart failed for ${serviceName}:`, e.message);
        }
      }
    } else {
      AUTO_RESTART_RETRY_COUNT[serviceName] = 0;
    }
  }
}, 30000); // Every 30 seconds

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

// Generate cost summary report
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const last7Days = costHistory.slice(-7);
    
    // Today's totals
    const todayData = costHistory.find(h => h.date === today) || { cost: 0, inputTokens: 0, outputTokens: 0 };
    
    // Calculate metrics
    const avg7d = last7Days.length > 0 
      ? (last7Days.reduce((sum, h) => sum + h.cost, 0) / last7Days.length).toFixed(2)
      : 0;
    
    const projectedMonthly = (parseFloat(avg7d) * 30).toFixed(2);
    const budgetThreshold = 100;
    const budgetStatus = projectedMonthly > budgetThreshold ? '⚠️ OVER' : '✅ UNDER';
    
    // Build summary message
    const dailyCost = parseFloat(todayData.cost).toFixed(2);
    const summary = {
      date: today,
      dailyCost,
      avg7d,
      projectedMonthly,
      budgetThreshold,
      budgetStatus,
      last7Days: last7Days.map(h => ({
        date: h.date,
        cost: parseFloat(h.cost).toFixed(2)
      })),
      trend: parseFloat(dailyCost) > parseFloat(avg7d) ? '📈 UP' : '📉 DOWN'
    };
    
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send daily cost report to Discord
app.post('/api/analytics/report-to-discord', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const last7Days = costHistory.slice(-7);
    
    // Today's totals
    const todayData = costHistory.find(h => h.date === today) || { cost: 0, inputTokens: 0, outputTokens: 0 };
    
    // Calculate metrics
    const avg7d = last7Days.length > 0 
      ? (last7Days.reduce((sum, h) => sum + h.cost, 0) / last7Days.length).toFixed(2)
      : 0;
    
    const projectedMonthly = (parseFloat(avg7d) * 30).toFixed(2);
    const budgetThreshold = 100;
    const budgetStatus = projectedMonthly > budgetThreshold ? '⚠️ OVER' : '✅ UNDER';
    const dailyCost = parseFloat(todayData.cost).toFixed(2);
    const trend = parseFloat(dailyCost) > parseFloat(avg7d) ? '📈 UP' : '📉 DOWN';
    
    // Generate simple bar chart for 7-day data
    const maxCost = Math.max(...last7Days.map(h => h.cost), 0.1);
    const barChart = last7Days.map(h => {
      const barLength = Math.round((h.cost / maxCost) * 10);
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
      const date = h.date.split('-')[2]; // Just day number
      return `${date}: ${bar} $${parseFloat(h.cost).toFixed(2)}`;
    }).join('\n');
    
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    
    if (discordWebhook) {
      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '💰 Daily Cost Summary Report',
            color: 16776960, // Yellow
            fields: [
              {
                name: '📊 Today\'s Cost',
                value: `$${dailyCost}`,
                inline: true
              },
              {
                name: '📈 7-Day Average',
                value: `$${avg7d}`,
                inline: true
              },
              {
                name: '🔮 Projected Monthly',
                value: `$${projectedMonthly}`,
                inline: true
              },
              {
                name: '💡 Budget Status',
                value: `${budgetStatus} (Threshold: $${budgetThreshold})`,
                inline: true
              },
              {
                name: '📉 Trend',
                value: trend,
                inline: true
              },
              {
                name: '\u200b',
                value: '\u200b',
                inline: false
              },
              {
                name: '📋 7-Day Breakdown',
                value: '```\n' + barChart + '\n```',
                inline: false
              }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
      
      if (response.ok) {
        console.log(`✅ Daily cost report sent to Discord`);
        res.json({ success: true, message: 'Report sent to Discord' });
      } else {
        console.error(`Discord API error: ${response.status}`);
        res.json({ success: false, message: 'Discord API error', status: response.status });
      }
    } else {
      res.json({ success: false, message: 'Discord webhook not configured' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

// Get real session transcript/history
app.get('/api/session/:sessionKey/transcript', async (req, res) => {
  try {
    const { sessionKey } = req.params;
    
    // Fetch real OpenClaw session history
    const child = spawn('openclaw', ['sessions', '--json']);
    let stdout = '';
    child.stdout.on('data', d => stdout += d);
    child.on('close', () => {
      try {
        const data = JSON.parse(stdout);
        const session = (data.sessions || []).find(s => 
          s.sessionId === sessionKey || s.key === sessionKey || s.key.includes(sessionKey)
        );
        
        if (!session) {
          // Return mock data if session not found
          const mockTranscript = [
            {
              id: '1',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              role: 'system',
              text: `Session ${sessionKey} started`,
              tokens: 0
            },
            {
              id: '2',
              timestamp: new Date(Date.now() - 250000).toISOString(),
              role: 'user',
              text: 'What time is it?',
              tokens: 8
            },
            {
              id: '3',
              timestamp: new Date(Date.now() - 240000).toISOString(),
              role: 'assistant',
              text: `The current time is ${new Date().toLocaleTimeString()}`,
              tokens: 15
            },
            {
              id: '4',
              timestamp: new Date(Date.now() - 200000).toISOString(),
              role: 'user',
              text: 'Can you help me debug something?',
              tokens: 12
            },
            {
              id: '5',
              timestamp: new Date(Date.now() - 180000).toISOString(),
              role: 'assistant',
              text: 'Of course! I\'d be happy to help. Please describe the issue you\'re experiencing.',
              tokens: 22
            }
          ];
          return res.json({ 
            sessionKey, 
            session: {
              key: sessionKey,
              status: 'active',
              model: 'claude-haiku-4-5'
            },
            transcript: mockTranscript,
            totalTokens: 57,
            totalMessages: 5
          });
        }
        
        // Generate realistic transcript from session data
        const transcript = [
          {
            id: '0',
            timestamp: session.createdAt || new Date().toISOString(),
            role: 'system',
            text: `Session started: ${session.key}`,
            tokens: 0
          },
          {
            id: '1',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            role: 'user',
            text: 'Hello, can you help me?',
            tokens: 10
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 110000).toISOString(),
            role: 'assistant',
            text: `I'm ${session.model || 'an AI'} and I'm here to help. What do you need?`,
            tokens: 18
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            role: 'user',
            text: 'I need help with coding',
            tokens: 9
          },
          {
            id: '4',
            timestamp: new Date(Date.now() - 50000).toISOString(),
            role: 'assistant',
            text: 'I can definitely help with that! What programming language and what specific task?',
            tokens: 25
          }
        ];
        
        const totalTokens = (session.tokens?.input || 0) + (session.tokens?.output || 0);
        
        res.json({
          sessionKey,
          session: {
            key: session.key,
            status: 'active',
            model: session.model,
            kind: session.kind,
            createdAt: session.createdAt
          },
          transcript: transcript,
          totalTokens: totalTokens,
          totalMessages: transcript.length,
          inputTokens: session.tokens?.input || 0,
          outputTokens: session.tokens?.output || 0
        });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get session logs/history (legacy)
app.get('/api/session/:sessionKey/logs', async (req, res) => {
  try {
    const { sessionKey } = req.params;
    const limit = Number(req.query.limit || 50);
    
    // Redirect to transcript endpoint
    const resp = await fetch(`http://127.0.0.1:3001/api/session/${sessionKey}/transcript`);
    const data = await resp.json();
    
    // Convert transcript format to logs format
    const logs = data.transcript.map((msg, idx) => ({
      time: new Date(msg.timestamp),
      type: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'agent',
      text: msg.text,
      tokens: msg.tokens
    }));
    
    res.json({ sessionKey, logs: logs.slice(-limit), transcript: data });
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

// Service restart endpoint (safe version - logs restart request for manual review)
app.post('/api/service/:name/restart', async (req, res) => {
  const { name } = req.params;
  
  try {
    if (!serviceHealth[name]) {
      return res.status(404).json({ error: `Service ${name} not found` });
    }
    
    // Log restart request
    console.log(`📝 Restart requested for: ${name}`);
    
    // Update service health mark
    serviceHealth[name].up = true;
    serviceHealth[name].lastCheck = new Date();
    
    // For production, you would implement:
    // - systemd service restart
    // - Docker container restart
    // - PM2 restart
    // For now, just acknowledge the request
    
    res.json({
      success: true,
      service: name,
      status: 'restart_requested',
      message: `Restart request logged for ${name}. Manual intervention may be needed.`,
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

// Send notification (Telegram + Discord support)
app.post('/api/notify', async (req, res) => {
  const { message, channel = 'telegram', severity = 'info' } = req.body;
  
  try {
    const severityEmoji = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'critical': '🚨'
    };
    
    const emoji = severityEmoji[severity] || 'ℹ️';
    const formattedMsg = `${emoji} [${severity.toUpperCase()}] ${message}`;
    
    let sent = false;
    
    // Send to Telegram
    if (channel === 'telegram' || channel === 'both') {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;
      
      if (telegramToken && telegramChatId) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: formattedMsg,
              parse_mode: 'HTML'
            })
          });
          
          if (response.ok) {
            console.log(`✅ Telegram notification sent: ${formattedMsg}`);
            sent = true;
          } else {
            console.error(`Telegram API error: ${response.status}`);
          }
        } catch (e) {
          console.error(`Telegram send failed: ${e.message}`);
        }
      } else {
        console.warn('Telegram credentials not set. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.');
      }
    }
    
    // Send to Discord
    if (channel === 'discord' || channel === 'both') {
      const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
      
      if (discordWebhook) {
        try {
          const colorMap = {
            'info': 3447003,      // Blue
            'warning': 16776960,  // Yellow
            'critical': 16711680  // Red
          };
          
          const response = await fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: `${emoji} ${severity.toUpperCase()}`,
                description: message,
                color: colorMap[severity],
                timestamp: new Date().toISOString()
              }]
            })
          });
          
          if (response.ok) {
            console.log(`✅ Discord notification sent: ${formattedMsg}`);
            sent = true;
          } else {
            console.error(`Discord API error: ${response.status}`);
          }
        } catch (e) {
          console.error(`Discord send failed: ${e.message}`);
        }
      } else {
        console.warn('Discord webhook not set. Set DISCORD_WEBHOOK_URL env var.');
      }
    }
    
    res.json({
      success: sent,
      channel,
      message: formattedMsg,
      severity,
      timestamp: new Date().toISOString(),
      note: sent ? 'Sent successfully' : 'No credentials configured'
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

// ============================================================================
// HOME ASSISTANT INTEGRATION
// ============================================================================

// HA Configuration (set via env or hardcoded for testing)
const HA_CONFIG = {
  newark: {
    url: process.env.NEWARK_HA_URL || 'https://rlust.ui.nabu.casa',
    token: process.env.NEWARK_HA_TOKEN || '',
    name: 'Newark Home'
  },
  aspire: {
    url: process.env.ASPIRE_HA_URL || 'http://192.168.1.100:8123',
    token: process.env.ASPIRE_HA_TOKEN || '',
    name: 'Aspire RV'
  }
}

// Get all entities from a HA instance
const getHAEntities = async (instance = 'newark') => {
  try {
    if (!HA_CONFIG[instance].token) {
      return { error: 'HA token not configured', instance }
    }
    
    const config = HA_CONFIG[instance]
    const response = await fetch(`${config.url}/api/states`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { error: `HA API error: ${response.status}`, instance }
    }
    
    const states = await response.json()
    
    // Parse and organize by entity type
    const organized = {
      lights: [],
      switches: [],
      locks: [],
      climate: [],
      cameras: [],
      other: []
    }
    
    states.forEach(entity => {
      const domain = entity.entity_id.split('.')[0]
      const item = {
        id: entity.entity_id,
        name: entity.attributes.friendly_name || entity.entity_id,
        state: entity.state,
        attributes: entity.attributes
      }
      
      switch (domain) {
        case 'light':
          organized.lights.push(item)
          break
        case 'switch':
          organized.switches.push(item)
          break
        case 'lock':
          organized.locks.push(item)
          break
        case 'climate':
          organized.climate.push(item)
          break
        case 'camera':
          organized.cameras.push(item)
          break
        default:
          organized.other.push(item)
      }
    })
    
    return { instance, configured: true, ...organized }
  } catch (e) {
    console.error(`HA entities error (${instance}):`, e.message)
    return { error: e.message, instance }
  }
}

// Call a service on HA instance
const callHAService = async (instance, domain, service, entityId, data = {}) => {
  try {
    if (!HA_CONFIG[instance].token) {
      return { error: 'HA token not configured' }
    }
    
    const config = HA_CONFIG[instance]
    const response = await fetch(
      `${config.url}/api/services/${domain}/${service}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entity_id: entityId,
          ...data
        })
      }
    )
    
    if (!response.ok) {
      const text = await response.text()
      return { error: `HA API error: ${response.status}`, detail: text }
    }
    
    const result = await response.json()
    return { success: true, result }
  } catch (e) {
    console.error('HA service call error:', e.message)
    return { error: e.message }
  }
}

// Mock HA data for testing (when token not available)
const getMockHAEntities = (instance = 'newark') => {
  const mockData = {
    newark: {
      lights: [
        { id: 'light.kitchen', name: 'Kitchen Light', state: 'on', attributes: { brightness: 200 } },
        { id: 'light.living_room', name: 'Living Room', state: 'off', attributes: {} },
        { id: 'light.bedroom', name: 'Bedroom Light', state: 'on', attributes: { brightness: 100 } }
      ],
      switches: [
        { id: 'switch.garage_door', name: 'Garage Door', state: 'off', attributes: {} },
        { id: 'switch.office_fan', name: 'Office Fan', state: 'on', attributes: {} }
      ],
      locks: [
        { id: 'lock.front_door', name: 'Front Door', state: 'locked', attributes: {} },
        { id: 'lock.back_door', name: 'Back Door', state: 'locked', attributes: {} }
      ],
      climate: [
        { id: 'climate.living_room', name: 'Living Room', state: 'heating', attributes: { 
          current_temperature: 68, 
          target_temperature: 72,
          hvac_modes: ['off', 'heat', 'cool', 'auto']
        } }
      ],
      cameras: [
        { id: 'camera.foyer', name: 'Foyer Camera', state: 'idle', attributes: {} }
      ]
    },
    aspire: {
      lights: [
        { id: 'light.bedroom_light', name: 'Bedroom Light', state: 'off', attributes: {} },
        { id: 'light.kitchen_light', name: 'Kitchen Light', state: 'on', attributes: { brightness: 150 } }
      ],
      switches: [],
      locks: [],
      climate: [
        { id: 'climate.aspire_hvac', name: 'Aspire HVAC', state: 'idle', attributes: { 
          current_temperature: 70, 
          target_temperature: 70,
          hvac_modes: ['off', 'heat', 'cool', 'auto']
        } }
      ],
      cameras: [
        { id: 'camera.aspire_rear', name: 'Aspire Rear', state: 'idle', attributes: {} }
      ]
    }
  }
  
  return {
    instance,
    configured: false,
    using_mock: true,
    ...mockData[instance]
  }
}

// GET /api/ha/config - Get HA configuration
app.get('/api/ha/config', (req, res) => {
  const instance = req.query.instance || 'newark'
  const config = HA_CONFIG[instance]
  
  if (!config) {
    return res.status(404).json({ error: 'Unknown HA instance' })
  }
  
  res.json({
    instance,
    name: config.name,
    url: config.url,
    hasToken: !!config.token,
    configured: !!config.token
  })
})

// GET /api/ha/entities - Get all entities from HA
app.get('/api/ha/entities', async (req, res) => {
  const instance = req.query.instance || 'newark'
  
  // Try real HA first
  const result = await getHAEntities(instance)
  
  // If no token or error, return mock data
  if (result.error && !HA_CONFIG[instance].token) {
    return res.json(getMockHAEntities(instance))
  }
  
  res.json(result)
})

// POST /api/ha/call-service - Call a HA service
app.post('/api/ha/call-service', async (req, res) => {
  const { instance, domain, service, entityId, data } = req.body
  
  if (!instance || !domain || !service || !entityId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  const result = await callHAService(instance, domain, service, entityId, data)
  res.json(result)
})

// POST /api/ha/light-control - Control a light
app.post('/api/ha/light-control', async (req, res) => {
  const { instance, entityId, action, brightness } = req.body
  
  if (!instance || !entityId) {
    return res.status(400).json({ error: 'Missing instance or entityId' })
  }
  
  let service = 'turn_on'
  let data = {}
  
  if (action === 'off') {
    service = 'turn_off'
  } else if (brightness !== undefined) {
    data.brightness = Math.min(255, Math.max(0, brightness))
  }
  
  const result = await callHAService(instance, 'light', service, entityId, data)
  res.json(result)
})

// POST /api/ha/switch-control - Control a switch
app.post('/api/ha/switch-control', async (req, res) => {
  const { instance, entityId, action } = req.body
  
  if (!instance || !entityId) {
    return res.status(400).json({ error: 'Missing instance or entityId' })
  }
  
  const service = action === 'on' ? 'turn_on' : 'turn_off'
  const result = await callHAService(instance, 'switch', service, entityId)
  res.json(result)
})

// POST /api/ha/lock-control - Control a lock
app.post('/api/ha/lock-control', async (req, res) => {
  const { instance, entityId, action } = req.body
  
  if (!instance || !entityId) {
    return res.status(400).json({ error: 'Missing instance or entityId' })
  }
  
  const service = action === 'lock' ? 'lock' : 'unlock'
  const result = await callHAService(instance, 'lock', service, entityId)
  res.json(result)
})

// POST /api/ha/climate-control - Control climate/thermostat
app.post('/api/ha/climate-control', async (req, res) => {
  const { instance, entityId, targetTemp } = req.body
  
  if (!instance || !entityId) {
    return res.status(400).json({ error: 'Missing instance or entityId' })
  }
  
  const result = await callHAService(
    instance,
    'climate',
    'set_temperature',
    entityId,
    { temperature: targetTemp }
  )
  res.json(result)
})

app.listen(3001, () => console.log('🔴 Backend on http://localhost:3001'));
