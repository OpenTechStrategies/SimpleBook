import fs from 'fs'
import program from 'commander'
import { getApiUrlFromMediaWikiUrl } from './utils/mediaWiki.js'
import { MediaWikiSession } from './classes/MediaWikiSession.js'
import { updateUrlParameters } from './utils/url.js'

program.version('0.0.1')
program
  .command('pdf <urls...>')
  .description('creates a pdf consisting of the combined urls (comma separated)')
  .requiredOption('-o, --out <path>', 'path to the output file')
  .option('--title <string>', 'Title of book', 'Proposal Book')
  .option('--subtitle <string>', 'Subtitle of book', 'Table of Contents')
  .option('--mwUsername <string>', 'The username to log in with', '')
  .option('--mwPassword <string>', 'The password to log in with', '')
  .option('--passthroughParameters <string>', 'a json encoded string containing data to pass via querystring with each request', '')
  .action(async (urls, options) => {
    const mediaWikiSession = new MediaWikiSession()
    // Authenticate
    if (options.mwUsername !== ''
      && options.mwPassword !== '') {
      const apiUrl = getApiUrlFromMediaWikiUrl(urls[0])
      await mediaWikiSession.authenticate(
        options.mwUsername,
        options.mwPassword,
        apiUrl,
      )
    }

    // Process passthrough parameters
    let processedUrls = urls
    if (options.passthroughParameters) {
      const passthroughParameters = JSON.parse(options.passthroughParameters)
      processedUrls = processedUrls.map(
        (url) => updateUrlParameters(url, passthroughParameters),
      )
    }
    const pdfBooklet = await mediaWikiSession.makePdfBooklet(processedUrls)
  })

program.parseAsync(process.argv)
