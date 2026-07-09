import { useState, useEffect, useRef, useCallback } from 'react'
import SeoHead from '../components/SeoHead'
import toast from 'react-hot-toast'
import {
  MapPin, Navigation, Clock, Bell, ChevronRight,
  Zap, RefreshCw, AlertTriangle, CheckCircle, Timer,
  TrendingDown, TrendingUp, Minus, Car, X, Search
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—'
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

// ─── Autocomplete ─────────────────────────────────────────────────────────────

function PlacesAutocomplete({ currentLocation, onSelect, value, onChange }) {
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({ q: val.trim() })
        if (currentLocation) { params.append('lat', currentLocation.lat); params.append('lng', currentLocation.lng) }
        const res = await fetch(`/api/search-places?${params}`)
        const data = await res.json()
        setSuggestions(data.results || [])
        setShowDropdown(true)
      } catch { setSuggestions([]) } finally { setIsSearching(false) }
    }, 350)
  }

  const handleSelect = (s) => { onChange(s.address || s.name); onSelect(s); setSuggestions([]); setShowDropdown(false) }
  const handleClear = () => { onChange(''); onSelect(null); setSuggestions([]); setShowDropdown(false) }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
        <input
          id="destination-input"
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search destination — city, landmark, address…"
          className="input-field pl-11 pr-10"
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {isSearching && <div className="px-4 py-3 text-xs text-gray-500">Searching…</div>}
          {suggestions.map((s, i) => (
            <button key={s.id || i} onClick={() => handleSelect(s)} className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
              <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{s.name}</div>
                {s.address && s.address !== s.name && <div className="text-xs text-gray-500 truncate mt-0.5">{s.address}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
      {showDropdown && !isSearching && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl px-4 py-4 z-50 text-center text-sm text-gray-500">
          No results found. Try a different search.
        </div>
      )}
    </div>
  )
}

// ─── Traffic Light ────────────────────────────────────────────────────────────

function TrafficLightIndicator({ level }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="bg-gray-800 border border-white/10 rounded-xl p-2.5 flex flex-col gap-2 shadow-xl">
        {['red', 'yellow', 'green'].map((color) => {
          const active = (color === 'red' && level === 'heavy') || (color === 'yellow' && level === 'moderate') || (color === 'green' && level === 'light')
          const glowMap = {
            red: 'bg-red-500 shadow-[0_0_14px_4px_rgba(239,68,68,0.7)]',
            yellow: 'bg-yellow-400 shadow-[0_0_14px_4px_rgba(245,158,11,0.7)]',
            green: 'bg-green-500 shadow-[0_0_14px_4px_rgba(16,185,129,0.7)]',
          }
          return <div key={color} className={`w-7 h-7 rounded-full transition-all duration-700 ${active ? `${glowMap[color]} scale-110` : 'bg-gray-700 scale-90 opacity-30'}`} />
        })}
      </div>
      <span className="text-[10px] text-gray-600 font-medium">Traffic</span>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'cyan' }) {
  const colorMap = { cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20', green: 'from-green-500/10 to-emerald-500/10 border-green-500/20', red: 'from-red-500/10 to-orange-500/10 border-red-500/20', yellow: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20' }
  const iconColor = { cyan: 'text-cyan-400', green: 'text-green-400', red: 'text-red-400', yellow: 'text-yellow-400' }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 flex flex-col gap-3 animate-slide-up`}>
      <div className={iconColor[color]}>{icon}</div>
      <div>
        <div className="text-2xl font-bold font-display text-white">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  )
}

// ─── Recommendation Banner ────────────────────────────────────────────────────

function RecommendationBanner({ level, delayMinutes, trafficDuration, baseDuration }) {
  if (!level) return null
  if (level === 'light') return (
    <div className="leave-now-glow rounded-2xl border border-green-500/40 bg-gradient-to-br from-green-500/15 to-emerald-600/10 p-6 flex items-center gap-5 animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-7 h-7 text-green-400" /></div>
      <div className="flex-1">
        <div className="text-green-400 font-bold text-xl font-display">✅ Leave Now!</div>
        <div className="text-gray-300 text-sm mt-1">Traffic is light — ETA <span className="text-white font-semibold">{formatDuration(trafficDuration)}</span>.{delayMinutes > 0 ? ` Just ${delayMinutes} min extra.` : ' No delay at all!'}</div>
      </div>
      <div className="text-5xl">🚀</div>
    </div>
  )
  if (level === 'moderate') return (
    <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/15 to-amber-600/10 p-6 flex items-center gap-5 animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-7 h-7 text-yellow-400" /></div>
      <div className="flex-1">
        <div className="text-yellow-400 font-bold text-xl font-display">⏳ Moderate Traffic</div>
        <div className="text-gray-300 text-sm mt-1"><span className="text-white font-semibold">{delayMinutes} min delay</span>. You can leave if needed — waiting may help.</div>
      </div>
      <div className="text-5xl">🟡</div>
    </div>
  )
  return (
    <div className="rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-500/15 to-orange-600/10 p-6 flex items-center gap-5 animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0"><Timer className="w-7 h-7 text-red-400" /></div>
      <div className="flex-1">
        <div className="text-red-400 font-bold text-xl font-display">🔴 Wait — Heavy Traffic</div>
        <div className="text-gray-300 text-sm mt-1"><span className="text-white font-semibold">{delayMinutes} min extra delay</span> vs normal. Enable notifications — we'll alert you when it clears.</div>
      </div>
      <div className="text-5xl">🚗</div>
    </div>
  )
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({ level, onSubscribe, isSubscribed, onUnsubscribe, notifThreshold, setNotifThreshold }) {
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { if (level === 'heavy') setExpanded(true) }, [level])

  if (isSubscribed) return (
    <div className="glass-card p-6 flex items-center gap-4 animate-slide-up">
      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0"><Bell className="w-6 h-6 text-cyan-400" /></div>
      <div className="flex-1">
        <div className="font-semibold text-white">Notifications Active 🔔</div>
        <div className="text-gray-400 text-sm mt-0.5">Checking every 5 min. Alert when traffic is <span className="text-cyan-400 font-medium">{notifThreshold === 'light' ? 'Light' : 'Moderate or better'}</span>.</div>
      </div>
      <button onClick={onUnsubscribe} className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Cancel"><X className="w-5 h-5" /></button>
    </div>
  )

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-colors text-left">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0"><Bell className="w-6 h-6 text-purple-400" /></div>
        <div className="flex-1">
          <div className="font-semibold text-white">Get Notified When Traffic Improves</div>
          <div className="text-gray-400 text-sm mt-0.5">Enable browser push — we'll ping you at the right moment.</div>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-6 pb-6 border-t border-white/5 pt-5 space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Notify me when traffic is:</label>
            <div className="flex gap-3">
              {[{ value: 'light', label: '🟢 Light', desc: 'Best condition' }, { value: 'moderate', label: '🟡 Moderate', desc: 'Acceptable' }].map((opt) => (
                <button key={opt.value} onClick={() => setNotifThreshold(opt.value)} className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${notifThreshold === opt.value ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <div>{opt.label}</div>
                  <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={onSubscribe} className="w-full btn-primary justify-center py-3.5"><Bell className="w-5 h-5" />Enable Notifications</button>
          <p className="text-xs text-gray-600 text-center">Traffic checked every 5 min. Dismiss anytime.</p>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-32 rounded-2xl shimmer bg-gray-800/50" />
      <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer bg-gray-800/50" />)}</div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [searchValue, setSearchValue] = useState('')
  const [selectedDestination, setSelectedDestination] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [locationFullAddress, setLocationFullAddress] = useState('')
  const [locationError, setLocationError] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationPermission, setLocationPermission] = useState('idle')
  // Manual location override (when GPS is inaccurate)
  const [locationManualMode, setLocationManualMode] = useState(false)
  const [manualLocationValue, setManualLocationValue] = useState('')
  const [trafficData, setTrafficData] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notifThreshold, setNotifThreshold] = useState('light')
  const [pollingInterval, setPollingInterval] = useState(null)

  // ── Reverse geocode (server-side proxy, key never exposed) ────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (data.displayName) {
        setLocationName(data.displayName)
        setLocationFullAddress(data.freeformAddress || data.displayName)
      } else {
        setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        setLocationFullAddress('')
      }
    } catch {
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }, [])

  // ── Triggers native browser "Allow / Block" permission prompt ─────────────
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocationPermission('denied')
      return
    }
    setIsLocating(true)
    setLocationError(null)
    setLocationPermission('requesting')   // shows "Waiting for approval" UI
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCurrentLocation(coords)
        setIsLocating(false)
        setLocationPermission('granted')
        reverseGeocode(coords.lat, coords.lng)
      },
      (err) => {
        setIsLocating(false)
        setLocationPermission('denied')
        if (err.code === 1) {
          setLocationError('Location access denied. Click the 🔒 lock icon in your address bar → Site settings → Allow location.')
        } else {
          setLocationError('Could not get your location. Check GPS signal and try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [reverseGeocode])

  // On mount: check if permission was already granted/denied previously
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          getCurrentLocation()   // auto-fetch silently, no popup needed
        } else if (result.state === 'denied') {
          setLocationPermission('denied')
          setLocationError('Location blocked. Click the 🔒 lock icon in your browser address bar → Site settings → Allow location, then refresh.')
        }
        // state === 'prompt' → stay idle, our Allow card will show
      }).catch(() => { /* Permissions API unavailable — stay idle */ })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Check Traffic ─────────────────────────────────────────────────────────
  const checkTraffic = useCallback(async (silent = false) => {
    if (!currentLocation) { toast.error('Please allow location access first.'); return }
    if (!selectedDestination) { toast.error('Please select a destination from the suggestions.'); return }
    if (!silent) setIsChecking(true)
    try {
      const res = await fetch('/api/check-traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: currentLocation, destination: { lat: selectedDestination.lat, lng: selectedDestination.lng } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch traffic data')
      setTrafficData(data)
      setLastChecked(new Date())
      if (isSubscribed && Notification.permission === 'granted') {
        const level = getTrafficLevel(data.durationSeconds, data.durationInTrafficSeconds)
        const thresholdMet = notifThreshold === 'light' ? level === 'light' : level !== 'heavy'
        if (thresholdMet) {
          new Notification('🚦 iManage Traffic Advisor', { body: `Traffic is ${level}! Leave now for ${selectedDestination.name}. ETA: ${formatDuration(data.durationInTrafficSeconds)}`, icon: '/favicon.ico' })
          toast.success('Traffic improved — notification sent!')
        }
      }
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to check traffic.')
    } finally {
      if (!silent) setIsChecking(false)
    }
  }, [currentLocation, selectedDestination, isSubscribed, notifThreshold])

  // ── Notifications ─────────────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!selectedDestination) { toast.error('Please select a destination first.'); return }
    if (!currentLocation) { toast.error('Please allow location access first.'); return }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') { toast.error('Notification permission denied.'); return }
    setIsSubscribed(true)
    toast.success("Notifications enabled! We'll check every 5 minutes.")
    const interval = setInterval(() => checkTraffic(true), 5 * 60 * 1000)
    setPollingInterval(interval)
    checkTraffic(true)
  }

  const handleUnsubscribe = () => {
    setIsSubscribed(false)
    if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null) }
    toast('Notifications disabled.', { icon: '🔕' })
  }

  useEffect(() => () => { if (pollingInterval) clearInterval(pollingInterval) }, [pollingInterval])

  const trafficLevel = trafficData ? getTrafficLevel(trafficData.durationSeconds, trafficData.durationInTrafficSeconds) : null
  const delayMin = trafficData ? getDelayMinutes(trafficData.durationSeconds, trafficData.durationInTrafficSeconds) : 0

  const trafficBadge = {
    light: <span className="traffic-badge-green"><span className="traffic-dot traffic-dot-green" />Light Traffic</span>,
    moderate: <span className="traffic-badge-yellow"><span className="traffic-dot traffic-dot-yellow" />Moderate Traffic</span>,
    heavy: <span className="traffic-badge-red"><span className="traffic-dot traffic-dot-red" />Heavy Traffic</span>,
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <SeoHead />
      <div className="min-h-screen bg-gray-950 text-gray-100">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-950 py-16 md:py-24">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob blob-1 absolute -top-32 -left-32 w-96 h-96 bg-cyan-400" />
            <div className="blob blob-2 absolute top-1/2 -right-20 w-80 h-80 bg-blue-500" />
            <div className="blob blob-3 absolute -bottom-20 left-1/3 w-72 h-72 bg-indigo-500" />
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-cyan-300 mb-8">
              <Car className="w-4 h-4" />Powered by TomTom Real-Time Traffic
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 font-display">
              <span className="block text-sm font-bold uppercase tracking-widest text-cyan-400 mb-3">iManage</span>
              <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">Traffic Advisor</span>
            </h1>
            <p className="text-lg text-blue-200 max-w-xl mx-auto leading-relaxed mb-10">
              Enter your destination, see <span className="text-white font-semibold">live traffic conditions</span>, and know exactly when to leave. Get notified when traffic clears.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[{ icon: '⚡', text: 'Real-time TomTom traffic' }, { icon: '📍', text: 'Precise GPS location' }, { icon: '🔔', text: 'Smart notifications' }, { icon: '🆓', text: 'No billing required' }].map((s) => (
                <div key={s.text} className="flex items-center gap-2 text-blue-300"><span>{s.icon}</span><span>{s.text}</span></div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          {/* ── INPUT CARD ────────────────────────────────────────────────── */}
          <div className="card-glow p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold font-display">Plan Your Journey</h2>
            </div>

            {/* ── Location: IDLE — show Allow button ── */}
            {locationPermission === 'idle' && (
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-5 animate-fade-in">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-2xl">📍</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">Location Access Required</div>
                    <div className="text-gray-400 text-xs mt-0.5">We need your precise GPS location to check traffic on your route.</div>
                  </div>
                  <button id="allow-location-btn" onClick={getCurrentLocation} className="btn-primary py-2.5 px-5 text-sm flex-shrink-0">
                    <Navigation className="w-4 h-4" />Allow Location
                  </button>
                </div>
              </div>
            )}

            {/* ── Location: REQUESTING — browser prompt is open ── */}
            {locationPermission === 'requesting' && (
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 flex items-center gap-4 animate-fade-in">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-cyan-300">Waiting for your approval…</div>
                  <div className="text-xs text-gray-400 mt-0.5">A browser popup appeared at the top — click <strong className="text-white">Allow</strong> to share your precise location.</div>
                </div>
              </div>
            )}

            {/* ── Location: DENIED ── */}
            {locationPermission === 'denied' && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="text-sm font-medium text-red-300">Location Access Blocked</div>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  {locationError}<br />
                  <span className="text-gray-500 mt-1 block">To fix: Click the <strong className="text-white">🔒 lock</strong> in your address bar → <strong className="text-white">Site settings</strong> → set Location to <strong className="text-white">Allow</strong> → refresh page.</span>
                </div>
                <button onClick={getCurrentLocation} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Try again
                </button>
              </div>
            )}

            {/* ── Location: GRANTED — show address + manual correction option ── */}
            {locationPermission === 'granted' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Your Current Location</label>

                {!locationManualMode ? (
                  // ─ GPS detected address ─
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-green-500/30 bg-green-500/10 transition-all min-w-0">
                        <Navigation className="w-4 h-4 flex-shrink-0 text-green-400" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate text-green-300">
                            {isLocating ? 'Detecting precise location…' : (locationName || (currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Detected'))}
                          </div>
                          {locationFullAddress && locationFullAddress !== locationName && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{locationFullAddress}</div>
                          )}
                        </div>
                      </div>
                      <button id="refresh-location-btn" onClick={getCurrentLocation} disabled={isLocating} title="Re-detect location" className="p-3.5 rounded-xl border border-white/10 bg-gray-800/60 hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-all disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    {/* Not your location? Fix it link */}
                    <button
                      onClick={() => { setLocationManualMode(true); setManualLocationValue('') }}
                      className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3" />
                      Not your exact location? Fix it manually
                    </button>
                  </div>
                ) : (
                  // ─ Manual location search mode ─
                  <div className="space-y-2 animate-fade-in">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>GPS placed you at <strong className="text-white">{locationName}</strong>. Search your exact address below to correct it.</span>
                    </div>
                    <PlacesAutocomplete
                      currentLocation={currentLocation}
                      value={manualLocationValue}
                      onChange={(v) => setManualLocationValue(v)}
                      onSelect={(s) => {
                        if (s) {
                          setCurrentLocation({ lat: s.lat, lng: s.lng })
                          setLocationName(s.name || s.address)
                          setLocationFullAddress(s.address || s.name)
                          setLocationManualMode(false)
                          toast.success('Location updated! ✅')
                        }
                      }}
                    />
                    <button
                      onClick={() => setLocationManualMode(false)}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3 h-3" /> Cancel — keep detected location
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Destination Autocomplete ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Destination</label>
              <PlacesAutocomplete
                currentLocation={currentLocation}
                value={searchValue}
                onChange={(v) => { setSearchValue(v); if (!v) { setSelectedDestination(null); setTrafficData(null) } }}
                onSelect={(s) => setSelectedDestination(s)}
              />
              {selectedDestination && (
                <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />Destination confirmed — ready to check traffic
                </div>
              )}
            </div>

            {/* ── Check Traffic Button ── */}
            <button
              id="check-traffic-btn"
              onClick={() => checkTraffic(false)}
              disabled={isChecking || !currentLocation || !selectedDestination}
              className="w-full btn-primary justify-center py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isChecking ? <><RefreshCw className="w-5 h-5 animate-spin" /> Checking Live Traffic…</> : <><Zap className="w-5 h-5" /> Check Traffic Now</>}
            </button>

            {lastChecked && (
              <p className="text-xs text-gray-600 text-center">
                Last checked: {lastChecked.toLocaleTimeString()}
                {isSubscribed && <span className="ml-2 text-cyan-700">• Auto-refreshing every 5 min</span>}
              </p>
            )}
          </div>

          {/* ── TRAFFIC RESULTS ────────────────────────────────────────────── */}
          {isChecking && !trafficData && <LoadingSkeleton />}

          {trafficData && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Route to</div>
                  <div className="font-semibold text-white text-lg font-display">{selectedDestination?.name || searchValue}</div>
                  {selectedDestination?.address && selectedDestination.address !== selectedDestination.name && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{selectedDestination.address}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {trafficLevel && trafficBadge[trafficLevel]}
                  <TrafficLightIndicator level={trafficLevel} />
                </div>
              </div>

              <RecommendationBanner level={trafficLevel} delayMinutes={delayMin} trafficDuration={trafficData.durationInTrafficSeconds} baseDuration={trafficData.durationSeconds} />

              <div className="grid grid-cols-2 gap-4">
                <StatCard icon={<Clock className="w-6 h-6" />} label="ETA with traffic" value={formatDuration(trafficData.durationInTrafficSeconds)} sub="live conditions" color="cyan" />
                <StatCard icon={<Timer className="w-6 h-6" />} label="Normal travel time" value={formatDuration(trafficData.durationSeconds)} sub="without traffic" color={trafficLevel === 'light' ? 'green' : 'yellow'} />
                <StatCard icon={delayMin > 10 ? <TrendingUp className="w-6 h-6" /> : delayMin > 0 ? <Minus className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />} label="Traffic delay" value={delayMin > 0 ? `+${delayMin} min` : 'No delay'} sub={trafficLevel === 'heavy' ? 'consider waiting' : 'acceptable'} color={trafficLevel === 'heavy' ? 'red' : trafficLevel === 'moderate' ? 'yellow' : 'green'} />
                <StatCard icon={<MapPin className="w-6 h-6" />} label="Distance" value={formatDistance(trafficData.distanceMeters)} sub="total route" color="cyan" />
              </div>

              <button id="refresh-traffic-btn" onClick={() => checkTraffic(false)} disabled={isChecking} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />Refresh Traffic Data
              </button>

              <NotificationPanel level={trafficLevel} onSubscribe={handleSubscribe} isSubscribed={isSubscribed} onUnsubscribe={handleUnsubscribe} notifThreshold={notifThreshold} setNotifThreshold={setNotifThreshold} />
            </div>
          )}

          {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
          {!trafficData && !isChecking && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-center text-lg font-semibold font-display text-gray-400">How it works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '01', icon: '📍', title: 'Click Allow Location', desc: 'Click the Allow Location button. Your browser shows a native permission prompt — tap Allow for precise GPS access.' },
                  { step: '02', icon: '🗺️', title: 'Checks live traffic', desc: 'TomTom real-time traffic data gives you the actual travel time right now on your route.' },
                  { step: '03', icon: '🔔', title: 'Notifies at right time', desc: "Enable notifications and we'll ping you the moment traffic drops to your preferred level." },
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

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-8 mt-10">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
            <div className="font-semibold text-gray-500 mb-1">iManage Traffic Advisor</div>
            <div>Real-time traffic data by TomTom · Free forever, no billing required</div>
          </div>
        </footer>
      </div>
    </>
  )
}
