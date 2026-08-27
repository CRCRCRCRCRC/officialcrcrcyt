const DEFAULT_SITE_URL = 'https://justawebsiteofficial.vercel.app';

const toSiteOrigin = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  const candidate = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.origin;
  } catch {
    return '';
  }
};

const getSiteUrl = (env = process.env) =>
  toSiteOrigin(env.SITE_URL) ||
  toSiteOrigin(env.VERCEL_PROJECT_PRODUCTION_URL) ||
  toSiteOrigin(env.FRONTEND_URL) ||
  DEFAULT_SITE_URL;

module.exports = {
  DEFAULT_SITE_URL,
  getSiteUrl,
  toSiteOrigin
};
