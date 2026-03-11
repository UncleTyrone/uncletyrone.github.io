#!/usr/bin/env node
/**
 * Rain/Kettu devtools server bound to LAN (0.0.0.0) for phone debugging.
 * Compatible with raindevtools protocol. Rain on your phone connects TO this PC.
 */
import * as http from "node:http";
import * as os from "node:os";
import * as readline from "node:readline";
import { WebSocketServer } from "ws";

const MessageType = {
  Hello: "hello",
  Hi: "hi",
  Log: "log",
  Run: "run",
};

const LogLevel = {
  Debug: "debug",
  Default: "default",
  Warn: "warn",
  Error: "error",
};

const colors = {
  reset: "\x1B[0m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  cyan: "\x1B[36m",
};

function formatLog(prefix, color, ...args) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${prefix}]${colors.reset}`, ...args);
}

const logger = {
  log: (...args) => formatLog("LOG", colors.blue, ...args),
  success: (...args) => formatLog("SUCCESS", colors.green, ...args),
  error: (...args) => formatLog("ERROR", colors.red, ...args),
  warn: (...args) => formatLog("WARN", colors.yellow, ...args),
  server: (...args) => formatLog("SERVER", colors.cyan, ...args),
  client: (clientId, level, ...args) => {
    const color = {
      [LogLevel.Debug]: colors.blue,
      [LogLevel.Default]: colors.reset,
      [LogLevel.Warn]: colors.yellow,
      [LogLevel.Error]: colors.red,
    }[level] ?? colors.reset;
    formatLog(`CLIENT:${clientId}`, color, ...args);
  },
};

function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let port = 7864;
  let host = "0.0.0.0";
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--port" || arg === "-p") {
      const portValue = args[++i];
      if (portValue) {
        port = Number(portValue);
        if (Number.isNaN(port)) {
          logger.error("Invalid port number");
          process.exit(1);
        }
      }
    } else if (arg === "--host" || arg === "-h") {
      const hostValue = args[++i];
      if (hostValue && !hostValue.startsWith("-")) {
        host = hostValue;
      }
    } else if (arg === "--help") {
      console.log("Usage: node raindevtools-local.mjs [options]");
      console.log("");
      console.log("Options:");
      console.log("  --port, -p <port>    Port (default: 7864)");
      console.log("  --host <host>        Host (default: 0.0.0.0 = all interfaces)");
      console.log("  --help               Show this help");
      process.exit(0);
    }
  }
  return { port, host };
}

const { port: PORT, host: HOST } = parseArgs();
const clients = new Map();

const server = http.createServer((_req, res) => {
  res.writeHead(426, { "Content-Type": "text/plain" });
  res.end("WebSocket connection required");
});

new WebSocketServer({ server }).on("connection", (ws, req) => {
  const clientData = {
    id: crypto.randomUUID().slice(0, 8),
    version: 0,
    authenticated: false,
  };
  clients.set(ws, clientData);
  const remoteAddress = req.socket.remoteAddress ?? "unknown";
  logger.server(`Connection open: ${remoteAddress}`);

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const clientInfo = clients.get(ws);
      switch (msg.type) {
        case MessageType.Hello:
          handleHello(ws, msg);
          break;
        case MessageType.Log:
          if (!clientInfo.authenticated) {
            ws.close(1008, "Not authenticated");
            return;
          }
          handleLog(ws, msg);
          break;
        default:
          logger.warn(`Unknown message type: ${msg.type}`);
      }
    } catch (e) {
      logger.error("Parse error:", e);
    }
  });

  ws.on("close", (code, reason) => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      logger.server(`Client disconnected: ${clientInfo.id} (${code}: ${reason.toString()})`);
    }
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    logger.error("WebSocket error:", error);
  });
});

function handleHello(ws, msg) {
  const clientData = clients.get(ws);
  logger.server(`Client connected: ${clientData.id} (v${msg.data.version})`);
  clientData.version = msg.data.version;
  clientData.authenticated = true;
  ws.send(JSON.stringify({ type: MessageType.Hi, data: { supported: true } }));
}

function handleLog(ws, msg) {
  const clientData = clients.get(ws);
  logger.client(clientData.id, msg.data.level, ...msg.data.message);
}

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const [ws, data] of clients.entries()) {
    if (data.authenticated && ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });

server.listen(PORT, HOST, () => {
  const ips = getLocalIPs();
  logger.success(`Devtools server running on port ${PORT}`);
  logger.log("");
  logger.log("Connect from your phone (Rain/Kettu) using one of these URLs:");
  for (const ip of ips) {
    logger.log(`  ws://${ip}:${PORT}`);
  }
  if (ips.length === 0) {
    logger.warn("No LAN IPv4 addresses found. Use ws://YOUR_PC_IP:" + PORT);
  }
  logger.log("");
  logger.log("Type .help for commands");
  rl.prompt();
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    rl.prompt();
    return;
  }
  const [command, ...args] = trimmed.split(/\s+/);
  switch (command) {
    case ".help":
    case "?":
      logger.log("Commands:");
      logger.log("  .clients, .ls  - List connected clients");
      logger.log("  .help, ?       - Show this help");
      logger.log("  .exit, .q      - Exit server");
      logger.log("  <code>         - Execute code on all clients");
      break;
    case ".exit":
    case ".quit":
    case ".q":
      logger.warn("Shutting down...");
      process.exit(0);
    case ".ls":
    case ".clients":
      if (clients.size === 0) {
        logger.log("No clients connected");
      } else {
        logger.log(`Connected clients (${clients.size}):`);
        for (const [, data] of clients.entries()) {
          logger.log(`  ${data.id} - v${data.version}`);
        }
      }
      break;
    default:
      if (!clients.size) {
        logger.error("No clients connected");
        break;
      }
      broadcast({ type: MessageType.Run, data: { code: trimmed } });
      logger.server("Broadcasted code to all clients");
  }
  rl.prompt();
});

rl.on("close", () => process.exit(0));
process.on("SIGINT", () => {
  logger.warn("\nShutting down...");
  process.exit(0);
});
