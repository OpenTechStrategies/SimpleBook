import fetch from 'node-fetch'
import { toCookieString } from './cookies'

export async function makeLoginTokenRequest(apiUrl) {
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

export async function extractLoginToken(loginTokenRequestResult) {
  const { query: { tokens: { logintoken: loginToken } } } = await loginTokenRequestResult.json()
  return loginToken
}

export async function makeLoginRequest({
  apiUrl = "",
  username = "",
  password = "",
  loginToken = "",
  cookies = "",
} = {}) {
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

export function getApiUrlFromMediaWikiUrl(url) {
	const [baseUrl] = url.split('/index.php')
	return `${baseUrl}/api.php`
}
