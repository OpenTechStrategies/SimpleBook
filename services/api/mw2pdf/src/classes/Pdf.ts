import fs from 'fs'
import { getDocument } from 'pdfjs-dist/es5/build/pdf'

export class Pdf {

  path: any;

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
    const pdf = await (getDocument(data).promise)
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
