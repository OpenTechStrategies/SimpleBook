import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import dateFormat from 'dateformat'
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
import { v4 } from 'uuid'
import { join } from 'path'
import fontkit from '@pdf-lib/fontkit';

// The below two lines are from
// https://stackoverflow.com/questions/32705219/nodejs-accessing-file-with-relative-path/32707530#32707530
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class PdfFactory {

  static generatePdfObject(options: PdfConstructorOptions): Pdf {
    return new Pdf(options)
  }

  static async generateMergedPdf(pdfs: Array<Pdf>, outPdf: Pdf, workDirectory: string, titlePages: boolean): Promise<Pdf> {
    const merger = new PdfMerger()
    for (const pdf of pdfs) {
      if (pdf !== null) {
        if(titlePages) {
          const titledPagesPdfFilename = join(workDirectory, `${v4()}.pdf` )
          const titledPdf = PdfFactory.generatePdfObject(new PdfConstructorOptions('', titledPagesPdfFilename))
          await PdfFactory.generatePdfWithRepeatedTitles (pdf, titledPdf)
          merger.add(titledPdf.filename)
        } else {
          merger.add(pdf.filename)
        }
      }
    }
    await merger.save(outPdf.filename)
    return outPdf
  }

  static async generateTitlePagePdf(
    title: string,
    subtitle: string,
    outPdf: Pdf,
    pageSize: string,
  ): Promise<void> {
    const scaffold = {
      pageSize: pageSizeToPdfFactoryPageSize(pageSize),
      content: [
        {
          text: title,
          style: 'header',
          color: '#002d55',
        },
        {
          text: subtitle,
          style: 'subheader',
          color: '#00853e',
        },
        {
          text: dateFormat(new Date(), 'mmmm dd, yyyy'),
          style: 'date',
          color: '#002d55',
        },
        {
          image: path.join(__dirname, '../../demo/LeverForChange_Logo.png'),
          width: 200,
          style: 'logo',
        }
      ],
      styles: {
        header: {
          font: 'Oswald',
          fontSize: 36,
          bold: true,
          margin: [0, 100, 0, 0],
        },
        subheader: {
          font: 'Oswald',
          fontSize: 24,
          margin: [0, 0, 0, 0],
        },
        date: {
          font: 'Oswald',
          fontSize: 14,
          margin: [0, 14, 0, 0],
        },
        logo: {
          margin: [0, 350, 0, 0],
        }
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
            margin: [5, 10]
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
          font: 'Oswald',
          color: '#00853e',
          fontSize: 20,
          bold: true,
          margin: [0, 50, 0, 10]
        },
        subheader: {
          font: 'Oswald',
          color: '#002d55',
          fontSize: 14
        },
        toc: {
          font: 'Oswald',
          color: '#002d55',
          fontSize: 14,
          margin: [65, 50, 65, 50]
        }
      }
    }
    await PdfFactory.generatePdfFromScaffold(scaffold, outPdf)
  }

  static async generatePdfFromScaffold(scaffold, outPdf: Pdf): Promise<void> {
    const printer = new PdfPrinter({
      Oswald: {
        normal: path.join(__dirname, '../../demo/Oswald-Regular.ttf'),
        bold: path.join(__dirname, '../../demo/Oswald-SemiBold.ttf'),
        italics: path.join(__dirname, '../../demo/Oswald-Regular.ttf'),
        bolditalics: path.join(__dirname, '../../demo/Oswald-Regular.ttf'),
      },
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
    const url = path.join(__dirname, '../../demo/Oswald-Regular.ttf')
    pdfDoc.registerFontkit(fontkit)
    const fontBytes = await fs.readFileSync(url)
    const oswaldFont = await pdfDoc.embedFont(fontBytes)
    const pages = pdfDoc.getPages()
    pages.forEach((page, i) => {
      const { width, height } = page.getSize()
      page.drawText(`${i + 1}`, {
        x: width - 35,
        y: height - 35,
        size: 8,
        font: oswaldFont,
        color: rgb(0, .176, .333)
      })
    })
    fs.writeFileSync(outPdf.filename, await pdfDoc.save())
  }

  static async generatePdfWithRepeatedTitles (inPdf: Pdf, outPdf: Pdf): Promise<void> {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(inPdf.filename))
    const url = path.join(__dirname, '../../demo/Oswald-Regular.ttf')
    pdfDoc.registerFontkit(fontkit)
    const fontBytes = await fs.readFileSync(url)
    const oswaldFont = await pdfDoc.embedFont(fontBytes)
    const pages = pdfDoc.getPages()
    pages.forEach((page, i) => {
      if(i > 0) {
        const { width, height } = page.getSize()
        page.drawText(inPdf.title, {
          x: 35,
          y: height - 35,
          size: 8,
          font: oswaldFont,
          color: rgb(0, .176, .333)
        })
      }
    })
    fs.writeFileSync(outPdf.filename, await pdfDoc.save())
  }
}
