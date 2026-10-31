/** World-space surface UVs: a metre of masonry remains a metre after rotation. */
export function surfaceUvs(positions: readonly number[], tileWidth: number, tileHeight: number): Float32Array {
  if (positions.length % 9 || !Number.isFinite(tileWidth) || !Number.isFinite(tileHeight) || tileWidth <= 0 || tileHeight <= 0) throw new Error("Invalid surface dimensions");
  const result = new Float32Array(positions.length / 3 * 2);
  for (let at = 0; at < positions.length; at += 9) {
    const ux = positions[at + 3] - positions[at], uy = positions[at + 4] - positions[at + 1], uz = positions[at + 5] - positions[at + 2];
    const vx = positions[at + 6] - positions[at], vy = positions[at + 7] - positions[at + 1], vz = positions[at + 8] - positions[at + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, horizontal = Math.hypot(nx, nz);
    // Vertical walls use a horizontal tangent rather than dominant X/Z, so
    // diagonal walls do not stretch the brick courses. Caps use world X/Z.
    const vertical = horizontal > Math.abs(ny) * 2 && horizontal > 1e-12;
    for (let vertex = 0; vertex < 3; vertex++) {
      const p = at + vertex * 3, uv = p / 3 * 2;
      result[uv] = (vertical ? (positions[p] * nz - positions[p + 2] * nx) / horizontal : positions[p]) / tileWidth;
      result[uv + 1] = (vertical ? positions[p + 1] : positions[p + 2]) / tileHeight;
    }
  }
  return result;
}
