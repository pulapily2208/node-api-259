// Shared compact pagination helper for EJS views
// Returns array of page numbers and '...' placeholders

function buildCompactPagination(totalPages, currentPage) {
  const list = [];
  if (!totalPages || totalPages < 1) return list;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) list.push(i);
    return list;
  }

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const cur = clamp(Number(currentPage) || 1, 1, totalPages);

  // always include first page
  list.push(1);

  // left gap
  const leftStart = Math.max(2, cur - 1);
  if (leftStart > 2) list.push('...');

  // middle block
  const midStart = Math.max(2, cur - 1);
  const midEnd = Math.min(totalPages - 1, cur + 1);
  for (let i = midStart; i <= midEnd; i++) list.push(i);

  // right gap
  const rightEnd = Math.min(totalPages - 1, cur + 1);
  if (rightEnd < totalPages - 1) list.push('...');

  // always include last page
  if (totalPages > 1) list.push(totalPages);

  return list;
}

module.exports = { buildCompactPagination };
