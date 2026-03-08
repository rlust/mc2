import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

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

app.listen(3001, () => console.log('🔴 Backend on http://localhost:3001'));
