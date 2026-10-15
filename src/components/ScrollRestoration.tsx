import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())

  useEffect(() => {
    return () => {
      positions.current.set(location.key, window.scrollY)
    }
  }, [location])

  useEffect(() => {
    if (navigationType === 'POP') {
      const y = positions.current.get(location.key)
      window.scrollTo(0, y ?? 0)
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.key, navigationType])

  return null
}
