const PdfPrinter = require('pdfmake')
const fs = require('fs')
const { fonts } = require('./util.js')

/**
 * Generates a table of contents given an array of js objects describing pdf files (title, numPages)
 * @param {String} title
 * @param {Array[Object]} pdfs
 */
async function generateToc (title, subtitle, pdfs) {
  // playground requires you to assign document definition to a variable called dd

  let currentPage = 1
  const tocList = []
  for (const o of pdfs) {
    const title = o.name
    const pageNumber = await o.pages
    const margin = [5, 0]
    tocList.push({
      columns: [
        { text: title, alignment: 'left', width: '95%' },
        { text: currentPage, alignment: 'right', width: '5%' }
      ],
      style: 'toc',
      margin: margin
    })
    currentPage += (Number(pageNumber) + 1)
  }

  const tocScaffold = {
    content: [
      {
        stack: [
          title,
          { text: subtitle, style: 'subheader' }
        ],
        style: 'header'
      },
      ...tocList
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
      },
      toc: {
        fontSize: 10,
        margin: [15, 0, 15, 0]
      }
    }
  }

  const printer = new PdfPrinter(fonts)

  const pdfDoc = printer.createPdfKitDocument(tocScaffold)
  const stream = pdfDoc.pipe(fs.createWriteStream(`toc-${title}.pdf`))
  pdfDoc.end()
  await new Promise((resolve) => stream.on('finish', resolve))
}

module.exports = { generateToc }
