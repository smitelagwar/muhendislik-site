// This launcher owns the loopback listener and replaces any client-supplied
// capability header before Next sees the request. It is opt-in and local-only.
const http = require("node:http");
const crypto = require("node:crypto");
const next = require("next");
if (process.platform !== "win32") throw new Error("Yerel ideCAD sunucusu Windows gerektirir.");
const port = Number(process.env.HSYNCAD_REPORT_PORT || "3311");
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Geçersiz port.");
process.env.HSYNCAD_REPORT_LOCAL_SECRET = crypto.randomBytes(32).toString("hex");
process.env.HSYNCAD_REPORT_LOCAL_PORT = String(port);
const app = next({ dev: process.env.NODE_ENV !== "production", hostname: "127.0.0.1", port, webpack: true });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    req.headers["x-hsyncad-local-capability"] = process.env.HSYNCAD_REPORT_LOCAL_SECRET;
    Promise.resolve(handle(req, res)).catch(() => { if (!res.headersSent) res.writeHead(500); res.end(); });
  });
  server.listen(port, "127.0.0.1", () => process.stdout.write(`Hsyncad yerel: http://127.0.0.1:${port}\n`));
}).catch(err => { process.stderr.write(String(err) + "\n"); process.exitCode = 1; });
