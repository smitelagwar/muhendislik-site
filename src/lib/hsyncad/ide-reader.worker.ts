import { parseIde10 } from "./ide-import";
import { parseIdeProjectSnapshot } from "./ide-export";

self.onmessage = async (event: MessageEvent<{ buffer: ArrayBuffer; filename: string }>) => {
  try {
    self.postMessage({ phase: "Proje kayıtları ve katlar okunuyor…" });
    const project = /\.hsyncad$/i.test(event.data.filename) ? parseIdeProjectSnapshot(new TextDecoder().decode(event.data.buffer)) : parseIde10(event.data.buffer, event.data.filename);
    self.postMessage({ project });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "IDE projesi okunamadı." });
  }
};
