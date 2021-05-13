
/**
 *
 * Update the parameters to a [[URL]] by either adding or replacing values.
 *
 * @param url The URL which will be updated by the `parameters`.
 * @param parameters The parameters and values to update for `url`.
 * @returns `url` with updated parameters.
 */
export function updateUrlParameters(url: URL, parameters: Object) {
  Object.entries(parameters).forEach(
    ([key, value]) => url.searchParams.set(key, String(value))
  )
  return url
}

/**
 *
 * Convert an array of URLs specified as [[string]]s into a matching array
 * of [[URL]]s.
 * NB: This method will throw exceptions if any URL in `urlStrings` cannot
 * be converted into a [[URL]].
 *
 * @param urlStrings An array of URLs in [[string]] format.
 * @returns An array of URLs as [[URL]]s that match `urlStrings`. 
 */
export function urlStringsToUrls(urlStrings: Array<string>): Array<URL> {
  return urlStrings.map((urlString: string) => {
    try {
      return new URL(urlString)
    } catch (e) {
      throw new Error("Invalid URL")
    }
  })
}
