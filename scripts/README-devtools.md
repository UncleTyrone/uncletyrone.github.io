# Rain/Kettu Devtools (LAN debugging)

Debug Rain or Kettu on your phone by connecting to your PC over the local network.

## Quick start

1. **Start the devtools server** (on your PC):

   ```bash
   npm run devtools
   ```

2. **Note the printed URLs** (e.g. `ws://192.168.1.100:7864`).

3. **In Rain/Kettu** on your phone:
   - Open **Settings** → **Developer** (or **Debug**)
   - Set the **Devtools URL** to one of the printed URLs (use your PC’s IP)

4. Ensure your phone and PC are on the **same Wi‑Fi** network.

## Options

```bash
node scripts/raindevtools-local.mjs --port 7864 --host 0.0.0.0
```

- `--port, -p` — Port (default: 7864)
- `--host` — Host (default: `0.0.0.0` = all interfaces)

## Commands (while running)

- `.clients` or `.ls` — List connected clients
- `.help` — Show help
- `.exit` or `.q` — Exit
- Type any code and press Enter to run it on all connected clients

## Why “gets disabled”?

If BetterCode (or another plugin) installs but gets disabled, use the devtools connection to inspect the error:

1. Connect Rain to the devtools server.
2. Check the server output for logs/errors.
3. Use `.clients` to confirm the phone is connected.
