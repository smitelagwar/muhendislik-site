export interface GeometryBufferMemoryEstimate {
  cpuResidentBytes: number;
  gpuBufferBytesEstimate: number;
  geometryCount: number;
}

/** Counts retained geometry typed arrays, attribute uploads, and typed DataTexture payloads. */
export function estimateThreeGroupBufferBytes(root: any): GeometryBufferMemoryEstimate {
  const cpuBuffers = new Set<ArrayBufferLike>();
  const gpuAttributes = new Set<object>();
  const gpuTextures = new Set<object>();
  const geometries = new Set<object>();
  let cpuResidentBytes = 0;
  let gpuBufferBytesEstimate = 0;
  const stack = [root];

  while (stack.length > 0) {
    const object = stack.pop();
    if (!object) continue;
    if (Array.isArray(object.children)) stack.push(...object.children);
    const geometry = object.geometry;
    if (!geometry || typeof geometry !== "object") continue;
    geometries.add(geometry);
    const attributes = Object.values(geometry.attributes || {}) as Array<{
      array?: ArrayBufferView;
      data?: { array?: ArrayBufferView };
    }>;
    if (geometry.index) attributes.push(geometry.index);
    for (const attribute of attributes) {
      const data = attribute?.data ?? attribute;
      const view = attribute?.array ?? data?.array;
      if (!view || !ArrayBuffer.isView(view)) continue;
      const buffer = view.buffer;
      if (!cpuBuffers.has(buffer)) {
        cpuBuffers.add(buffer);
        cpuResidentBytes += buffer.byteLength;
      }
      if (!gpuAttributes.has(data)) {
        gpuAttributes.add(data);
        gpuBufferBytesEstimate += view.byteLength;
      }
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : object.material ? [object.material] : [];
    for (const material of materials) {
      for (const uniform of Object.values(material?.uniforms ?? {}) as Array<{ value?: any }>) {
        const texture = uniform?.value;
        const textureData = texture?.image?.data;
        if (!texture?.isTexture || !ArrayBuffer.isView(textureData)) continue;
        if (!cpuBuffers.has(textureData.buffer)) {
          cpuBuffers.add(textureData.buffer);
          cpuResidentBytes += textureData.buffer.byteLength;
        }
        if (!gpuTextures.has(texture)) {
          gpuTextures.add(texture);
          gpuBufferBytesEstimate += textureData.byteLength;
        }
      }
    }
  }

  return { cpuResidentBytes, gpuBufferBytesEstimate, geometryCount: geometries.size };
}
