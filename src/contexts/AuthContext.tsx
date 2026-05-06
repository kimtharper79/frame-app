import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import {
  UserProfile,
  getOrCreateUserProfile,
  subscribeToUserProfile,
} from '../lib/firestore'

const EMAIL_KEY = 'frameEmailForSignIn'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  sendLoginLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  // Firestore profile — created on first sign-in, kept in sync
  useEffect(() => {
    if (!user?.email) return
    let profileUnsub: (() => void) | undefined

    getOrCreateUserProfile(user.uid, user.email).then(() => {
      profileUnsub = subscribeToUserProfile(user.uid, (p) => {
        setProfile(p)
        setLoading(false)
      })
    })

    return () => profileUnsub?.()
  }, [user])

  // Complete email link sign-in when the user returns via the magic link
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return
    const email = window.localStorage.getItem(EMAIL_KEY)
    if (!email) return

    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        window.localStorage.removeItem(EMAIL_KEY)
        window.history.replaceState({}, document.title, window.location.pathname)
      })
      .catch(console.error)
  }, [])

  const sendLoginLink = async (email: string) => {
    const appUrl =
      import.meta.env.VITE_APP_URL ||
      window.location.origin + window.location.pathname
    await sendSignInLinkToEmail(auth, email, {
      url: appUrl,
      handleCodeInApp: true,
    })
    window.localStorage.setItem(EMAIL_KEY, email)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, sendLoginLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
