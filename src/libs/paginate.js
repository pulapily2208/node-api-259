module.exports = async (page, limit, query, model) => {
  const docs = await model.find(query).countDocuments();
  const total = Math.ceil(docs / limit);
  const next = page + 1;
  const prev = page - 1;
  const hasNext = next > total ? false : true;
  const hasPrev = prev <= 0 ? false : true;

  return {
    page,
    limit,
    total,
    next,
    prev,
    hasNext,
    hasPrev,
  };
};
