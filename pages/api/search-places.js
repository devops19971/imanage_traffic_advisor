// pages/api/search-places.js
// Proxies TomTom Search API for address autocomplete
// API key stays server-side — never exposed to the browser

export default async function handler(req, res) {
  const { q, lat, lng } = req.query

  if (!q || q.trim().length < 2) {
    return res.status(200).json({ results: [] })
  }

  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'TomTom API key not configured.' })
  }

  try {
    const encoded = encodeURIComponent(q.trim())
    let url =
      `https://api.tomtom.com/search/2/search/${encoded}.json` +
      `?key=${apiKey}&limit=6&typeahead=true&language=en-GB&countrySet=IN`

    // Bias results toward user's current location without strictly restricting them
    if (lat && lng) {
      url += `&lat=${lat}&lon=${lng}`
    }

    const resp = await fetch(url)
    if (!resp.ok) {
      const txt = await resp.text()
      console.error('TomTom Search error:', txt)
      return res.status(502).json({ error: 'TomTom Search API error.' })
    }

    const data = await resp.json()

    const results = (data.results || []).map((r) => ({
      id: r.id,
      name: r.poi?.name || r.address?.municipality || r.address?.freeformAddress,
      address: r.address?.freeformAddress || '',
      lat: r.position?.lat,
      lng: r.position?.lon,
    }))

    return res.status(200).json({ results })
  } catch (err) {
    console.error('search-places error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
