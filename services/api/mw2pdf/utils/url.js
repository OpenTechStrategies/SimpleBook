
export function updateUrlParameters(urlString, parameters) {
  const url = new URL(urlString)
  Object.entries(parameters).forEach(
    ([key, value]) => url.searchParams.set(
      key,
      value,
    ),
  )
  return url.toString()
}
