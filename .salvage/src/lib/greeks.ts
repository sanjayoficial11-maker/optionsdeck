// Black-Scholes pricing + Greeks for European options.
// All rates and IVs are decimals (0.06 = 6%). Time in years.

const SQRT2 = Math.SQRT2;
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
export const cdf = (x: number) => 0.5 * (1 + erf(x / SQRT2));
export const pdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

export type OptType = "CE" | "PE";

export interface BSInput {
  S: number; K: number; T: number; r: number; iv: number; type: OptType; q?: number;
}

export function bsPrice({ S, K, T, r, iv, type, q = 0 }: BSInput): number {
  if (T <= 0 || iv <= 0) {
    const intrinsic = type === "CE" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return intrinsic;
  }
  const d1 = (Math.log(S / K) + (r - q + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
  const d2 = d1 - iv * Math.sqrt(T);
  if (type === "CE") return S * Math.exp(-q * T) * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
  return K * Math.exp(-r * T) * cdf(-d2) - S * Math.exp(-q * T) * cdf(-d1);
}

export interface Greeks { delta: number; gamma: number; theta: number; vega: number; rho: number; }

export function bsGreeks({ S, K, T, r, iv, type, q = 0 }: BSInput): Greeks {
  if (T <= 0 || iv <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * iv * iv) * T) / (iv * sqrtT);
  const d2 = d1 - iv * sqrtT;
  const nd1 = pdf(d1);
  const eqt = Math.exp(-q * T);
  const ert = Math.exp(-r * T);
  const delta = type === "CE" ? eqt * cdf(d1) : eqt * (cdf(d1) - 1);
  const gamma = (eqt * nd1) / (S * iv * sqrtT);
  const vega = (S * eqt * nd1 * sqrtT) / 100; // per 1% IV
  const rho =
    type === "CE"
      ? (K * T * ert * cdf(d2)) / 100
      : (-K * T * ert * cdf(-d2)) / 100;
  const thetaAnnual =
    type === "CE"
      ? (-S * eqt * nd1 * iv) / (2 * sqrtT) - r * K * ert * cdf(d2) + q * S * eqt * cdf(d1)
      : (-S * eqt * nd1 * iv) / (2 * sqrtT) + r * K * ert * cdf(-d2) - q * S * eqt * cdf(-d1);
  const theta = thetaAnnual / 365;
  return { delta, gamma, theta, vega, rho };
}

// Newton-Raphson implied vol from market price.
export function impliedVol(price: number, base: Omit<BSInput, "iv">): number {
  let iv = 0.3;
  for (let i = 0; i < 40; i++) {
    const p = bsPrice({ ...base, iv });
    const v = bsGreeks({ ...base, iv }).vega * 100; // dPrice/dIV(decimal)
    const diff = p - price;
    if (Math.abs(diff) < 1e-4) return iv;
    if (v < 1e-8) break;
    iv -= diff / v;
    if (iv < 0.005) iv = 0.005;
    if (iv > 5) iv = 5;
  }
  return iv;
}
