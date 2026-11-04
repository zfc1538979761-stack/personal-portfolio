export function preloadChapterImage(
  src: string,
  signal: AbortSignal,
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let done = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      image.onload = image.onerror = null;
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    const abort = () => finish(new DOMException("Aborted", "AbortError"));
    const loaded = () => {
      void image.decode().catch(() => {}).then(() => {
        finish(image.naturalWidth ? undefined : new Error("照片加载失败"));
      });
    };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish(new Error("照片加载超时")), timeoutMs);
    image.onload = loaded;
    image.onerror = () => finish(new Error("照片加载失败"));
    image.src = src;
    if (image.complete && image.naturalWidth) loaded();
  });
}
