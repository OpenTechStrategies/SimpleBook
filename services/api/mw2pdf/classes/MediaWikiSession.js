import { v4 as uuidv4 } from 'uuid'
import puppeteer from 'puppeteer'

import {
  makeLoginRequest,
  makeLoginTokenRequest,
  extractLoginToken,
} from '../utils/mediaWiki.js'

import {
  parseCookies,
  toCookieString,
} from '../utils/cookies.js'

export class MediaWikiSession {
  constructor(settings) {
  	this.cookies = {}
  }

  isAuthenticated(domain) { return (domain in this.cookies) }

  /**
   * Remove any stored authentication cookies.
   */
  resetAuthentication() { this.cookies = {} }

  getCookies(domain) { return this.cookies[domain] ?? [] }

  setCookies(domain, cookies) { this.cookies[domain] = cookies }

  /**
   * Authenticate against a given api URL.
   * If the authentication has already occurred for a given domain, this will NOT re-authenticate.
   */
  async authenticate(username, password, apiUrl) {
  	const { host: domain } = new URL(apiUrl)
  	if (this.isAuthenticated(domain)) {
  		return true
  	}

    // Step 1: Generate a login token
    const loginTokenRequest = await makeLoginTokenRequest(apiUrl)
    const authCookies = parseCookies(domain, loginTokenRequest)
    const loginToken = await extractLoginToken(loginTokenRequest)

    // Step 2: Perform the login
    const loginRequest = await makeLoginRequest({
      apiUrl,
      username,
      password,
      loginToken,
      cookies: authCookies,
    })
    this.setCookies(
    	domain,
    	parseCookies(domain, loginRequest),
    )
    return true
  }

  async generatePdf(url, tmpDirectory = './') {
    const browser = await puppeteer.launch(
      { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    )
    const page = await browser.newPage()
    const pdfPath = `${tmpDirectory}${uuidv4()}.pdf`
  	const { host: domain } = new URL(url)
    await page.setCookie(...this.getCookies(domain))
    await page.goto(url, { waitUntil: 'networkidle2' })
    await page.pdf({ path: pdfPath, format: 'A4' })
    await browser.close()
    return pdfPath
  }
}
