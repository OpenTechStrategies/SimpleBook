const puppeteer = require('puppeteer')
const fs = require('fs')
const PDFMerger = require('pdf-merger-js')
const PdfPrinter = require('pdfmake')
const { program } = require('commander')
const { getPageLength, formatTitle, loadCookieJar, fonts } = require('./util.js')
const { generateToc } = require('./toc.js')

program.version('0.0.1')

program
  .command('pdf [urls]')
  .description('creates a pdf consisting of the combined urls (comma separated)')
  .option('--cookie-jar [path]', 'Path to cookies jar')
  .option('--cookie-json [path]', 'Path to cookies json file')
  .option('--title[title]', 'Title of book')
  .option('--out [file]', 'name of output file')
  .action(async (urls, options) => {
    const browser = await puppeteer.launch(
      { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    )
    const merger = new PDFMerger()
    const toMerge = []
    const cleanup = []
    const toc = []
    const title = options.title || 'Proposal Book'
    let cookies

    if (typeof options.cookieJson !== 'undefined') {
      cookies = JSON.parse(fs.readFileSync(options.cookieJson))
    } else if (typeof options.cookieJar !== 'undefined') {
      cookies = loadCookieJar(options.cookieJar)
    }

    // Parse each page into it's own into a pdf file
    for (const [i, url] of urls.split(',').entries()) {
      const filename = `./${i}.pdf`
      const titleFilename = `title-${i}.pdf`
      const name = formatTitle(new URL(url).pathname.split('/').slice(-1).pop())
      const page = await browser.newPage()

      // Set cookies if given any
      if (typeof cookies !== 'undefined') {
        for (const cookie of cookies) {
          await page.setCookie(cookie)
        }
      }

      await page.goto(url, { waitUntil: 'networkidle2' })
      await page.pdf({ path: filename, format: 'A4' })

      // Generate title page for this url
      const separatorScaffold = {
        content: [
          {
            stack: [
              name,
              { text: `Proposal #${i}`, style: 'subheader' }
            ],
            style: 'header'
          }

        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 50, 0, 80]
          },
          subheader: {
            fontSize: 14
          }
        }
      }

      const printer = new PdfPrinter(fonts)
      const pdfDoc = printer.createPdfKitDocument(separatorScaffold)
      const stream = pdfDoc.pipe(fs.createWriteStream(titleFilename))
      pdfDoc.end()
      await new Promise((resolve) => stream.on('finish', resolve))

      // Collect add this book to table of contents
      toc.push({ name: name, pages: getPageLength(filename) })

      toMerge.push(titleFilename)
      toMerge.push(filename)
      cleanup.push(titleFilename)
      cleanup.push(filename)
    }
    // Generate table of contents page
    await generateToc(title, toc)

    toMerge.unshift(`toc-${title}.pdf`)
    cleanup.push(`toc-${title}.pdf`)

    // Merge new pdfs into single file
    for (const filename of toMerge) {
      merger.add(filename)
    }
    await merger.save(options.out || 'merged.pdf')

    // Cleanup old pdfs and shut down
    cleanup.map((fn) => { return fs.unlinkSync(fn) })
    browser.close()
  })

program.parseAsync(process.argv)
