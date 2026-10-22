// http module: URL parsing, method checks, a query-based API, streaming a file, and server events
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3100;
let served = 0;

const converters = {
  "c-f": v => v * 9 / 5 + 32,
  "f-c": v => (v - 32) * 5 / 9,
  "km-mi": v => v * 0.621371,
  "mi-km": v => v / 0.621371,
  "kg-lb": v => v * 2.20462,
  "lb-kg": v => v / 2.20462
};

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    return res.end("Only GET is supported");
  }

  switch (url.pathname) {
    case "/":
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(`
        <h1>Node http server</h1>
        <ul>
          <li><a href="/convert?type=c-f&value=37">/convert?type=c-f&value=37</a></li>
          <li><a href="/convert?type=km-mi&value=10">/convert?type=km-mi&value=10</a></li>
          <li><a href="/notes">/notes</a> (file streamed from disk)</li>
          <li><a href="/stats">/stats</a></li>
        </ul>`);

    case "/convert": {
      const type = url.searchParams.get("type");
      const value = Number(url.searchParams.get("value"));
      if (!converters[type]) return json(res, 400, { error: `type must be one of ${Object.keys(converters).join(", ")}` });
      if (Number.isNaN(value)) return json(res, 400, { error: "value must be a number" });
      return json(res, 200, { type, input: value, result: +converters[type](value).toFixed(3) });
    }

    case "/notes": {
      const stream = fs.createReadStream(path.join(__dirname, "data", "notes.txt"));
      stream.on("open", () => res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }));
      stream.on("error", () => json(res, 500, { error: "Could not read notes file" }));
      return stream.pipe(res);
    }

    case "/stats":
      return json(res, 200, { requestsServed: served, uptimeSeconds: Math.round(process.uptime()) });

    default:
      return json(res, 404, { error: `Nothing at ${url.pathname}` });
  }
});

// Server events
server.on("request", () => served++);
server.on("listening", () => console.log(`Listening on http://localhost:${PORT}`));
server.on("error", err => console.error("Server error:", err.message));

server.listen(PORT);
