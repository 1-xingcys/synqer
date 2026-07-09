/**
 * Paginate a list of events into a single page slice.
 */
export function paginateEvents<T>(
  events: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number; totalItems: number } {
  const totalItems = events.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const items = events.slice(startIndex, startIndex + pageSize);

  return { items, totalPages, totalItems };
}
