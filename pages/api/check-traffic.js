// pages/api/check-traffic.js
// Server-side proxy to Google Routes API
// The API key is kept server-side and never exposed to the client.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { origin, destinationPlaceId, destinationAddress } = req.body

  if (!origin?.lat || !origin?.lng) {
    return res.status(400).json({ error: 'Origin coordinates are required.' })
  }
  if (!destinationPlaceId && !destinationAddress) {
    return res.status(400).json({ error: 'Destination is required.' })
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    // Return simulated data when no key is configured (demo mode)
    return res.status(200).json(simulateTrafficData(origin))
  }

  try {
    // Build destination object for Routes API
    const destination = destinationPlaceId
      ? { placeId: destinationPlaceId }
      : { address: destinationAddress }

    const body = {
      origin: {
        location: {
          latLng: { latitude: origin.lat, longitude: origin.lng },
        },
      },
      destination: destinationPlaceId
        ? { placeId: destinationPlaceId }
        : { address: destinationAddress },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      departureTime: new Date().toISOString(),
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: 'en-US',
      units: 'METRIC',
    }

    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.staticDuration,routes.distanceMeters,routes.travelAdvisory',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Routes API error:', errText)
      return res.status(502).json({ error: 'Google Routes API error. Check your API key and enabled APIs.' })
    }

    const data = await response.json()
    const route = data?.routes?.[0]

    if (!route) {
      return res.status(404).json({ error: 'No route found for this destination.' })
    }

    // staticDuration = travel time without traffic (in seconds)
    // duration = travel time with traffic (in seconds)
    const durationSeconds = parseDuration(route.staticDuration)
    const durationInTrafficSeconds = parseDuration(route.duration)
    const distanceMeters = route.distanceMeters || 0

    return res.status(200).json({
      durationSeconds,
      durationInTrafficSeconds,
      distanceMeters,
    })
  } catch (err) {
    console.error('Traffic check error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// Parses Google's duration format "1234s" → number of seconds
function parseDuration(durationStr) {
  if (!durationStr) return 0
  const match = String(durationStr).match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

// Generates realistic simulated traffic data for demo/testing
function simulateTrafficData(origin) {
  const baseDuration = 1200 + Math.floor(Math.random() * 1800) // 20–50 min base
  const trafficMultiplier = [1.0, 1.1, 1.2, 1.35, 1.5, 1.7, 2.0][Math.floor(Math.random() * 7)]
  return {
    durationSeconds: baseDuration,
    durationInTrafficSeconds: Math.round(baseDuration * trafficMultiplier),
    distanceMeters: 8000 + Math.floor(Math.random() * 25000),
    demo: true,
  }
}
