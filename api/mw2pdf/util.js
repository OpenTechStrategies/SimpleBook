const pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')
const fs = require('fs')
const path = require('path')
const { CookieMap } = require('cookiefile')
const HummusRecipe = require('hummus-recipe')

const fonts = {
  Roboto: {
    normal: path.join(__dirname, 'fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'fonts/Roboto-Medium.ttf'),
    italics: path.join(__dirname, 'fonts/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, 'fonts/Roboto-MediumItalic.ttf')
  },
  SourceCodePro: {
    normal: path.join(__dirname, 'fonts/SourceCodePro-Regular.ttf')
  }
}

/**
 * Returns the page length of the given PDF file
 * @param {String} filename
 */
async function getPdfInfo (filename) {
  const data = fs.readFileSync(filename)
  const loadingTask = pdfjsLib.getDocument(data)

  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)
  return {
    numPages: pdf.numPages,
    size: {
      width: page.view[2],
      height: page.view[3]
    }
  }
}

/**
 * Formats urlencoded torque title into something more legible
 * @param {String} title
 */
function formatTitle (title) {
  return decodeURIComponent(title)
    .replaceAll('_', ' ') // remove underscores
    .replaceAll(/[0-9]|\(|\)/g, '') // remove proposal ID
}

/**
 * Loads RFC6256 Cookie file into js object for parsing
 * https://tools.ietf.org/html/rfc6265
 * @param {Object} cookieFile
 */
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

/**
 * Adds page numbers to given pdf file. Skips first page assuming it is a table of contents
 * @param {String} inputFile - Filename of input file
 * @param {String} outputFile - Filename of output file
 */
async function addPageNumbers (inputFile, outputFile) {
  const pdfDoc = new HummusRecipe(inputFile, outputFile)
  const pdfInfo = await getPdfInfo(inputFile)
  const styles = {
    fontSize: 10,
    font: 'Times New Roman',
    color: '#000000'
  }
  for (let pageNum = 2; pageNum <= pdfInfo.numPages; pageNum++) {
    pdfDoc.editPage(pageNum)
      .text(String(pageNum - 1), 10, pdfInfo.size.height - 15, styles)
      .text(String(pageNum - 1), pdfInfo.size.width - 15, pdfInfo.size.height - 15, styles)
      .endPage()
  }
  pdfDoc.endPDF()
}

module.exports = {
  fonts, getPdfInfo, formatTitle, loadCookieJar, addPageNumbers
}
