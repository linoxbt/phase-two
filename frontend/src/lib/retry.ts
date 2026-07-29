/** Retries a read on rate-limit errors specifically, with exponential
 * backoff. The Asimov RPC's `gen_call` rate limit is tight enough that even
 * fully-sequential reads can trip it under load - this is the safety net so
 * a transient throttle surfaces as a slightly slower load, not a hard error. */
export async function withRetry<T>(fn: () => Promise<T>, retries = 4, baseDelayMs = 700): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      const isRateLimit = /rate limit/i.test(err?.message ?? '')
      if (!isRateLimit || attempt === retries) throw err
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt))
    }
  }
  throw lastError
}
