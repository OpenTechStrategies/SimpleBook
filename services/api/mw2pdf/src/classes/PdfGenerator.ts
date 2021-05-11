import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import PdfMerger from 'pdf-merger-js'
import PdfPrinter from 'pdfmake'
import {
  PDFDocument,
  rgb,
  StandardFonts,
} from 'pdf-lib'
import { Pdf } from './Pdf'

// The below two lines are from
// https://stackoverflow.com/questions/32705219/nodejs-accessing-file-with-relative-path/32707530#32707530
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PdfGenerator {

  directory: any;

  constructor(directory = '') {
    Object.assign(
      this,
      { directory },
    )
  }

  generatePdfPath() {
    return `${this.directory}${uuidv4()}.pdf`
  }

  generatePdfObject(options = {}) {
    return new Pdf(
      this.generatePdfPath(),
      options,
    )
  }

  async generateMergedPdf(pdfs, outPdf = this.generatePdfObject()) {
    const merger = new PdfMerger()
    pdfs.forEach(pdf => merger.add(pdf.path))
    await merger.save(outPdf.path)
    return outPdf
  }

  async generateTitlePagePdf(title, outPdf = this.generatePdfObject()) {
    const scaffold = {
      content: [
        {
          text: title,
          style: 'header',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 50, 0, 80],
        },
        subheader: {
          fontSize: 14,
        },
      },
    }
    await this.generatePdfFromScaffold(scaffold, outPdf)
    return outPdf
  }

  async generateTableOfContentsPdf(pdfs, outPdf = this.generatePdfObject()) {
    const tocItems = await pdfs.reduce(
      async (prev, pdf) => {
        const toc = await prev
        const [ previousTocItem ] = toc.slice(-1)
        let currentPageNumber = 1
        if (previousTocItem) {
          const { numPages: previousTocNumPages } = await previousTocItem.pdf.getInfo()
          currentPageNumber = previousTocItem.pageNumber + previousTocNumPages
        }
        toc.push({
          pageNumber: currentPageNumber,
          pdf,
          scaffold: {
            columns: [
              { text: pdf.title, alignment: 'left', width: '95%' },
              { text: currentPageNumber, alignment: 'right', width: '5%' },
            ],
            style: 'toc',
            margin: [5, 0]
         },
        })
        return toc
      },
      [],
    )
    const scaffold = {
      content: [
        {
          text: 'Table of Contents',
          style: 'header'
        },
        ...tocItems.map(tocItem => tocItem.scaffold)
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
    return await this.generatePdfFromScaffold(scaffold, outPdf)
  }

  async generatePdfFromScaffold(scaffold, outPdf = this.generatePdfObject()) {
    const printer = new PdfPrinter({
      Roboto: {
        normal: path.join(__dirname, '../../fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../../fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../fonts/Roboto-MediumItalic.ttf'),
      },
      SourceCodePro: {
        normal: path.join(__dirname, '../../fonts/SourceCodePro-Regular.ttf'),
      }
    })
    // TODO: what is .end doing in this block -- is it sync? does it have to be called?
    const pdfDoc = printer.createPdfKitDocument(scaffold)
    const stream = pdfDoc.pipe(fs.createWriteStream(outPdf.path))
    pdfDoc.end()
    await new Promise((resolve) => stream.on('finish', resolve))
    return outPdf
  }

  async generatePdfWithPageNumbers (inPdf, outPdf = this.generatePdfObject()) {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(inPdf.path))
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()
    pages.forEach((page, i) => {
      const { width, height } = page.getSize()
      page.drawText(`${i + 1}`, {
        x: width - 15,
        y: 15,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
    })
    fs.writeFileSync(outPdf.path, await pdfDoc.save())
    return outPdf
  }
}
