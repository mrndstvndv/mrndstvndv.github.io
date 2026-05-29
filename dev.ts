import { watch } from "fs";
import { serve, file, spawn, type ServerWebSocket } from "bun";

const BASE_PORT = parseInt(process.env.PORT || "3000", 10);
const DIST = "./dist";
const SRC = "./src";
const BLOGS = "./blogs";
const BUILD_DEBOUNCE_MS = 100;
const ROOT_BUILD_INPUTS = new Set(["index.html", "build.ts"]);
const clients = new Set<ServerWebSocket>();

let buildProc: ReturnType<typeof spawn> | undefined;
let buildQueued = false;
let buildTimer: ReturnType<typeof setTimeout> | undefined;

function queueBuild() {
  if (buildTimer) clearTimeout(buildTimer);

  buildTimer = setTimeout(() => {
    buildTimer = undefined;
    runBuild();
  }, BUILD_DEBOUNCE_MS);
}

function runBuild() {
  if (buildProc) {
    buildQueued = true;
    return;
  }

  buildQueued = false;
  const proc = spawn(["bun", "run", "build"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  buildProc = proc;

  proc.exited.then((exitCode) => {
    buildProc = undefined;

    if (exitCode === 0) notifyClients();
    else console.error(`  build failed with exit code ${exitCode}`);

    if (buildQueued) runBuild();
  });
}

runBuild();

watch(SRC, { recursive: true }, () => queueBuild());
watch(BLOGS, { recursive: true }, () => queueBuild());
watch(".", { recursive: false }, (_event, filename) => {
  if (!filename) return;
  if (!ROOT_BUILD_INPUTS.has(filename.toString())) return;

  queueBuild();
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
      message() {},
      close(ws) {
        clients.delete(ws);
      },
    },
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/__reload" && req.headers.get("upgrade") === "websocket") {
        if (server.upgrade(req)) return;

        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      const path = url.pathname === "/" ? "/index.html" : url.pathname;
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

  console.log(`  dev server at http://localhost:${port}`);

  process.on("SIGINT", () => {
    buildProc?.kill();
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
