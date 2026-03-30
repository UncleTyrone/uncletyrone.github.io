# Kettu Discord Devtools (LAN debugging)

Debug Kettu on your phone by connecting to your PC over the local network (LAN).

This server is for development/debugging only. It does not interact with production data.

## Quick start

1. Start the devtools server (on your PC):

```bash
npm run devtools
```

2. Look at the console output. It will print one or more LAN URLs like:
- `ws://192.168.x.x:<port>`

3. In Kettu Discord on your phone:
   - Open Settings → Developer (or Debug)
   - Set the Devtools URL to one of the printed LAN URLs

4. Ensure your phone and PC are on the same Wi-Fi network.

## Run manually (optional)

You can run the server directly with node:

```bash
node scripts/devtools-local.mjs --port 7864 --host 0.0.0.0
```

Supported args:
- `--port, -p` (default: `7864`)
- `--host, -h` (default: `0.0.0.0` = all interfaces)

## Commands (while running)

The devtools server supports these commands in its terminal:

- `.clients` (or `.ls`)  
  List connected clients

- `.help` (or `?`)  
  Show help

- `.exit` (or `.q`)  
  Shut down the devtools server

- `<code>`  
  Type any code and press Enter to execute it on all connected clients

## Troubleshooting

### “Gets disabled” (BetterCode / plugin issues)

If a plugin installs but gets disabled:
1. Connect your phone to the devtools server
2. Watch the devtools server output for errors
3. Use `.clients` to verify the phone is connected

