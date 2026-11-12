/** The standard normal's cumulative distribution, through Abramowitz and Stegun's 7.1.26 for the error function. */
function normal(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const polynomial =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - polynomial * Math.exp(-z * z);
  return 0.5 * (1 + Math.sign(x) * erf);
}

/**
 * How strong a fade is at `away` from its line: a stroke twice the depth wide at the strength, under a
 * Gaussian blur of half the depth.
 */
export function fadedAt(strength: number, depth: number, away: number): number {
  const sigma = depth / 2;
  return strength * (normal((depth - away) / sigma) - normal((-depth - away) / sigma));
}

/** A squared distance no pixel of a picture lies at. */
const FAR = 1e20;

/**
 * Felzenszwalb and Huttenlocher's squared distance transform of one line of `count` cells, from
 * `costs` into `out`, through the scratch `hulls` and `bounds`.
 */
function squaredAlong(
  costs: Float64Array,
  count: number,
  out: Float64Array,
  hulls: Int32Array,
  bounds: Float64Array,
): void {
  const meet = (q: number, p: number): number =>
    (costs[q] + q * q - (costs[p] + p * p)) / (2 * q - 2 * p);
  let k = 0;
  hulls[0] = 0;
  bounds[0] = -Infinity;
  bounds[1] = Infinity;
  for (let q = 1; q < count; q++) {
    let s = meet(q, hulls[k]);
    while (s <= bounds[k]) {
      k--;
      s = meet(q, hulls[k]);
    }
    k++;
    hulls[k] = q;
    bounds[k] = s;
    bounds[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < count; q++) {
    while (bounds[k + 1] < q) k++;
    out[q] = (q - hulls[k]) ** 2 + costs[hulls[k]];
  }
}

/**
 * How far each pixel of a picture lies outside its outline, in pixels: nought on the picture, which
 * holds every pixel its alpha, out of 255, has from half up.
 */
function outlineDistances(alpha: ArrayLike<number>, width: number, height: number): Float64Array {
  const grid = new Float64Array(width * height);
  for (let at = 0; at < grid.length; at++) grid[at] = alpha[at] >= 128 ? 0 : FAR;
  const longest = Math.max(width, height);
  const costs = new Float64Array(longest);
  const out = new Float64Array(longest);
  const hulls = new Int32Array(longest);
  const bounds = new Float64Array(longest + 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) costs[y] = grid[y * width + x];
    squaredAlong(costs, height, out, hulls, bounds);
    for (let y = 0; y < height; y++) grid[y * width + x] = out[y];
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) costs[x] = grid[y * width + x];
    squaredAlong(costs, width, out, hulls, bounds);
    for (let x = 0; x < width; x++) grid[y * width + x] = out[x];
  }
  return grid.map((squared) => Math.max(0, Math.sqrt(squared) - 0.5));
}

/**
 * How strong a halo laid round a picture stands on each of its pixels: the fade at the pixel's
 * distance outside the picture's outline, the picture's own pixels at its outline's, and nothing past
 * two and a half depths. `depth` is in pixels.
 */
export function haloOf(
  alpha: ArrayLike<number>,
  width: number,
  height: number,
  strength: number,
  depth: number,
): Float64Array {
  return outlineDistances(alpha, width, height).map((away) =>
    away > 2.5 * depth ? 0 : fadedAt(strength, depth, away),
  );
}

/** How much of each pixel of a picture its outline grown `by` pixels outward covers, out of one. */
export function grownOf(
  alpha: ArrayLike<number>,
  width: number,
  height: number,
  by: number,
): Float64Array {
  return outlineDistances(alpha, width, height).map((away) =>
    Math.min(1, Math.max(0, by + 0.5 - away)),
  );
}
