import puppeteer from 'puppeteer'
import {
  PdfGenerator
} from './PdfGenerator'
import {
  makeLoginRequest,
  makeLoginTokenRequest,
  extractLoginToken,
} from '../utils/mediaWiki'
import {
  parseCookies,
  toCookieString,
} from '../utils/cookies'
import {
  deletePdfs,
} from '../utils/files'

export class MediaWikiSession {

  cookies: any;

  constructor(settings?: any) {
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

  async makePdf(url, tmpDirectory = './', includeTitlePage = false) {
    const pdfGenerator = new PdfGenerator(tmpDirectory)
    const browser = await puppeteer.launch(
      { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    )
    const page = await browser.newPage()
    const { host: domain } = new URL(url)
    await page.setCookie(...this.getCookies(domain))
    await page.goto(url, { waitUntil: 'networkidle2' })
    const pageTitle = await page.title()
    const pagePdf = pdfGenerator
      .generatePdfObject({ title: pageTitle })
    await page.pdf({ path: pagePdf.path, format: 'A4' })
    await browser.close()
    if (includeTitlePage === true) {
      const titlePdf = await pdfGenerator
        .generateTitlePagePdf(pageTitle)
      const mergedPdf = await pdfGenerator
        .generateMergedPdf(
          [titlePdf, pagePdf],
          pdfGenerator.generatePdfObject({ title: pageTitle }),
        )
      await deletePdfs([titlePdf, pagePdf])
      return mergedPdf
    }
    return pagePdf
  }

  async makePdfBooklet(urls, tmpDirectory = './') {
    const pdfGenerator = new PdfGenerator(tmpDirectory)
    // Generate temporary pdfs for each URL
    const pagePdfs = await Promise.all(
      urls.map(async (url) => this.makePdf(url, tmpDirectory, true)),
    )

    // Merge the pdf pages
    const mergedPagesPdf = await pdfGenerator
      .generateMergedPdf(pagePdfs)

    // Add page numbers
    const numberedPagesPdf = await pdfGenerator
      .generatePdfWithPageNumbers(mergedPagesPdf)

    // Generate the table of contents
    const tableOfContentsPdf = await pdfGenerator
      .generateTableOfContentsPdf(pagePdfs)

    // Merge the final pdf
    const finalPdf = await pdfGenerator
      .generateMergedPdf([
        tableOfContentsPdf,
        numberedPagesPdf,
      ])

    // Clean up temporary pdfs
    await deletePdfs([
      ...pagePdfs,
      mergedPagesPdf,
      numberedPagesPdf,
      tableOfContentsPdf,
    ])

    return finalPdf
  }
}
