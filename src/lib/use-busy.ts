import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBusy } from "./booking.functions";
import type { Busy } from "./slots";

const EMPTY: Busy[] = [];

/** Busy intervals: fresh read each time the picker opens, reused ≤60s while switching dates. */
export function useBusy(excludeToken?: string) {
  const fn = useServerFn(getBusy);
  const q = useQuery({
    queryKey: ["busy", excludeToken ?? ""],
    queryFn: () => fn({ data: excludeToken ? { excludeToken } : {} }),
    staleTime: 60_000,
    gcTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60_000,
  });
  return { busy: q.data ?? EMPTY, loading: q.isLoading };
}
