import { watch } from "fs";
import { serve, file, spawn } from "bun";

const BASE_PORT = parseInt(process.env.PORT || "3000", 10);
const DIST = "./dist";
const SRC = "./src";
const clients = new Set<WebSocket>();

// Spawn the build watcher for src/ changes
const buildProc = spawn(["bun", "build", "--watch", `./${SRC}/main.ts`, `--outdir=${DIST}`, "--naming=index.[ext]"], {
  stdout: "pipe",
  stderr: "inherit",
});
buildProc.stdout?.pipeTo(new WritableStream({ write: (chunk) => process.stdout.write(chunk) }));

// Also watch index.html and copy to dist on change
watch(".", { recursive: false }, (event, filename) => {
  if (filename === "index.html") {
    Bun.write(`${DIST}/index.html`, Bun.file("index.html"));
    notifyClients();
  }
});

function notifyClients() {
  for (const ws of clients) {
    ws.send("reload");
  }
}

// Inject a script before </body> for live reload
function injectReload(html: string): string {
  const script = `
<script>
  (() => {
    let ws = new WebSocket("ws://" + location.host + "/__reload");
    ws.onmessage = () => location.reload();
    ws.onclose = () => setTimeout(() => location.reload(), 1000);
  })();
</script>`;
  return html.replace("</body>", script + "</body>");
}

function startServer(port: number) {
  const server = serve({
    port,
    websocket: {
      open(ws) {
        clients.add(ws);
      },
      close(ws) {
        clients.delete(ws);
      },
    },
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/__reload" && req.headers.get("upgrade") === "websocket") {
        return server.upgrade(req);
      }

      let path = url.pathname === "/" ? "/index.html" : url.pathname;
      const f = file(DIST + path);
      const exists = await f.exists();
      if (!exists) return new Response("Not found", { status: 404 });

      if (path.endsWith(".html")) {
        const text = await f.text();
        return new Response(injectReload(text), {
          headers: { "Content-Type": "text/html" },
        });
      }

      return new Response(f);
    },
  });

  watch(DIST, { recursive: true }, (event, filename) => {
    if (filename && filename !== "index.html") notifyClients();
  });

  console.log(`  dev server at http://localhost:${port}`);

  process.on("SIGINT", () => {
    buildProc.kill();
    server.stop();
    process.exit();
  });
}

// Try BASE_PORT, if taken try the next, up to +10
for (let port = BASE_PORT; port < BASE_PORT + 10; port++) {
  try {
    startServer(port);
    break;
  } catch {
    if (port === BASE_PORT + 9) {
      console.error(`  could not find a free port between ${BASE_PORT}–${BASE_PORT + 9}`);
      process.exit(1);
    }
    continue;
  }
}
