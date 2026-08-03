export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Helper para construir una respuesta paginada a partir de un skip/take de TypeORM. */
export function toPaginated<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return {
    items,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
    },
  };
}
