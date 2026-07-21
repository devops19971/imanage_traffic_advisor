import { useState, useEffect, useRef, useCallback } from 'react'
import SeoHead from '../components/SeoHead'
import toast from 'react-hot-toast'
import {
  MapPin, Navigation, Clock, Bell, ChevronRight,
  Zap, RefreshCw, AlertTriangle, CheckCircle, Timer,
  TrendingDown, TrendingUp, Minus, Car, X, Search,
  ArrowRight, Shield, Radio
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1) // A5
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1)
  } catch (e) {
    console.error('Audio play failed', e)
  }
}

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

// ─── Floating Particles ──────────────────────────────────────────────────────

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${8 + Math.random() * 12}s`,
    size: `${1 + Math.random() * 2}px`,
    opacity: 0.2 + Math.random() * 0.4,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: '-5%',
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  )
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
    <div ref={wrapperRef} className="relative z-50">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 pointer-events-none z-10 transition-colors duration-300" />
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
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 animate-fade-in" style={{ background: 'rgba(13, 20, 36, 0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          {isSearching && <div className="px-4 py-3 text-xs text-gray-500">Searching…</div>}
          {suggestions.map((s, i) => (
            <button key={s.id || i} onClick={() => handleSelect(s)} className="w-full flex items-start gap-3 px-5 py-4 hover:bg-cyan-500/5 transition-all duration-200 text-left border-b border-white/[0.04] last:border-0 group/item">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-cyan-500/15 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate group-hover/item:text-white transition-colors">{s.name}</div>
                {s.address && s.address !== s.name && <div className="text-xs text-gray-500 truncate mt-0.5">{s.address}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
      {showDropdown && !isSearching && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl px-4 py-5 z-50 text-center text-sm text-gray-500 animate-fade-in" style={{ background: 'rgba(13, 20, 36, 0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
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
      <div className="rounded-2xl p-3 flex flex-col gap-2.5 relative" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
        {['red', 'yellow', 'green'].map((color) => {
          const active = (color === 'red' && level === 'heavy') || (color === 'yellow' && level === 'moderate') || (color === 'green' && level === 'light')
          const glowMap = {
            red: 'bg-red-400 shadow-[0_0_18px_5px_rgba(248,113,113,0.6)]',
            yellow: 'bg-amber-300 shadow-[0_0_18px_5px_rgba(251,191,36,0.6)]',
            green: 'bg-emerald-400 shadow-[0_0_18px_5px_rgba(52,211,153,0.6)]',
          }
          return <div key={color} className={`w-7 h-7 rounded-full transition-all duration-700 ${active ? `${glowMap[color]} scale-110` : 'bg-gray-700/50 scale-90 opacity-20'}`} />
        })}
      </div>
      <span className="text-[10px] text-gray-600 font-medium tracking-wide">Traffic</span>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'cyan' }) {
  const colorMap = {
    cyan: { bg: 'from-cyan-500/8 to-blue-500/5', border: 'border-cyan-500/15', iconBg: 'bg-cyan-500/10', iconBorder: 'border-cyan-500/20', iconText: 'text-cyan-400' },
    green: { bg: 'from-emerald-500/8 to-green-500/5', border: 'border-emerald-500/15', iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/20', iconText: 'text-emerald-400' },
    red: { bg: 'from-red-500/8 to-orange-500/5', border: 'border-red-500/15', iconBg: 'bg-red-500/10', iconBorder: 'border-red-500/20', iconText: 'text-red-400' },
    yellow: { bg: 'from-amber-500/8 to-yellow-500/5', border: 'border-amber-500/15', iconBg: 'bg-amber-500/10', iconBorder: 'border-amber-500/20', iconText: 'text-amber-400' },
  }
  const c = colorMap[color]
  return (
    <div className={`stat-card bg-gradient-to-br ${c.bg} ${c.border} border rounded-2xl p-5 flex flex-col gap-3.5`}>
      <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconBorder} border flex items-center justify-center`}>
        <div className={c.iconText}>{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold font-display text-white tracking-tight">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</div>
    </div>
  )
}

// ─── Recommendation Banner ────────────────────────────────────────────────────

function RecommendationBanner({ level, delayMinutes, trafficDuration, baseDuration, destination }) {
  if (!level) return null

  // Acceptable traffic (light or moderate)
  if (level === 'light' || level === 'moderate') {
    const isLight = level === 'light'
    const colorClass = isLight ? 'text-emerald-400' : 'text-amber-400'
    const bgClass = isLight
      ? 'border-emerald-500/30 from-emerald-500/10 to-green-600/5'
      : 'border-amber-500/30 from-amber-500/10 to-yellow-600/5'
    const iconBgClass = isLight
      ? 'bg-emerald-500/15 border-emerald-500/25'
      : 'bg-amber-500/15 border-amber-500/25'

    return (
      <div className={`leave-now-glow rounded-2xl border bg-gradient-to-br ${bgClass} p-6 flex items-center gap-5 animate-slide-up`}>
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
          {isLight ? <CheckCircle className={`w-7 h-7 ${colorClass}`} /> : <AlertTriangle className={`w-7 h-7 ${colorClass}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`${colorClass} font-bold text-xl font-display tracking-tight`}>{isLight ? '✅ Leave Now!' : '⏳ Moderate Traffic'}</div>
          <div className="text-gray-300/90 text-sm mt-1.5 leading-relaxed">
            You are ready to leave at this moment for <span className="text-white font-semibold">{destination}</span>.
            <br/><span className="opacity-70">ETA: {formatDuration(trafficDuration)} {delayMinutes > 0 ? `(${delayMinutes} min extra)` : ''}</span>
          </div>
        </div>
        <div className="text-5xl flex-shrink-0 hidden sm:block">{isLight ? '🚀' : '🟡'}</div>
      </div>
    )
  }

  // Not acceptable traffic (heavy)
  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-600/5 p-6 flex items-center gap-5 animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0"><Timer className="w-7 h-7 text-red-400" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-red-400 font-bold text-xl font-display tracking-tight">🔴 Wait — Heavy Traffic</div>
        <div className="text-gray-300/90 text-sm mt-1.5 leading-relaxed">
          Traffic is not acceptable for <span className="text-white font-semibold">{destination}</span> right now ({delayMinutes} min extra delay).
          <br/><span className="text-cyan-300/90 font-medium">Please enable notifications below to be alerted when it clears.</span>
        </div>
      </div>
      <div className="text-5xl flex-shrink-0 hidden sm:block">🚗</div>
    </div>
  )
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({ level, onSubscribe, isSubscribed, onUnsubscribe, notifThreshold, setNotifThreshold, onSimulate }) {
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { if (level === 'heavy') setExpanded(true) }, [level])

  if (isSubscribed) return (
    <div className="glass-card p-6 flex flex-col gap-4 animate-slide-up notif-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white font-display">Notifications Active 🔔</div>
          <div className="text-gray-400 text-sm mt-0.5">Checking every 5 min. Alert when traffic is <span className="text-cyan-400 font-medium">{notifThreshold === 'light' ? 'Light' : 'Moderate or better'}</span>.</div>
        </div>
        <button onClick={onUnsubscribe} className="text-gray-500 hover:text-red-400 transition-all p-2.5 rounded-xl hover:bg-red-500/10" title="Cancel"><X className="w-5 h-5" /></button>
      </div>
      <button onClick={onSimulate} className="text-xs text-amber-400 hover:text-amber-300 w-full text-center py-2.5 border border-amber-500/15 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-all mt-1">🧪 Simulate Traffic Drop (Test Notification)</button>
    </div>
  )

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-6 flex items-center gap-4 hover:bg-white/[0.03] transition-all duration-300 text-left group">
        <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
          <Bell className="w-6 h-6 text-violet-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white font-display">Get Notified When Traffic Improves</div>
          <div className="text-gray-500 text-sm mt-0.5">Enable browser push — we'll ping you at the right moment.</div>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-6 pb-6 pt-5 space-y-5 animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Notify me when traffic is:</label>
            <div className="flex gap-3">
              {[{ value: 'light', label: '🟢 Light', desc: 'Best condition' }, { value: 'moderate', label: '🟡 Moderate', desc: 'Acceptable' }].map((opt) => (
                <button key={opt.value} onClick={() => setNotifThreshold(opt.value)} className={`flex-1 py-3.5 px-4 rounded-xl border text-sm font-medium transition-all duration-300 ${notifThreshold === opt.value ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/5' : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.05] hover:border-white/10'}`}>
                  <div>{opt.label}</div>
                  <div className="text-xs opacity-50 mt-0.5">{opt.desc}</div>
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
      <div className="h-36 rounded-2xl shimmer" />
      <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}</div>
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
  const pollingIntervalRef = useRef(null)

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
    // Reset notification state when user explicitly re-checks traffic
    if (!silent) {
      setIsChecking(true)
      if (isSubscribed) {
        setIsSubscribed(false)
        if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }
      }
    }
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
          playNotificationSound()
          const msg = `Traffic is ${level}! Leave now for ${selectedDestination.name}. ETA: ${formatDuration(data.durationInTrafficSeconds)}`

          // Native OS Banner
          try { new Notification('🚦 iManage Traffic Advisor', { body: msg }) } catch(e) { console.error('Notification failed', e) }

          // In-App Banner (Fallback & visual feedback)
          toast.success(msg, { duration: 8000, position: 'top-right' })

          setIsSubscribed(false)
          if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }
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
    pollingIntervalRef.current = interval
    checkTraffic(true)
  }

  const handleUnsubscribe = () => {
    setIsSubscribed(false)
    if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }
    toast('Notifications disabled.', { icon: '🔕' })
  }

  // Auto-cancel polling if the user changes their route (origin or destination)
  useEffect(() => {
    if (isSubscribed) {
      setIsSubscribed(false)
      if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, selectedDestination])

  useEffect(() => () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current) }, [])

  const handleSimulateDrop = () => {
    if (!trafficData) return
    const mockData = {
      ...trafficData,
      durationInTrafficSeconds: trafficData.durationSeconds,
      trafficDelaySeconds: 0
    }

    // Play sound and trigger fake notification for testing purposes
    playNotificationSound()
    const msg = `Traffic is light! Leave now for ${selectedDestination.name}. ETA: ${formatDuration(mockData.durationInTrafficSeconds)}`

    // Native OS Banner
    try { new Notification('🧪 TEST ALERT: Traffic is Light!', { body: msg }) } catch(e) { console.error('Notification failed', e) }

    // In-App Banner
    toast.success(msg, { duration: 8000, position: 'top-right' })

    // (We intentionally DO NOT clear the polling interval or modify actual state,
    // so the real background checker continues running uninterrupted!)
  }

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
      <div className="min-h-screen bg-[#06090f] text-gray-200">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="hero-mesh relative py-20 md:py-28 lg:py-32">
          <div className="hero-grid absolute inset-0 pointer-events-none" />
          <FloatingParticles />

          {/* Subtle gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob blob-1 absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-400" />
            <div className="blob blob-2 absolute top-1/2 -right-32 w-[400px] h-[400px] bg-violet-500" />
            <div className="blob blob-3 absolute -bottom-28 left-1/3 w-[350px] h-[350px] bg-blue-500" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Top pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-medium mb-10 animate-fade-in feature-pill">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300">Powered by <span className="text-cyan-400 font-semibold">TomTom</span> Real-Time Traffic</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] mb-6 font-display animate-slide-up">
              <span className="block text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-cyan-400/80 mb-4">iManage</span>
              <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-violet-300 bg-clip-text text-transparent">
                Traffic Advisor
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto leading-relaxed mb-12 animate-slide-up-delay-1">
              Enter your destination, see <span className="text-gray-200 font-medium">live traffic conditions</span>, and know exactly when to leave. Get notified when traffic clears.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 animate-slide-up-delay-2">
              {[
                { icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />, text: 'Real-time traffic' },
                { icon: <Navigation className="w-3.5 h-3.5 text-emerald-400" />, text: 'Precise GPS' },
                { icon: <Bell className="w-3.5 h-3.5 text-violet-400" />, text: 'Smart alerts' },
                { icon: <Shield className="w-3.5 h-3.5 text-amber-400" />, text: 'Free forever' },
              ].map((s) => (
                <div key={s.text} className="feature-pill">
                  {s.icon}
                  <span className="text-gray-400 text-sm">{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#06090f] to-transparent pointer-events-none" />
        </section>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 pb-12 space-y-7 relative z-10">

          {/* ── INPUT CARD ────────────────────────────────────────────────── */}
          <div className="card-glow p-7 sm:p-8 space-y-6 relative z-50">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-display text-white">Plan Your Journey</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter origin & destination to check live traffic</p>
              </div>
            </div>

            <div className="gradient-divider" />

            {/* ── Location: IDLE — show Allow button ── */}
            {locationPermission === 'idle' && (
              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/8 to-indigo-500/5 p-6 animate-fade-in">
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-2xl">📍</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm font-display">Location Access Required</div>
                    <div className="text-gray-500 text-xs mt-1 leading-relaxed">We need your precise GPS location to check traffic on your route.</div>
                  </div>
                  <button id="allow-location-btn" onClick={getCurrentLocation} className="btn-primary py-3 px-6 text-sm flex-shrink-0">
                    <Navigation className="w-4 h-4" />Allow Location
                  </button>
                </div>
              </div>
            )}

            {/* ── Location: REQUESTING — browser prompt is open ── */}
            {locationPermission === 'requesting' && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 flex items-center gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-medium text-cyan-300 font-display">Waiting for your approval…</div>
                  <div className="text-xs text-gray-500 mt-1">A browser popup appeared at the top — click <strong className="text-white">Allow</strong> to share your precise location.</div>
                </div>
              </div>
            )}

            {/* ── Location: DENIED ── */}
            {locationPermission === 'denied' && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="text-sm font-medium text-red-300 font-display">Location Access Blocked</div>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed pl-[52px]">
                  {locationError}<br />
                  <span className="text-gray-500 mt-1 block">To fix: Click the <strong className="text-white">🔒 lock</strong> in your address bar → <strong className="text-white">Site settings</strong> → set Location to <strong className="text-white">Allow</strong> → refresh page.</span>
                </div>
                <div className="pl-[52px]">
                  <button onClick={getCurrentLocation} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 mt-1">
                    <RefreshCw className="w-3 h-3" /> Try again
                  </button>
                </div>
              </div>
            )}

            {/* ── Location: GRANTED — show address + manual correction option ── */}
            {locationPermission === 'granted' && (
              <div className="space-y-2 relative z-50">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500">Your Current Location</label>

                {!locationManualMode ? (
                  // ─ GPS detected address ─
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all min-w-0" style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Navigation className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate text-emerald-300">
                            {isLocating ? 'Detecting precise location…' : (locationName || (currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Detected'))}
                          </div>
                          {locationFullAddress && locationFullAddress !== locationName && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{locationFullAddress}</div>
                          )}
                        </div>
                      </div>
                      <button id="refresh-location-btn" onClick={getCurrentLocation} disabled={isLocating} title="Re-detect location" className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-gray-500 hover:text-cyan-400 transition-all duration-300 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    {/* Not your location? Fix it link */}
                    <button
                      onClick={() => { setLocationManualMode(true); setManualLocationValue('') }}
                      className="mt-2.5 text-xs text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3" />
                      Not your exact location? Fix it manually
                    </button>
                  </div>
                ) : (
                  // ─ Manual location search mode ─
                  <div className="space-y-3 animate-fade-in">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-300/90 flex items-start gap-2.5">
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
            <div className="relative z-40">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Destination</label>
              <PlacesAutocomplete
                currentLocation={currentLocation}
                value={searchValue}
                onChange={(v) => { setSearchValue(v); if (!v) { setSelectedDestination(null); setTrafficData(null) } }}
                onSelect={(s) => setSelectedDestination(s)}
              />
              {selectedDestination && (
                <div className="flex items-center gap-2 mt-2.5 text-xs text-emerald-400/90">
                  <CheckCircle className="w-3.5 h-3.5" />Destination confirmed — ready to check traffic
                </div>
              )}
            </div>

            {/* ── Check Traffic Button ── */}
            <button
              id="check-traffic-btn"
              onClick={() => checkTraffic(false)}
              disabled={isChecking || !currentLocation || !selectedDestination}
              className="w-full btn-primary justify-center py-4 text-base disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isChecking ? <><RefreshCw className="w-5 h-5 animate-spin" /> Checking Live Traffic…</> : <><Zap className="w-5 h-5" /> Check Traffic Now</>}
            </button>

            {lastChecked && (
              <p className="text-xs text-gray-600 text-center">
                Last checked: {lastChecked.toLocaleTimeString()}
                {isSubscribed && <span className="ml-2 text-cyan-600">• Auto-refreshing every 5 min</span>}
              </p>
            )}
          </div>

          {/* ── TRAFFIC RESULTS ────────────────────────────────────────────── */}
          {isChecking && !trafficData && <LoadingSkeleton />}

          {trafficData && (
            <div className="space-y-6 animate-fade-in">
              {/* Route header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Route to</div>
                  <div className="font-semibold text-white text-xl font-display tracking-tight mt-1">{selectedDestination?.name || searchValue}</div>
                  {selectedDestination?.address && selectedDestination.address !== selectedDestination.name && (
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{selectedDestination.address}</div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {trafficLevel && trafficBadge[trafficLevel]}
                  <TrafficLightIndicator level={trafficLevel} />
                </div>
              </div>

              <RecommendationBanner level={trafficLevel} delayMinutes={delayMin} trafficDuration={trafficData.durationInTrafficSeconds} baseDuration={trafficData.durationSeconds} destination={selectedDestination?.name || searchValue} />

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard icon={<Clock className="w-5 h-5" />} label="ETA with traffic" value={formatDuration(trafficData.durationInTrafficSeconds)} sub="live conditions" color="cyan" />
                <StatCard icon={<Timer className="w-5 h-5" />} label="Normal travel time" value={formatDuration(trafficData.durationSeconds)} sub="without traffic" color={trafficLevel === 'light' ? 'green' : 'yellow'} />
                <StatCard icon={delayMin > 10 ? <TrendingUp className="w-5 h-5" /> : delayMin > 0 ? <Minus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />} label="Traffic delay" value={delayMin > 0 ? `+${delayMin} min` : 'No delay'} sub={trafficLevel === 'heavy' ? 'consider waiting' : 'acceptable'} color={trafficLevel === 'heavy' ? 'red' : trafficLevel === 'moderate' ? 'yellow' : 'green'} />
                <StatCard icon={<MapPin className="w-5 h-5" />} label="Distance" value={formatDistance(trafficData.distanceMeters)} sub="total route" color="cyan" />
              </div>

              {/* Refresh button */}
              <button id="refresh-traffic-btn" onClick={() => checkTraffic(false)} disabled={isChecking} className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all duration-300 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />Refresh Traffic Data
              </button>

              {/* Notification panel */}
              { (trafficLevel === 'heavy' || isSubscribed) && (
                <NotificationPanel level={trafficLevel} onSubscribe={handleSubscribe} isSubscribed={isSubscribed} onUnsubscribe={handleUnsubscribe} notifThreshold={notifThreshold} setNotifThreshold={setNotifThreshold} onSimulate={handleSimulateDrop} />
              )}
            </div>
          )}

          {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
          {!trafficData && !isChecking && (
            <div className="space-y-8 pt-4 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-semibold font-display text-white mb-2">How it works</h2>
                <p className="text-sm text-gray-500">Three simple steps to smarter commuting</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { step: '01', icon: <Navigation className="w-7 h-7 text-cyan-400" />, title: 'Allow Location', desc: 'Click the Allow Location button. Your browser shows a native permission prompt — tap Allow for precise GPS access.', color: 'cyan' },
                  { step: '02', icon: <Radio className="w-7 h-7 text-violet-400" />, title: 'Live Traffic Check', desc: 'TomTom real-time traffic data gives you the actual travel time right now on your route.', color: 'violet' },
                  { step: '03', icon: <Bell className="w-7 h-7 text-emerald-400" />, title: 'Smart Notification', desc: "Enable notifications and we'll ping you the moment traffic drops to your preferred level.", color: 'emerald' },
                ].map((item, i) => (
                  <div key={item.step} className={`step-card glass-card p-7 text-center space-y-4 ${i === 0 ? 'animate-slide-up' : i === 1 ? 'animate-slide-up-delay-1' : 'animate-slide-up-delay-2'}`}>
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Step {item.step}</div>
                    <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${item.color === 'cyan' ? 'bg-cyan-500/10 border border-cyan-500/20' : item.color === 'violet' ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                      {item.icon}
                    </div>
                    <div className="font-semibold text-white font-display text-base">{item.title}</div>
                    <div className="text-sm text-gray-500 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="py-10 mt-6">
          <div className="gradient-divider max-w-4xl mx-auto mb-8" />
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="font-semibold text-gray-500 mb-1.5 font-display text-sm">iManage Traffic Advisor</div>
            <div className="text-xs text-gray-600">Real-time traffic data by TomTom · Free forever, no billing required</div>
          </div>
        </footer>
      </div>
    </>
  )
}
