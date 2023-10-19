//Phase 10
const paginator = (req, res, next) => {
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.size);
  if(page === undefined || isNaN(page)) {
    page = 1;
  }
  if(limit === undefined || isNaN(limit)) {
    limit = 10
  }
  let offset;
  if(page === 0 && limit === 0) {
    limit = null;
    offset = 0;
    page = 1;
  } else if(page > 0 || limit > 0) {
    if(page === 0) page = 1
    offset = limit * (page - 1);
  }
  req.limit = limit;
  req.offset = offset;
  req.page = page;
  next();
}

module.exports = {
  paginator
};
