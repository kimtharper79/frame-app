import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"

interface LoginProps {
  onLogin: () => void
}

function isScadEmail(email: string): boolean {
  const lower = email.toLowerCase().trim()
  return lower.endsWith("@scad.edu") || lower.endsWith("@student.scad.edu")
}

export function Login({ onLogin }: LoginProps) {
  const { user, signIn, createAccount } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) onLogin()
  }, [user, onLogin])

  const validate = (): boolean => {
    if (!isScadEmail(email)) {
      setError("Must be a valid SCAD email address.")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return false
    }
    return true
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!validate()) return
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err: any) {
      const code = err?.code ?? ""
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.")
      } else {
        setError("Sign in failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    setError("")
    if (!validate()) return
    setLoading(true)
    try {
      await createAccount(email.trim(), password)
    } catch (err: any) {
      const code = err?.code ?? ""
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in.")
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.")
      } else {
        setError("Could not create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center px-6">
      <h1 className="text-[#1A1A1A] mb-2 text-4xl">Frame</h1>
      <p className="text-[#6B6860] mb-12">The SCAD photo community.</p>

      <form onSubmit={handleSignIn} className="w-full space-y-4">
        <div>
          <label className="block text-[#1A1A1A] mb-2">SCAD Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yourname@student.scad.edu"
            autoComplete="email"
            className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          />
        </div>

        <div>
          <label className="block text-[#1A1A1A] mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={loading || !email || !password}
          className="w-full bg-white text-[#1A1A1A] py-3 rounded-lg min-h-[44px] border border-[#1A1A1A] active:bg-[#FAF8F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  )
}
