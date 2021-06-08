import fetch, { Response }  from 'node-fetch'
import { toCookieString, ParsedCookie } from './cookies'

/**
 *
 * Make a request for the login token of the MediaWiki instance
 * at `apiURL`.
 *
 * @param apiUrl The URL of the MediaWiki API
 * @returns a [[Promise]] for a [[Response]] that contains the
 * login token for the MediaWiki instance at `apiURL`.
 */
export async function makeLoginTokenRequest(apiUrl: URL): Promise<Response> {
  const loginTokenRequestParams = new URLSearchParams({
    'action': 'query',
    'meta': 'tokens',
    'format': 'json',
    'type': 'login',
  })
  const loginTokenRequestResult = await fetch(
    apiUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: loginTokenRequestParams.toString(),
    }
  )
  return loginTokenRequestResult
}

/**
 *
 * Extract the actual login token generated by a call to [[makeLoginTokenRequest]].
 *
 * @param loginTokenRequestResult The [[Response]] from a call to [[makeLoginTokenRequest]].
 * @returns a [[Promise]] that resolves to a [[string]] that is the login token.
 */
export async function extractLoginToken(loginTokenRequestResult: Response): Promise<string> {
  const { query: { tokens: { logintoken: loginToken } } } = await loginTokenRequestResult.json()
  return loginToken
}

/**
 *
 * Log in to a MediaWiki instance located at `apiURL`.
 *
 * @param apiUrl The URL of the MediaWiki instance being authenticated against.
 * @param username The username to authenticate with.
 * @param password The password that goes with the `username`.
 * @param loginToken The login token for this MediaWiki instance (generated by a call
 * to [[makeLoginTokenRequest]]).
 * @param cookies Any cookies necessary to facilitate this login request.
 */
export async function makeLoginRequest(
  apiUrl: URL,
  username: string = "",
  password: string = "",
  loginToken: string = "",
  cookies: Array<ParsedCookie> = []): Promise<Response> {
  const loginActionRequestBody = new URLSearchParams({
    format: 'json',
    action: 'clientlogin',
    username,
    password,
    loginreturnurl: 'http://google.com/',
    logintoken: loginToken,
  })
  const loginActionRequestResult = await fetch(
    apiUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'cookie': toCookieString(cookies),
      },
      body: loginActionRequestBody.toString(),
    }
  )
  return loginActionRequestResult
}

/**
 * 
 * Find the MediaWiki API URL given the MediaWiki installation's index page.
 * 
 * @param url The URL to the index page of a MediaWiki installation.
 */
export function getApiUrlFromMediaWikiUrl(url: URL): URL {
	const [baseUrl] = url.toString().split('/index.php')
	return new URL(`${baseUrl}/api.php`)
}