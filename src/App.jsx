import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nextHotspot, setNextHotspot] = useState(null)
  const [timeUntilNext, setTimeUntilNext] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [isHotspotActive, setIsHotspotActive] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [hotspotHistory, setHotspotHistory] = useState([])
  
  const intervalRef = useRef(null)
  const notificationRef = useRef(null)

  // Calculate next hotspot time based on 18:40 start time and 1h 15m intervals
  const calculateNextHotspot = () => {
    const now = new Date()
    
    // Create a reference point for today at 18:40
    const todayBase = new Date(now)
    todayBase.setHours(18, 40, 0, 0)
    
    // Create a reference point for tomorrow at 18:40
    const tomorrowBase = new Date(todayBase)
    tomorrowBase.setDate(tomorrowBase.getDate() + 1)
    
    // Find the most recent base time (18:40) that has passed
    let lastBaseTime
    if (now >= todayBase) {
      lastBaseTime = todayBase
    } else {
      // If we haven't reached 18:40 today, use yesterday's 18:40
      const yesterdayBase = new Date(todayBase)
      yesterdayBase.setDate(yesterdayBase.getDate() - 1)
      lastBaseTime = yesterdayBase
    }
    
    // Calculate how many 75-minute intervals have passed since the last base time
    const timeSinceLastBase = now.getTime() - lastBaseTime.getTime()
    const intervalsPassed = Math.floor(timeSinceLastBase / (75 * 60 * 1000))
    
    // Calculate the next hotspot time
    const nextTime = new Date(lastBaseTime.getTime() + ((intervalsPassed + 1) * 75 * 60 * 1000))
    
    return nextTime
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  // Send notification
  const sendNotification = (title, body) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, { body })
    }
  }

  // Update countdown timer
  const updateCountdown = () => {
    const now = new Date()
    setCurrentTime(now)
    
    const next = calculateNextHotspot()
    setNextHotspot(next)
    
    const timeDiff = next.getTime() - now.getTime()
    
    if (timeDiff <= 0) {
      // Hotspot is active
      setIsHotspotActive(true)
      setTimeUntilNext({ hours: 0, minutes: 0, seconds: 0 })
      
      // Send notification if not already sent
      if (!notificationRef.current) {
        sendNotification('🎣 Metin2 Fishing Hotspot Active!', 'A fishing hotspot is now active!')
        notificationRef.current = true
        
        // Add to history
        setHotspotHistory(prev => [...prev, {
          time: now.toLocaleTimeString(),
          date: now.toLocaleDateString()
        }])
      }
    } else {
      setIsHotspotActive(false)
      notificationRef.current = false
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
      
      setTimeUntilNext({ hours, minutes, seconds })
    }
  }

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission()
    
    // Initial update
    updateCountdown()
    
    // Set up interval for countdown updates
    intervalRef.current = setInterval(updateCountdown, 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatCountdown = ({ hours, minutes, seconds }) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎣 Metin2 Fishing Hotspot Tracker</h1>
      </header>
      
      <main className="app-main">
        <div className="current-time">
          <h2>Current Time</h2>
          <div className="time-display">{formatTime(currentTime)}</div>
        </div>
        
        <div className={`hotspot-status ${isHotspotActive ? 'active' : 'inactive'}`}>
          <h2>{isHotspotActive ? '🎣 HOTSPOT ACTIVE!' : 'Next Fishing Hotspot'}</h2>
          {isHotspotActive ? (
            <div className="active-message">
              <p>Fishing hotspot is currently active!</p>
              <p>Go fishing now!</p>
            </div>
          ) : (
            <div className="countdown">
              <div className="countdown-display">{formatCountdown(timeUntilNext)}</div>
              <p>Next hotspot at: {nextHotspot ? formatTime(nextHotspot) : 'Calculating...'}</p>
            </div>
          )}
        </div>
        
        <div className="notifications-section">
          <h3>Notifications</h3>
          <button 
            onClick={requestNotificationPermission}
            className={`notification-btn ${notificationsEnabled ? 'enabled' : 'disabled'}`}
          >
            {notificationsEnabled ? '✅ Notifications Enabled' : '🔔 Enable Notifications'}
          </button>
        </div>
        
        {hotspotHistory.length > 0 && (
          <div className="history-section">
            <h3>Recent Hotspots</h3>
            <div className="history-list">
              {hotspotHistory.slice(-5).reverse().map((hotspot, index) => (
                <div key={index} className="history-item">
                  {hotspot.date} at {hotspot.time}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="info-section">
          <h3>How it works</h3>
          <ul>
            <li>Fishing hotspots occur every 1 hour and 15 minutes</li>
            <li>Base time is 18:40 (6:40 PM)</li>
            <li>The app tracks time even when closed</li>
            <li>Enable notifications to get alerts when hotspots are active</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default App
