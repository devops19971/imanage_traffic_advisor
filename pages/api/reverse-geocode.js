// pages/api/reverse-geocode.js
// Server-side proxy for TomTom Reverse Geocoding
// Returns a detailed, human-friendly address from lat/lng coordinates

export default async function handler(req, res) {
  const { lat, lng } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required.' })
  }

  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'TomTom API key not configured.' })
  }

  try {
    const url =
      `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json` +
      `?key=${apiKey}&radius=200&returnSpeedLimit=false&returnRoadUse=false`

    const resp = await fetch(url)
    if (!resp.ok) {
      return res.status(502).json({ error: 'TomTom reverse geocode error.' })
    }

    const data = await resp.json()
    const addr = data?.addresses?.[0]?.address

    if (!addr) {
      return res.status(200).json({ displayName: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`, address: null })
    }

    // Build the most detailed possible short name:
    // e.g. "Ramkrishna Nagar, Patna" or "Mahendra Apartment, Ramkrishna Nagar, Patna"
    const parts = []

    // 1. Building name (most specific)
    if (addr.buildingName) parts.push(addr.buildingName)

    // 2. Neighbourhood / Sublocality (e.g. Ramkrishan Nagar)
    if (addr.neighbourhood) {
      parts.push(addr.neighbourhood)
    } else if (addr.localName) {
      parts.push(addr.localName)
    }

    // 3. Street Name (Only use if we don't have a building or neighbourhood, to avoid clutter)
    if (addr.streetName && parts.length === 0) {
      parts.push(addr.streetName)
    }

    // 4. Municipality (e.g. Patna)
    if (addr.municipality && !parts.includes(addr.municipality)) {
      parts.push(addr.municipality)
    }

    // State abbreviation if no neighbourhood available
    if (parts.length < 2 && addr.countrySubdivision) {
      parts.push(addr.countrySubdivision)
    }

    const displayName = parts.length > 0
      ? parts.slice(0, 3).join(', ')
      : addr.freeformAddress || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`

    return res.status(200).json({
      displayName,
      freeformAddress: addr.freeformAddress,
      address: addr,
    })
  } catch (err) {
    console.error('reverse-geocode error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
