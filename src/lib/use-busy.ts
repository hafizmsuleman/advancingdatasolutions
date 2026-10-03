import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBusy } from "./booking.functions";
import type { Busy } from "./slots";

const EMPTY: Busy[] = [];

/**
 * Busy intervals + the server's clock: fresh read each time the picker opens, reused ≤60s.
 * Slots must only be generated once `ready` is true, and with `now` (server-aligned, ticking),
 * so the browser applies exactly the same inputs as the server's re-check.
 */
export function useBusy(excludeToken?: string) {
  const fn = useServerFn(getBusy);
  const q = useQuery({
    queryKey: ["busy", excludeToken ?? ""],
    queryFn: async () => {
      const r = await fn({ data: excludeToken ? { excludeToken } : {} });
      return { ...r, skew: r.serverNow - Date.now() };
    },
    staleTime: 60_000,
    gcTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60_000,
  });
  const skew = q.data?.skew ?? 0;
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  // 30s ahead of the server (covers the 15s tick) so the browser is never looser than the re-check;
  // rounded to 15s so memoised slot lists don't recompute every render.
  const now = Math.ceil((tick + skew + 30_000) / 15_000) * 15_000;
  return { busy: q.data?.busy ?? EMPTY, teamTz: q.data?.teamTz, rules: q.data?.rules, loading: !q.data, ready: !!q.data, now };
}
