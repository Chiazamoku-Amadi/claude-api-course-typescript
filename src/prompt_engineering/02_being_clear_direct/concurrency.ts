// Mirrors Python's ThreadPoolExecutor(max_workers=N): keeps up to `limit` tasks in flight at all times, pulling the next item as soon as one finishes, rather than waiting for a whole batch to complete.
export const mapWithConcurrencyLimit = async <T, R>(
  items: T[],
  limit: number, // concurrency limit
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const item = items[currentIndex]!;
      results[currentIndex] = await fn(item);
    }
  };

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return results;
};
