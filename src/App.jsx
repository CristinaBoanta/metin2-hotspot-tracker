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

  // Calculate next hotspot time based on 21:18 start time and 1h 20m intervals
  const calculateNextHotspot = () => {
    const now = new Date()
    
    // Create a reference point for today at 21:18
    const todayBase = new Date(now)
    todayBase.setHours(21, 18, 0, 0)
    
    // Create a reference point for tomorrow at 18:50
    const tomorrowBase = new Date(todayBase)
    tomorrowBase.setDate(tomorrowBase.getDate() + 1)
    
    // Find the most recent base time (21:18) that has passed
    let lastBaseTime
    if (now >= todayBase) {
      lastBaseTime = todayBase
    } else {
      // If we haven't reached 21:18 today, use yesterday's 21:18
      const yesterdayBase = new Date(todayBase)
      yesterdayBase.setDate(yesterdayBase.getDate() - 1)
      lastBaseTime = yesterdayBase
    }
    
    // Calculate how many 80-minute intervals have passed since the last base time
    const timeSinceLastBase = now.getTime() - lastBaseTime.getTime()
    const intervalsPassed = Math.floor(timeSinceLastBase / (80 * 60 * 1000))
    
    // Calculate the next hotspot time
    const nextTime = new Date(lastBaseTime.getTime() + ((intervalsPassed + 1) * 80 * 60 * 1000))
    
    return nextTime
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  // Send intrusive notification with multiple alert methods
  const sendIntrusiveNotification = (title, body) => {
    // 1. Browser notification (if enabled)
    if (notificationsEnabled && 'Notification' in window) {
      try {
        const notification = new Notification(title, { 
          body,
          icon: '/vite.svg',
          requireInteraction: true, // Keep notification visible until user interacts
          silent: false, // Ensure sound plays
          tag: 'fishing-hotspot', // Group notifications
          badge: '/vite.svg'
        })
        
        // Keep notification open longer for more intrusiveness
        setTimeout(() => {
          notification.close()
        }, 30000) // 30 seconds instead of 10
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }

    // 2. Audio alert (works even without notification permission)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Create an attention-grabbing sound pattern
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      // Play multiple beeps
      setTimeout(() => {
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      }, 600)
    } catch (error) {
      console.error('Failed to play audio alert:', error)
    }

    // 3. Page title flashing (works when tab is not focused)
    let flashCount = 0
    const originalTitle = document.title
    const flashInterval = setInterval(() => {
      document.title = flashCount % 2 === 0 ? '🎣 FISHING HOTSPOT ACTIVE! 🎣' : originalTitle
      flashCount++
      if (flashCount >= 10) { // Flash for 5 seconds
        clearInterval(flashInterval)
        document.title = originalTitle
      }
    }, 500)

    // 4. Console logging for debugging
    console.log('🎣 INTRUSIVE NOTIFICATION SENT:', title, body)
    console.log('🎣 FISHING HOTSPOT IS NOW ACTIVE! 🎣')
  }

  // Update countdown timer
  const updateCountdown = () => {
    const now = new Date()
    setCurrentTime(now)
    
    const next = calculateNextHotspot()
    setNextHotspot(next)
    
    const timeDiff = next.getTime() - now.getTime()
    
    // Check if we're within 1 second of the hotspot time (more reliable trigger)
    if (timeDiff <= 1000 && timeDiff > -60000) { // Within 1 second before or 1 minute after
      // Hotspot is active
      setIsHotspotActive(true)
      setTimeUntilNext({ hours: 0, minutes: 0, seconds: 0 })
      
      // Send intrusive notification if not already sent for this hotspot
      if (!notificationRef.current) {
        sendIntrusiveNotification('🎣 Metin2 Fishing Hotspot Active!', 'A fishing hotspot is now active!')
        notificationRef.current = true
        
        // Add to history
        setHotspotHistory(prev => [...prev, {
          time: now.toLocaleTimeString(),
          date: now.toLocaleDateString()
        }])
      }
    } else {
      setIsHotspotActive(false)
      // Reset notification flag when we're far from hotspot time
      if (timeDiff > 60000) { // More than 1 minute away
        notificationRef.current = false
      }
      
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
             className={`notification-btn ${notificationsEnabled ? 'enabled' : 'disabled'} btn-margin`}
           >
             {notificationsEnabled ? '✅ Notifications Enabled' : '🔔 Enable Notifications'}
           </button>
           
           <button 
             onClick={() => sendIntrusiveNotification('🎣 TEST: Fishing Hotspot Active!', 'This is a test notification to check all alert methods!')}
             className="test-notification-btn"
             style={{ 
               marginTop: '10px',
               padding: '12px 24px',
               backgroundColor: '#ff6b6b',
               color: 'white',
               border: 'none',
               borderRadius: '40px',
               cursor: 'pointer',
               fontSize: '1.1rem'
             }}
           >
             🧪 Test All Notifications Now
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
            <li>Fishing hotspots occur every 1 hour and 20 minutes</li>
            <li>Base time is 21:18 (9:18 PM)</li>
            <li>The app tracks time even when closed</li>
            <li>Enable notifications to get alerts when hotspots are active</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default App
