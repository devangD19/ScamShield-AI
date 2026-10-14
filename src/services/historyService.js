import { ApiError, request } from './api.js';

/**
 * History API
 *
 * GET    /api/v1/history
 * GET    /api/v1/history/{id}
 * DELETE /api/v1/history/{id}
 */

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.results)) return data.results;
  return null; // caller treats null as an invalid response
}

export async function getHistory(params = {}) {
  const query = {};
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;
  if (params.search) query.search = params.search;
  if (params.prediction) query.prediction = params.prediction;
  if (params.sort) query.sort = params.sort;

  const data = await request({ method: 'get', url: '/history', params: query });
  const items = unwrapList(data);

  if (items === null) {
    // Signal an invalid payload without inventing records.
    throw new ApiError('The history service returned an unexpected response format.', {
      kind: 'invalid',
      details: data,
    });
  }

  return { items, meta: data?.meta ?? data?.pagination ?? null };
}

export async function getHistoryDetail(id) {
  if (!id) throw new Error('A history id is required.');
  const data = await request({ method: 'get', url: `/history/${encodeURIComponent(id)}` });
  // Detail endpoints sometimes wrap the record; unwrap defensively.
  return data?.analysis ?? data?.record ?? data?.item ?? data;
}

export async function deleteHistory(id) {
  if (!id) throw new Error('A history id is required.');
  const data = await request({
    method: 'delete',
    url: `/history/${encodeURIComponent(id)}`,
  });
  return data;
}
