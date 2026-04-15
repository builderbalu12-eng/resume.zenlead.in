import * as React from "react";

interface SimhaCLIStreamProps {
  /** Full SSE URL e.g. /api/portfolio/stream/{job_id} */
  url: string;
  /** Called with the full accumulated output when the stream ends */
  onComplete?: (fullOutput: string) => void;
  /** Called when the backend sends an event: url event with a Vercel URL */
  onUrl?: (url: string) => void;
  /** Height of the terminal window (default 200px) */
  height?: number;
}

export function SimhaCLIStream({ url, onComplete, onUrl, height = 200 }: SimhaCLIStreamProps) {
  const [lines, setLines] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fullOutputRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    setLines([]);
    setDone(false);
    fullOutputRef.current = [];

    const es = new EventSource(url);

    es.onmessage = (e) => {
      const line = e.data;
      fullOutputRef.current.push(line);
      setLines((prev) => [...prev, line]);
    };

    es.addEventListener("url", (e: MessageEvent) => {
      onUrl?.((e as MessageEvent).data);
    });

    es.addEventListener("done", () => {
      setDone(true);
      // Small delay so any url event that arrived just before done is processed first
      setTimeout(() => {
        es.close();
        onComplete?.(fullOutputRef.current.join("\n"));
      }, 200);
    });

    es.onerror = () => {
      setDone(true);
      es.close();
    };

    return () => es.close();
  }, [url]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div
      className="rounded-lg border border-border bg-black font-mono text-xs overflow-y-auto relative"
      style={{ height }}
    >
      <div className="p-3 space-y-0.5">
        {lines.length === 0 && !done && (
          <div className="text-green-400 animate-pulse">▌ Connecting to SimhaCLI…</div>
        )}
        {lines.map((line, i) => {
          const isError = line.startsWith("ERROR:");
          const isSuccess = line.includes("✓") || line.includes("Success") || line.includes("deployed");
          const color = isError
            ? "text-red-400"
            : isSuccess
            ? "text-green-400"
            : line.startsWith(">") || line.startsWith("$")
            ? "text-yellow-300"
            : "text-gray-300";
          return (
            <div key={i} className={color}>
              {line || " "}
            </div>
          );
        })}
        {done && (
          <div className="text-green-400 mt-2 font-semibold">▌ Done.</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
