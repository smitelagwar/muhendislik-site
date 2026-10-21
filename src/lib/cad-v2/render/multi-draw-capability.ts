const multiDrawSupportCacheKey = Symbol.for("cad-v2.render.multi-draw-support-by-context");
const sharedGlobalRegistry = globalThis as typeof globalThis & Record<PropertyKey, unknown>;

/**
 * Next.js can include this small module in more than one client bundle. Keep the
 * context cache on the page global so those module copies share one capability
 * query for each WebGL context.
 */
function getMultiDrawSupportCache(): WeakMap<WebGL2RenderingContext, boolean> {
  const existing = sharedGlobalRegistry[multiDrawSupportCacheKey] as
    | WeakMap<WebGL2RenderingContext, boolean>
    | undefined;
  if (existing) return existing;

  const created = new WeakMap<WebGL2RenderingContext, boolean>();
  Object.defineProperty(sharedGlobalRegistry, multiDrawSupportCacheKey, {
    value: created,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return created;
}

const multiDrawSupportByContext = getMultiDrawSupportCache();

export function supportsCadV2MultiDraw(context: WebGL2RenderingContext): boolean {
  const cached = multiDrawSupportByContext.get(context);
  if (cached !== undefined) return cached;

  // Three.js owns and caches the extension object through its private
  // WebGLExtensions manager. Calling getExtension here bypasses that cache and
  // makes the same WebGL context ask the driver twice. Inspect the advertised
  // names; Three.js performs the sole getExtension lookup when it needs the API.
  const supported = context.getSupportedExtensions()?.includes("WEBGL_multi_draw") ?? false;
  multiDrawSupportByContext.set(context, supported);
  return supported;
}
