import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import PdfMerger from 'pdf-merger-js'
import PdfPrinter from 'pdfmake'
import {
  PDFDocument,
  rgb,
  StandardFonts,
} from 'pdf-lib'
import { Pdf, PdfConstructorOptions } from './Pdf'
import {
  pageSizeToPdfFactoryPageSize,
} from '../utils/validation'

// The below two lines are from
// https://stackoverflow.com/questions/32705219/nodejs-accessing-file-with-relative-path/32707530#32707530
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class PdfFactory {

  static generatePdfObject(options: PdfConstructorOptions): Pdf {
    return new Pdf(options)
  }

  static async generateMergedPdf(pdfs: Array<Pdf>, outPdf: Pdf): Promise<Pdf> {
    const merger = new PdfMerger()
    pdfs.forEach(pdf => merger.add(pdf.filename))
    await merger.save(outPdf.filename)
    return outPdf
  }

  static async generateTitlePagePdf(title: string, outPdf: Pdf, pageSize: string): Promise<void> {
    const scaffold = {
      pageSize: pageSizeToPdfFactoryPageSize(pageSize),
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
    await PdfFactory.generatePdfFromScaffold(scaffold, outPdf)
  }

  static async generateTableOfContentsPdf(pdfs: Array<Pdf>, outPdf: Pdf, pageSize: string): Promise<void> {

    /**
     * Create a throwaway Toc datastructure to make the
     * body of the callback function to reduce happy.
     */
    interface Toc {
      pageNumber: number
      pdf: Pdf
      scaffold: Object
    }

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
      Promise.resolve(new Array<Toc>()), // Start the reduction with an empty slate.
    )

    const scaffold = {
      pageSize: pageSizeToPdfFactoryPageSize(pageSize),
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
    await PdfFactory.generatePdfFromScaffold(scaffold, outPdf)
  }

  static async generatePdfFromScaffold(scaffold, outPdf: Pdf): Promise<void> {
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
    const writeStream = fs.createWriteStream(outPdf.filename)
    const stream = pdfDoc.pipe(writeStream)
    pdfDoc.end()
    await new Promise((resolve) => stream.on('finish', resolve))
  }

  static async generatePdfWithPageNumbers (inPdf: Pdf, outPdf: Pdf): Promise<void> {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(inPdf.filename))
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
    fs.writeFileSync(outPdf.filename, await pdfDoc.save())
  }
}
