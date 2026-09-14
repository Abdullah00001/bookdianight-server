import { Request } from 'express';

export const buildPaginationLinks = (
  req: Request,
  page: number,
  totalPages: number
) => {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;
  const query = req.query as Record<string, any>;
  
  const createLink = (p: number) => {
    const newQuery = new URLSearchParams({
      ...query,
      page: p.toString()
    });
    return `${baseUrl}?${newQuery.toString()}`;
  };

  return {
    currentPage: createLink(page),
    nextPage: page < totalPages ? createLink(page + 1) : null,
    previousPage: page > 1 ? createLink(page - 1) : null,
    firstPage: createLink(1),
    lastPage: createLink(totalPages || 1)
  };
};
