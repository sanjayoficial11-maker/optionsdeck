import { useMemo } from "react";
import { type Underlying, INSTRUMENTS, buildChain, nextExpiries, type Expiry, type OptionRow } from "@/lib/optionChain";

// Static spot — no live ticks, no flicker. Swap in a real feed later.
export function useSpot(sym: Underlying) {
  return INSTRUMENTS[sym].spot;
}

export function useChain(sym: Underlying, expiry: Expiry | null): { spot: number; rows: OptionRow[] } {
  const spot = useSpot(sym);
  const rows = useMemo(
    () => (expiry ? buildChain(INSTRUMENTS[sym], spot, expiry) : []),
    [sym, spot, expiry],
  );
  return { spot, rows };
}

export function useExpiries(sym: Underlying) {
  return useMemo<Expiry[]>(() => nextExpiries(6, sym !== "MIDCPNIFTY"), [sym]);
}

