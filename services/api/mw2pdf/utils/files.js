import fs from 'fs'

export async function deletePdfs(pdfs) {
  await Promise.all(pdfs.map(async (pdf) => pdf.delete()))
}
