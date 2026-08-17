export function normalizePagination(page?: number, limit?: number) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function paginatedResult<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
