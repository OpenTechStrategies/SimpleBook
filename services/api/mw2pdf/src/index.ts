import program from 'commander'
import Joi from 'joi'
import { updateUrlParameters, urlStringsToUrls } from './utils/url'
import { assertValidPassthroughParameters } from './utils/validation'
import { getApiUrlFromMediaWikiUrl } from './utils/mediaWiki'
import { MediaWikiSession, MwPdfOptions } from './classes/MediaWikiSession'

interface CommandOptions {
  mwUsername?: string
  mwPassword?: string
  title: string
  subtitle: string
  passthroughParameters: string
  out: string
}

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
  .action(async (urlStrings: Array<string>, options: CommandOptions) => {
    const mediaWikiSession = new MediaWikiSession()
    // Authenticate
    if (options.mwUsername !== ''
      && options.mwPassword !== '') {
      const apiUrl = getApiUrlFromMediaWikiUrl(new URL(urlStrings[0]))
      const authenticated = await mediaWikiSession.authenticate(
        options.mwUsername,
        options.mwPassword,
        apiUrl,
      )
      if (!authenticated) {
        throw new Error("Invalid authentication!")
      }
    }

    let urls: Array<URL> = urlStringsToUrls(urlStrings)

    // Process passthrough parameters
    if (options.passthroughParameters) {
      try {
        assertValidPassthroughParameters(options.passthroughParameters)
      } catch (e) {
        if (e instanceof Joi.ValidationError) {
          console.log(e.details)
        } else {
          console.log(`Parameter decoration failed. (${e.message}`)
        }
        return
      }

      try {
        const passthroughParameters: Object = JSON.parse(options.passthroughParameters)
        urls = urls.map(
          (url) => updateUrlParameters(url, passthroughParameters),
        )
      } catch (e) {
        console.log(`Parameter decoration failed. (${e.message}`)
        return
      }
    }
    const pdfBooklet = await mediaWikiSession.makePdfBooklet(processedUrls)
  })

program.parseAsync(process.argv)
