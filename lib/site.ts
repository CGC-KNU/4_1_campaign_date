const FALLBACK_SITE_URL = 'https://blank-idelle-coggiri-1527fb3e.koyeb.app/'

function normalizeSiteUrl(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL
)

export function getCanonicalUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}
