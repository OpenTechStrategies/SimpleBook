
export function updateUrlParameters(urlString, parameters) {
  const url = new URL(urlString)
  Object.entries(parameters).forEach(
    ([key, value]) => url.searchParams.set(
      key,
      String(value),
    ),
  )
  return url.toString()
}
