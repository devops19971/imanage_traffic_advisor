// pages/api/check-traffic.js
// Proxies TomTom Routing API for real-time traffic-aware route calculation
// API key stays server-side — never exposed to the browser

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { origin, destination } = req.body

  if (!origin?.lat || !origin?.lng) {
    return res.status(400).json({ error: 'Origin coordinates are required.' })
  }
  if (!destination?.lat || !destination?.lng) {
    return res.status(400).json({ error: 'Destination coordinates are required.' })
  }

  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey) {
    // Demo mode — return simulated data so the UI is previewable without a key
    return res.status(200).json(simulateTrafficData())
  }

  try {
    const routeUrl =
      `https://api.tomtom.com/routing/1/calculateRoute/` +
      `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}/json` +
      `?key=${apiKey}` +
      `&traffic=true` +
      `&travelMode=car` +
      `&routeType=fastest` +
      `&computeBestOrder=false`

    const resp = await fetch(routeUrl)

    if (!resp.ok) {
      const txt = await resp.text()
      console.error('TomTom Routing error:', txt)
      return res.status(502).json({ error: 'TomTom Routing API error. Check your API key.' })
    }

    const data = await resp.json()
    const summary = data?.routes?.[0]?.summary

    if (!summary) {
      return res.status(404).json({ error: 'No route found for this destination.' })
    }

    // TomTom gives us:
    //   travelTimeInSeconds              → current travel time WITH live traffic
    //   noTrafficTravelTimeInSeconds     → travel time on empty roads (baseline)
    //   historicTrafficTravelTimeInSeconds → historical average for this time of day
    //   trafficDelayInSeconds            → extra seconds caused by traffic
    //   liveTrafficIncidentsTravelTimeInSeconds → incidents-only travel time

    return res.status(200).json({
      durationSeconds: summary.noTrafficTravelTimeInSeconds,
      durationInTrafficSeconds: summary.travelTimeInSeconds,
      trafficDelaySeconds: summary.trafficDelayInSeconds || 0,
      historicDurationSeconds: summary.historicTrafficTravelTimeInSeconds,
      distanceMeters: summary.lengthInMeters,
    })
  } catch (err) {
    console.error('check-traffic error:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// Simulated data for demo / testing (when no API key is set)
function simulateTrafficData() {
  const base = 1200 + Math.floor(Math.random() * 1800)
  const multiplier = [1.0, 1.1, 1.25, 1.4, 1.6, 1.9][Math.floor(Math.random() * 6)]
  const withTraffic = Math.round(base * multiplier)
  return {
    durationSeconds: base,
    durationInTrafficSeconds: withTraffic,
    trafficDelaySeconds: withTraffic - base,
    historicDurationSeconds: Math.round(base * 1.2),
    distanceMeters: 8000 + Math.floor(Math.random() * 22000),
    demo: true,
  }
}
