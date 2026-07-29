const PACING_DELAY_MS = 150

/** Runs `fn` over `items` with at most `limit` requests in flight at once,
 * with a small pacing gap between dispatches. The GenLayer RPC caps
 * `gen_call` throughput tightly enough that even fully-sequential
 * (limit: 1) reads with no gap can trip it under load - a plain
 * `Promise.all` over every engagement id fails far sooner. Individual reads
 * also retry on rate-limit errors (see lib/retry.ts); this pacing exists to
 * make hitting that limit in the first place less likely. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const current = next++
      if (current > 0) await new Promise((resolve) => setTimeout(resolve, PACING_DELAY_MS))
      results[current] = await fn(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
