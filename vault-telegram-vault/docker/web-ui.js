import express from 'express'
import { EventEmitter } from 'events'

const app = express()
const logEmitter = new EventEmitter()

// Store logs in memory (last 100 entries)
const logs = []
const MAX_LOGS = 100

// Bot status
let botStatus = {
  status: 'starting',
  startTime: new Date().toISOString(),
  messagesProcessed: 0,
  lastActivity: null,
  errors: 0,
  uptime: 0
}

// Add log entry
export function addLog(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta
  }
  
  logs.push(logEntry)
  if (logs.length > MAX_LOGS) {
    logs.shift()
  }
  
  logEmitter.emit('log', logEntry)
  
  // Update status
  if (level === 'error') {
    botStatus.errors++
  }
  botStatus.lastActivity = new Date().toISOString()
}

// Update bot status
export function updateStatus(status) {
  botStatus.status = status
  botStatus.uptime = Math.floor((Date.now() - new Date(botStatus.startTime).getTime()) / 1000)
  logEmitter.emit('status', botStatus)
}

// Increment message counter
export function incrementMessages() {
  botStatus.messagesProcessed++
  botStatus.lastActivity = new Date().toISOString()
  logEmitter.emit('status', botStatus)
}

// HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telegram Vault - Monitor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #e0e0e0;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .status-running { background: #4caf50; }
    .status-starting { background: #ff9800; }
    .status-error { background: #f44336; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #1a1a1a;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #333;
    }
    .stat-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }
    .logs-container {
      background: #1a1a1a;
      border-radius: 8px;
      border: 1px solid #333;
      padding: 15px;
      max-height: 600px;
      overflow-y: auto;
    }
    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }
    .logs-title {
      font-size: 16px;
      font-weight: bold;
      color: #fff;
    }
    .clear-btn {
      background: #333;
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .clear-btn:hover { background: #444; }
    .log-entry {
      padding: 8px 0;
      border-bottom: 1px solid #2a2a2a;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .log-entry:last-child { border-bottom: none; }
    .log-timestamp {
      color: #666;
      margin-right: 10px;
    }
    .log-level {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
      margin-right: 10px;
      text-transform: uppercase;
    }
    .log-level-info { background: #2196f3; color: #fff; }
    .log-level-success { background: #4caf50; color: #fff; }
    .log-level-warning { background: #ff9800; color: #fff; }
    .log-level-error { background: #f44336; color: #fff; }
    .log-message { color: #e0e0e0; }
    .log-meta {
      color: #888;
      font-size: 11px;
      margin-left: 10px;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #1a1a1a; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <span class="status-indicator status-starting" id="statusIndicator"></span>
      Telegram Vault Monitor
    </h1>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Status</div>
        <div class="stat-value" id="status">Starting...</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Messages Processed</div>
        <div class="stat-value" id="messages">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uptime</div>
        <div class="stat-value" id="uptime">0s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Errors</div>
        <div class="stat-value" id="errors">0</div>
      </div>
    </div>
    
    <div class="logs-container">
      <div class="logs-header">
        <div class="logs-title">Activity Logs</div>
        <button class="clear-btn" onclick="clearLogs()">Clear Logs</button>
      </div>
      <div id="logs">
        <div class="empty-state">Waiting for logs...</div>
      </div>
    </div>
  </div>
  
  <script>
    const logsContainer = document.getElementById('logs')
    const statusEl = document.getElementById('status')
    const messagesEl = document.getElementById('messages')
    const uptimeEl = document.getElementById('uptime')
    const errorsEl = document.getElementById('errors')
    const statusIndicator = document.getElementById('statusIndicator')
    
    // Connect to SSE
    const evtSource = new EventSource('/events')
    
    evtSource.addEventListener('log', (e) => {
      const log = JSON.parse(e.data)
      addLogEntry(log)
    })
    
    evtSource.addEventListener('status', (e) => {
      const status = JSON.parse(e.data)
      updateStatus(status)
    })
    
    evtSource.onerror = () => {
      console.error('SSE connection error')
    }
    
    function addLogEntry(log) {
      if (logsContainer.querySelector('.empty-state')) {
        logsContainer.innerHTML = ''
      }
      
      const entry = document.createElement('div')
      entry.className = 'log-entry'
      
      const time = new Date(log.timestamp).toLocaleTimeString()
      const meta = log.meta && Object.keys(log.meta).length > 0 
        ? '<span class="log-meta">' + JSON.stringify(log.meta) + '</span>'
        : ''
      
      entry.innerHTML = \`
        <span class="log-timestamp">\${time}</span>
        <span class="log-level log-level-\${log.level}">\${log.level}</span>
        <span class="log-message">\${log.message}</span>
        \${meta}
      \`
      
      logsContainer.insertBefore(entry, logsContainer.firstChild)
      
      // Keep only last 100 entries
      while (logsContainer.children.length > 100) {
        logsContainer.removeChild(logsContainer.lastChild)
      }
    }
    
    function updateStatus(status) {
      statusEl.textContent = status.status.charAt(0).toUpperCase() + status.status.slice(1)
      messagesEl.textContent = status.messagesProcessed
      uptimeEl.textContent = formatUptime(status.uptime)
      errorsEl.textContent = status.errors
      
      // Update indicator
      statusIndicator.className = 'status-indicator status-' + status.status
    }
    
    function formatUptime(seconds) {
      if (seconds < 60) return seconds + 's'
      if (seconds < 3600) return Math.floor(seconds / 60) + 'm'
      return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm'
    }
    
    function clearLogs() {
      logsContainer.innerHTML = '<div class="empty-state">Logs cleared</div>'
    }
    
    // Load initial data
    fetch('/api/logs')
      .then(r => r.json())
      .then(data => {
        data.logs.forEach(log => addLogEntry(log))
        updateStatus(data.status)
      })
  </script>
</body>
</html>
  `)
})

// API endpoints
app.get('/api/logs', (req, res) => {
  res.json({ logs, status: botStatus })
})

app.get('/api/status', (req, res) => {
  res.json(botStatus)
})

// Server-Sent Events for real-time updates
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  
  const logListener = (log) => {
    res.write(`event: log\ndata: ${JSON.stringify(log)}\n\n`)
  }
  
  const statusListener = (status) => {
    res.write(`event: status\ndata: ${JSON.stringify(status)}\n\n`)
  }
  
  logEmitter.on('log', logListener)
  logEmitter.on('status', statusListener)
  
  req.on('close', () => {
    logEmitter.off('log', logListener)
    logEmitter.off('status', statusListener)
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', botStatus: botStatus.status })
})

// Start server
export function startWebUI(port = 8080) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Web UI running on http://0.0.0.0:${port}`)
    addLog('info', `Web UI started on port ${port}`)
  })
}
