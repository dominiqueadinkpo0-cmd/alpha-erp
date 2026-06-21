const pagination = (req, res, next) => {
  let { page = 1, limit = 20 } = req.query;

  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (Array.isArray(data)) {
      const total = parseInt(res.getHeader('X-Total-Count')) || data.length;
      const totalPages = Math.ceil(total / limit);

      return originalJson({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    }
    return originalJson(data);
  };

  next();
};

module.exports = pagination;
