const pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')
const fs = require('fs')
const path = require('path')
const { CookieMap } = require('cookiefile')

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
async function getPageLength (filename) {
  const data = fs.readFileSync(filename)
  const loadingTask = pdfjsLib.getDocument(data)

  const pdf = await loadingTask.promise
  return pdf.numPages
}

/**
 * Formats urlencoded torque title into something more legible
 * @param {String} title
 */
function formatTitle (title) {
  return decodeURIComponent(title).replaceAll('_', ' ').replaceAll(/[0-9]|\(|\)/g, '')
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

module.exports = {
  fonts, getPageLength, formatTitle, loadCookieJar
}
