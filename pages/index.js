import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import SeoHead from '../components/SeoHead'
import toast from 'react-hot-toast'
import {
  MapPin, Navigation, Clock, Bell, BellOff, ChevronRight,
  Zap, RefreshCw, AlertTriangle, CheckCircle, Timer,
  TrendingDown, TrendingUp, Minus, Car, Info, X
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function formatDistance(meters) {
  if (!meters) return '—'
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${meters} m`
}

function getTrafficLevel(baseSec, trafficSec) {
  if (!baseSec || !trafficSec) return null
  const ratio = trafficSec / baseSec
  if (ratio <= 1.15) return 'light'
  if (ratio <= 1.4) return 'moderate'
  return 'heavy'
}

function getDelayMinutes(baseSec, trafficSec) {
  if (!baseSec || !trafficSec) return 0
  return Math.max(0, Math.round((trafficSec - baseSec) / 60))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TrafficLightIndicator({ level }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Traffic light housing */}
      <div className="bg-gray-800 border border-white/10 rounded-2xl p-3 flex flex-col gap-2.5 shadow-xl">
        {['red', 'yellow', 'green'].map((color) => {
          const active =
            (color === 'red' && level === 'heavy') ||
            (color === 'yellow' && level === 'moderate') ||
            (color === 'green' && level === 'light')
          const colorMap = {
            red: active ? 'bg-red-500 shadow-[0_0_16px_4px_rgba(239,68,68,0.7)]' : 'bg-gray-700',
            yellow: active ? 'bg-yellow-400 shadow-[0_0_16px_4px_rgba(245,158,11,0.7)]' : 'bg-gray-700',
            green: active ? 'bg-green-500 shadow-[0_0_16px_4px_rgba(16,185,129,0.7)]' : 'bg-gray-700',
          }
          return (
            <div
              key={color}
              className={`w-8 h-8 rounded-full transition-all duration-700 ${colorMap[color]} ${active ? 'scale-110' : 'scale-90 opacity-40'}`}
            />
          )
        })}
      </div>
      <span className="text-xs text-gray-500 font-medium">Traffic</span>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color = 'cyan' }) {
  const colorMap = {
    cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    red: 'from-red-500/10 to-orange-500/10 border-red-500/20',
    yellow: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20',
  }
  const iconColor = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 flex flex-col gap-3 animate-slide-up`}>
      <div className={`${iconColor[color]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold font-display text-white">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function RecommendationBanner({ level, delayMinutes, trafficDuration, baseDuration }) {
  if (!level) return null
  const isGood = level === 'light'
  const isModerate = level === 'moderate'

  if (isGood) {
    return (
      <div className="leave-now-glow rounded-2xl border border-green-500/40 bg-gradient-to-br from-green-500/15 to-emerald-600/10 p-6 flex items-center gap-5 animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="text-green-400 font-bold text-xl font-display">✅ Leave Now!</div>
          <div className="text-gray-300 text-sm mt-1">
            Traffic is light — only <span className="text-white font-semibold">{formatDuration(trafficDuration)}</span> travel time.
            {delayMinutes > 0 ? ` Just ${delayMinutes} min delay.` : ' No delay!'}
          </div>
        </div>
        <div className="text-5xl">🚀</div>
      </div>
    )
  }

  if (isModerate) {
    return (
      <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/15 to-amber-600/10 p-6 flex items-center gap-5 animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-7 h-7 text-yellow-400" />
        </div>
        <div className="flex-1">
          <div className="text-yellow-400 font-bold text-xl font-display">⏳ Moderate Traffic</div>
          <div className="text-gray-300 text-sm mt-1">
            <span className="text-white font-semibold">{delayMinutes} min delay</span>. You can leave if needed, but waiting may help.
            Normal time: <span className="text-white font-semibold">{formatDuration(baseDuration)}</span>.
          </div>
        </div>
        <div className="text-5xl">🟡</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-500/15 to-orange-600/10 p-6 flex items-center gap-5 animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
        <Timer className="w-7 h-7 text-red-400" />
      </div>
      <div className="flex-1">
        <div className="text-red-400 font-bold text-xl font-display">🔴 Wait — Heavy Traffic</div>
        <div className="text-gray-300 text-sm mt-1">
          <span className="text-white font-semibold">{delayMinutes} min delay</span> vs normal.
          We suggest waiting and we'll notify you when traffic clears up.
        </div>
      </div>
      <div className="text-5xl">🚗</div>
    </div>
  )
}

function NotificationPanel({ level, onSubscribe, isSubscribed, onUnsubscribe, notifThreshold, setNotifThreshold }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (level === 'heavy') setExpanded(true)
  }, [level])

  if (isSubscribed) {
    return (
      <div className="glass-card p-6 flex items-center gap-4 animate-slide-up">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">Notifications Active 🔔</div>
          <div className="text-gray-400 text-sm mt-0.5">
            We'll alert you when traffic improves to <span className="text-cyan-400 font-medium">{notifThreshold === 'light' ? 'Light' : 'Moderate or better'}</span>.
          </div>
        </div>
        <button
          onClick={onUnsubscribe}
          className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
          title="Cancel notifications"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">Get Notified When Traffic Improves</div>
          <div className="text-gray-400 text-sm mt-0.5">Enable browser notifications — we'll ping you at the right moment.</div>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-white/5 pt-5 space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Notify me when traffic is:</label>
            <div className="flex gap-3">
              {[
                { value: 'light', label: '🟢 Light', desc: 'Best condition' },
                { value: 'moderate', label: '🟡 Moderate', desc: 'Acceptable' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNotifThreshold(opt.value)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    notifThreshold === opt.value
                      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onSubscribe}
            className="w-full btn-primary justify-center py-3.5"
          >
            <Bell className="w-5 h-5" />
            Enable Notifications
          </button>

          <p className="text-xs text-gray-600 text-center">
            We check traffic every 5 minutes. You can dismiss anytime.
          </p>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-32 rounded-2xl shimmer bg-gray-800/50" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 rounded-2xl shimmer bg-gray-800/50" />
        <div className="h-28 rounded-2xl shimmer bg-gray-800/50" />
        <div className="h-28 rounded-2xl shimmer bg-gray-800/50" />
        <div className="h-28 rounded-2xl shimmer bg-gray-800/50" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [destination, setDestination] = useState('')
  const [destinationPlaceId, setDestinationPlaceId] = useState(null)
  const [destinationAddress, setDestinationAddress] = useState('')
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [locationError, setLocationError] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [trafficData, setTrafficData] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notifThreshold, setNotifThreshold] = useState('light')
  const [pollingInterval, setPollingInterval] = useState(null)
  const [hasApiKey, setHasApiKey] = useState(true)

  const autocompleteRef = useRef(null)
  const inputRef = useRef(null)
  const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  // ── Check API key ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setHasApiKey(false)
    }
  }, [MAPS_KEY])

  // ── Init Places Autocomplete ──────────────────────────────────────────────
  const initAutocomplete = useCallback(() => {
    if (!window.google || !inputRef.current) return

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'formatted_address', 'name', 'geometry'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (place?.place_id) {
        setDestinationPlaceId(place.place_id)
        setDestinationAddress(place.formatted_address || place.name || '')
        setDestination(place.formatted_address || place.name || '')
      }
    })
    autocompleteRef.current = ac
  }, [])

  useEffect(() => {
    if (mapsLoaded) initAutocomplete()
  }, [mapsLoaded, initAutocomplete])

  // ── Get Current Location ──────────────────────────────────────────────────
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCurrentLocation(coords)
        setIsLocating(false)

        // Reverse geocode to get name
        if (window.google) {
          try {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: coords }, (results, status) => {
              if (status === 'OK' && results[0]) {
                // Get a short name from the address components
                const comps = results[0].address_components
                const locality = comps.find(c => c.types.includes('locality') || c.types.includes('sublocality'))
                setLocationName(locality ? locality.long_name : results[0].formatted_address.split(',')[0])
              }
            })
          } catch (e) { /* silent */ }
        }
      },
      (err) => {
        setIsLocating(false)
        setLocationError('Could not get your location. Please allow location access.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    // Auto-detect location on mount
    if (typeof window !== 'undefined') {
      getCurrentLocation()
    }
  }, [])

  // ── Check Traffic ─────────────────────────────────────────────────────────
  const checkTraffic = useCallback(async (silent = false) => {
    if (!currentLocation) {
      toast.error('Please allow location access first.')
      return
    }
    if (!destinationPlaceId && !destination.trim()) {
      toast.error('Please enter a destination.')
      return
    }
    if (!silent) setIsChecking(true)

    try {
      const res = await fetch('/api/check-traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: currentLocation,
          destinationPlaceId,
          destinationAddress: destination.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch traffic data')
      setTrafficData(data)
      setLastChecked(new Date())

      // Check notification threshold
      if (isSubscribed) {
        const level = getTrafficLevel(data.durationSeconds, data.durationInTrafficSeconds)
        const thresholdMet =
          notifThreshold === 'light' ? level === 'light' :
          level === 'light' || level === 'moderate'

        if (thresholdMet && Notification.permission === 'granted') {
          new Notification('🚦 iManage Traffic Advisor', {
            body: `Traffic is now ${level}! Time to leave for ${destinationAddress}. ETA: ${formatDuration(data.durationInTrafficSeconds)}`,
            icon: '/favicon.ico',
          })
          toast.success('Traffic improved! Notification sent.')
        }
      }
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to check traffic.')
    } finally {
      if (!silent) setIsChecking(false)
    }
  }, [currentLocation, destinationPlaceId, destination, isSubscribed, notifThreshold, destinationAddress])

  // ── Subscribe to Notifications ────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!destinationPlaceId && !destination.trim()) {
      toast.error('Please enter and select a destination first.')
      return
    }
    if (!currentLocation) {
      toast.error('Please allow location access first.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notification permission denied. Please enable in browser settings.')
        return
      }
      setIsSubscribed(true)
      toast.success('Notifications enabled! We\'ll check traffic every 5 minutes.')

      // Start polling
      const interval = setInterval(() => {
        checkTraffic(true)
      }, 5 * 60 * 1000) // every 5 minutes
      setPollingInterval(interval)

      // Immediate check
      checkTraffic(true)
    } catch (err) {
      toast.error('Could not enable notifications.')
    }
  }

  const handleUnsubscribe = () => {
    setIsSubscribed(false)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    toast('Notifications disabled.', { icon: '🔕' })
  }

  // cleanup
  useEffect(() => () => { if (pollingInterval) clearInterval(pollingInterval) }, [pollingInterval])

  const trafficLevel = trafficData
    ? getTrafficLevel(trafficData.durationSeconds, trafficData.durationInTrafficSeconds)
    : null
  const delayMin = trafficData
    ? getDelayMinutes(trafficData.durationSeconds, trafficData.durationInTrafficSeconds)
    : 0

  const trafficBadge = {
    light: <span className="traffic-badge-green"><span className="traffic-dot traffic-dot-green" />Light Traffic</span>,
    moderate: <span className="traffic-badge-yellow"><span className="traffic-dot traffic-dot-yellow" />Moderate Traffic</span>,
    heavy: <span className="traffic-badge-red"><span className="traffic-dot traffic-dot-red" />Heavy Traffic</span>,
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <SeoHead />

      {/* Load Google Maps */}
      {hasApiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsLoaded(true)}
        />
      )}

      <div className="min-h-screen bg-gray-950 text-gray-100">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-950 py-16 md:py-24">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob blob-1 absolute -top-32 -left-32 w-96 h-96 bg-cyan-400" />
            <div className="blob blob-2 absolute top-1/2 -right-20 w-80 h-80 bg-blue-500" />
            <div className="blob blob-3 absolute -bottom-20 left-1/3 w-72 h-72 bg-indigo-500" />
          </div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-cyan-300 mb-8">
              <Car className="w-4 h-4" />
              Powered by Google Maps
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 font-display">
              <span className="block text-sm font-bold uppercase tracking-widest text-cyan-400 mb-3">iManage</span>
              <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">
                Traffic Advisor
              </span>
            </h1>

            <p className="text-lg text-blue-200 max-w-xl mx-auto leading-relaxed mb-10">
              Enter your destination, see live traffic conditions, and know exactly <span className="text-white font-semibold">when to leave</span>. Get notified when traffic clears.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                { icon: '⚡', text: 'Real-time traffic' },
                { icon: '📍', text: 'Auto location detect' },
                { icon: '🔔', text: 'Smart notifications' },
                { icon: '🗺️', text: 'Google Maps powered' },
              ].map((s) => (
                <div key={s.text} className="flex items-center gap-2 text-blue-300">
                  <span>{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          {/* ── API Key Warning ─────────────────────────────────────────────── */}
          {!hasApiKey && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 flex gap-4 items-start animate-slide-up">
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <div className="font-semibold mb-1">Google Maps API Key Required</div>
                Open <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-xs">.env.local</code> and set{' '}
                <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> and{' '}
                <code className="bg-yellow-500/20 px-1.5 py-0.5 rounded text-xs">GOOGLE_MAPS_SERVER_KEY</code> to your Google Maps API key,
                then restart the dev server.
              </div>
            </div>
          )}

          {/* ── INPUT CARD ──────────────────────────────────────────────────── */}
          <div className="card-glow p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold font-display">Plan Your Journey</h2>
            </div>

            {/* Current Location */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Your Current Location
              </label>
              <div className="flex items-center gap-3">
                <div className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border ${
                  currentLocation ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-gray-800/60'
                } transition-all`}>
                  <Navigation className={`w-4 h-4 flex-shrink-0 ${currentLocation ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${currentLocation ? 'text-green-300' : 'text-gray-500'}`}>
                    {isLocating
                      ? 'Detecting location…'
                      : locationError
                        ? locationError
                        : currentLocation
                          ? locationName || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                          : 'Location not detected'}
                  </span>
                </div>
                <button
                  id="refresh-location-btn"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="p-3.5 rounded-xl border border-white/10 bg-gray-800/60 hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-all disabled:opacity-50"
                  title="Refresh location"
                >
                  <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  id="destination-input"
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value)
                    if (!e.target.value) {
                      setDestinationPlaceId(null)
                      setDestinationAddress('')
                    }
                  }}
                  placeholder="Enter destination address or landmark…"
                  className="input-field pl-11"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Check Traffic Button */}
            <button
              id="check-traffic-btn"
              onClick={() => checkTraffic(false)}
              disabled={isChecking || !currentLocation || (!destinationPlaceId && !destination.trim())}
              className="w-full btn-primary justify-center py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Checking Traffic…</>
              ) : (
                <><Zap className="w-5 h-5" /> Check Traffic Now</>
              )}
            </button>

            {lastChecked && (
              <p className="text-xs text-gray-600 text-center">
                Last checked: {lastChecked.toLocaleTimeString()}
                {isSubscribed && (
                  <span className="ml-2 text-cyan-600">• Auto-refreshing every 5 min</span>
                )}
              </p>
            )}
          </div>

          {/* ── TRAFFIC RESULTS ─────────────────────────────────────────────── */}
          {isChecking && !trafficData && <LoadingSkeleton />}

          {trafficData && (
            <div className="space-y-5 animate-fade-in">

              {/* Destination header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Route to</div>
                  <div className="font-semibold text-white text-lg font-display truncate max-w-xs">
                    {destinationAddress || destination}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {trafficLevel && trafficBadge[trafficLevel]}
                  <TrafficLightIndicator level={trafficLevel} />
                </div>
              </div>

              {/* Recommendation Banner */}
              <RecommendationBanner
                level={trafficLevel}
                delayMinutes={delayMin}
                trafficDuration={trafficData.durationInTrafficSeconds}
                baseDuration={trafficData.durationSeconds}
              />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={<Clock className="w-6 h-6" />}
                  label="ETA (with traffic)"
                  value={formatDuration(trafficData.durationInTrafficSeconds)}
                  sub="current conditions"
                  color="cyan"
                />
                <StatCard
                  icon={<Timer className="w-6 h-6" />}
                  label="Normal Travel Time"
                  value={formatDuration(trafficData.durationSeconds)}
                  sub="without traffic"
                  color={trafficLevel === 'light' ? 'green' : 'yellow'}
                />
                <StatCard
                  icon={delayMin > 10 ? <TrendingUp className="w-6 h-6" /> : delayMin > 0 ? <Minus className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  label="Traffic Delay"
                  value={delayMin > 0 ? `+${delayMin} min` : 'No delay'}
                  sub={trafficLevel === 'heavy' ? 'consider waiting' : 'acceptable'}
                  color={trafficLevel === 'heavy' ? 'red' : trafficLevel === 'moderate' ? 'yellow' : 'green'}
                />
                <StatCard
                  icon={<MapPin className="w-6 h-6" />}
                  label="Distance"
                  value={formatDistance(trafficData.distanceMeters)}
                  sub="total route"
                  color="cyan"
                />
              </div>

              {/* Refresh button */}
              <button
                id="refresh-traffic-btn"
                onClick={() => checkTraffic(false)}
                disabled={isChecking}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh Traffic Data
              </button>

              {/* Notifications */}
              <NotificationPanel
                level={trafficLevel}
                onSubscribe={handleSubscribe}
                isSubscribed={isSubscribed}
                onUnsubscribe={handleUnsubscribe}
                notifThreshold={notifThreshold}
                setNotifThreshold={setNotifThreshold}
              />
            </div>
          )}

          {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
          {!trafficData && !isChecking && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-center text-lg font-semibold font-display text-gray-400">How it works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: '01',
                    icon: '📍',
                    title: 'Auto-detects location',
                    desc: 'We use your browser\'s GPS to pinpoint your current position in real time.',
                  },
                  {
                    step: '02',
                    icon: '🗺️',
                    title: 'Checks live traffic',
                    desc: 'Google Maps Routes API fetches live traffic on your route and estimates actual travel time.',
                  },
                  {
                    step: '03',
                    icon: '🔔',
                    title: 'Notifies at right time',
                    desc: 'Enable notifications and we\'ll ping you the moment traffic improves to your preferred level.',
                  },
                ].map((item) => (
                  <div key={item.step} className="glass-card p-6 text-center space-y-3">
                    <div className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{item.step}</div>
                    <div className="text-4xl">{item.icon}</div>
                    <div className="font-semibold text-white font-display">{item.title}</div>
                    <div className="text-sm text-gray-400 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-8 mt-10">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
            <div className="font-semibold text-gray-500 mb-1">iManage Traffic Advisor</div>
            <div>Powered by Google Maps Platform · Real-time traffic data</div>
          </div>
        </footer>
      </div>
    </>
  )
}
