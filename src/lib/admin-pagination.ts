/** Supabase caps each response: read every page with a stable query order. */
export async function fetchAllRows<T>(
  load: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
) {
  const data: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const result = await load(from, from + size - 1);
    if (result.error) throw new Error(result.error.message);
    const rows = result.data ?? [];
    data.push(...rows);
    if (rows.length < size) return { data, error: null };
  }
}
