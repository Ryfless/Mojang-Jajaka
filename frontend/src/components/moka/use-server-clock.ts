import { useEffect, useState } from 'react'

export function useServerClock(serverTime?: string) {
  const [now, setNow] = useState(() => (serverTime ? Date.parse(serverTime) : Date.now()))
  useEffect(() => {
    const offset = serverTime ? Date.parse(serverTime) - Date.now() : 0
    const timer = setInterval(() => {
      setNow(Date.now() + offset)
    }, 1000)
    return () => clearInterval(timer)
  }, [serverTime])
  return now
}
