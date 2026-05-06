import { useEffect, useState } from 'react'
import { Shoot, subscribeToShoots } from '../lib/firestore'

export function useShoots() {
  const [shoots, setShoots] = useState<Shoot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToShoots((data) => {
      setShoots(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { shoots, loading }
}
