const puppeteer = require('puppeteer')
const fs = require('fs')
const PDFMerger = require('pdf-merger-js')
const { program } = require('commander')
const { CookieMap } = require('cookiefile')
program.version('0.0.1')

function loadCookieJar (cookieFile) {
  const cookies = new CookieMap(cookieFile)
  const cookieList = []
  for (const cookie of cookies.values()) {
    cookieList.push({
      name: cookie.cookieName,
      domain: `${cookie.domain}/`,
      path: cookie.path,
      value: cookie.value,
      httpOnly: cookie.httpOnly
    })
  }

  return cookieList
}

program
  .command('pdf [urls]')
  .description('creates a pdf consisting of the combined urls (comma separated)')
  .option('--cookie-jar [path]', 'Path to cookies jar')
  .option('--cookie-json [path]', 'Path to cookies json file')
  .action(async (urls, options) => {
    const browser = await puppeteer.launch()
    const merger = new PDFMerger()
    let cookies

    if (typeof options.cookieJson !== 'undefined') {
      cookies = JSON.parse(fs.readFileSync(options.cookieJson))
    } else if (typeof options.cookieJar !== 'undefined') {
      cookies = loadCookieJar(options.cookieJar)
    }

    // Parse each page into it's own into a pdf file
    for (const [i, url] of urls.split(',').entries()) {
      const filename = `./${i}.pdf`
      const page = await browser.newPage()
      if (typeof cookies !== 'undefined') {
        for (const cookie of cookies) {
          await page.setCookie(cookie)
        }
      }

      await page.goto(url, { waitUntil: 'networkidle2' })
      await page.pdf({ path: filename, format: 'A4' })
      merger.add(filename)
    }

    // Merge new pdfs into single file
    await merger.save('merged.pdf')
  })

program.parse(process.argv)
