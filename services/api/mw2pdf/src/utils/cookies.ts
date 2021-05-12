import { Response } from 'node-fetch'

/**
 * An interface that describes the structure of a
 * parsed cookie.
 */
export interface ParsedCookie {
  name: string
  value: string
  domain: string
}

/**
 *
 * Parse cookies for a particular domain from a fetch response.
 *
 * @param domain The domain of the cookies.
 * @param response A [[Response]] from which to harvest cookies of the `domain` domain.
 */
export function parseCookies(domain: string, response: Response): Array<ParsedCookie>  {
  const raw = response.headers.raw()['set-cookie']
  return raw.map((entry) => {
    const [cookie] = entry.split(';')
    const [name, value] = cookie.split('=')
    return { name, value, domain }
  })
}

/**
 *
 * Serialize array of parsed cookies into a string.
 *
 * @param cookies An array of [[ParsedCookie]]s from which to create a string.
 */
export function toCookieString(cookies: Array<ParsedCookie>): string {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join(';')
}
