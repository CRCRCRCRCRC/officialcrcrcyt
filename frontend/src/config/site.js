const configuredSiteUrl = typeof __SITE_URL__ === 'string' ? __SITE_URL__ : ''
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''

export const SITE_URL = (configuredSiteUrl || runtimeOrigin).replace(/\/+$/, '')

export const toAbsoluteSiteUrl = (value = '/') => {
  const target = String(value || '/')
  if (/^https?:\/\//i.test(target)) return target
  return `${SITE_URL}${target.startsWith('/') ? target : `/${target}`}`
}
