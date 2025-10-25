const path = require('path');
const url = require('url');

const app = require(path.join(__dirname, '..', 'backend', 'server'));

module.exports = (req, res) => {
  const parsed = url.parse(req.url, true);
  const slugRaw = parsed.query?.slug || '';
  const slugValue = Array.isArray(slugRaw) ? slugRaw.join('/') : slugRaw;
  const cleanedSlug = slugValue ? decodeURIComponent(slugValue).replace(/^\/+/, '') : '';

  const restQuery = { ...parsed.query };
  delete restQuery.slug;
  const search = new URLSearchParams(restQuery);
  const queryString = search.toString();

  const nextPath = `/api${cleanedSlug ? `/${cleanedSlug}` : ''}`;
  const nextUrl = queryString ? `${nextPath}?${queryString}` : nextPath;

  req.url = nextUrl;
  req.originalUrl = nextUrl;

  return app(req, res);
};
