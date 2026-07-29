/** Runs `fn` over `items` with at most `limit` requests in flight at once.
 * The GenLayer RPC caps concurrent `gen_call` requests - a plain
 * `Promise.all` over every engagement id starts failing once there are
 * more than a handful, so every list-of-engagements fetch in the app goes
 * through this instead of firing them all at the same time. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const current = next++
      results[current] = await fn(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
