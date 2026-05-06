import { useEffect, useState } from 'react'
import { subscribeToThreads } from '../lib/firestore'

export function useUnreadCount(uid: string | null) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) return
    return subscribeToThreads(uid, (threads) => {
      setCount(threads.filter(t => t.unreadFor?.includes(uid)).length)
    })
  }, [uid])

  return count
}
