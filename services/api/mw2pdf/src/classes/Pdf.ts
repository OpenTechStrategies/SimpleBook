import fs from 'fs'
import { getDocument } from 'pdfjs-dist/es5/build/pdf'


/**
 * A data structure to hold parameters that control the construction
 * of a PDF.
 */
export class PdfConstructorOptions {
  title: string
  filename: string

  /**
   *
   * Create a [[PdfConstructorOptions]] data structure.
   *
   * @param title The title of the PDF.
   * @param filename The filename where the PDF is stored on disk.
   * This is a fully-qualified path.
   */
  constructor(title: string, filename: string) {
    this.title = title
    this.filename = filename
  }
}

/**
 * A data structure to hold information about the size of a PDF
 */
export class PdfSize {
  width: number
  height: number

  /**
   *
   * Construct a [[PdfSize]] data structure.
   *
   * @param width The width of the PDF.
   * @param height The height of the PDF.
   */
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }
}

/**
 * A data structure that describes information about
 * a PDF.
 */
export class PdfInfo {
  numPages: number
  size: PdfSize

  /**
   *
   * Construct a [[PdfInfo]] data structure.
   *
   * @param numPages The number of pages of the PDF.
   * @param size The size of the pages of the PDF.
   */
  constructor(numPages: number, size: PdfSize) {
    this.numPages = numPages
    this.size = size
  }
}

export class Pdf {
  filename: string
  title: string

  /**
   *
   * Construct a [[Pdf]] data structure.
   *
   * @param options Options that the user chooses that control the construction
   * of the PDF.
   */
  constructor(options: PdfConstructorOptions) {
    this.filename = options.filename
    this.title = options.title
  }

  /**
   * 
   * Get the information about a PDF
   * 
   * @returns a Promise that resolves to a [[PdfInfo]] that describes
   * the information of this PDF.
   */

  async getInfo(): Promise<PdfInfo> {
    const data = fs.readFileSync(this.filename)
    const pdf = await (getDocument(data).promise)
    const page = await pdf.getPage(1)
    return new PdfInfo(pdf.numPages,
      new PdfSize(
        page.view[2] as number,
        page.view[3] as number
      )
    )
  }

  /**
   *
   * Delete the PDF.
   *
   */
  async delete(): Promise<void> {
    return await fs.promises.unlink(this.filename)
  }
}
