import fs from 'fs'
import pdfjsLib from 'pdfjs-dist/es5/build/pdf.js'

export class Pdf {
  constructor(path, {
    title = '',
  } = {}) {
    Object.assign(
      this,
      {
        path,
        title,
      },
    )
  }

  async getInfo() {
    const data = fs.readFileSync(this.path)
    const pdf = await (pdfjsLib.getDocument(data).promise)
    const page = await pdf.getPage(1)
    return {
      numPages: pdf.numPages,
      size: {
        width: page.view[2],
        height: page.view[3],
      },
    }
  }

  async delete() {
    return await fs.promises.unlink(this.path)
  }
}
