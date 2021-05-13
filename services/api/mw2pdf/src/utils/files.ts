import type { Pdf } from "src/classes/Pdf"

/**
 *
 * Delete PDFs
 *
 * @param pdfs An array of [[Pdf]]s to delete.
 */
export async function deletePdfs(pdfs: Array<Pdf>): Promise<void> {
  await Promise.all(pdfs.map(async (pdf: Pdf) => pdf.delete()))
}
