import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"

interface LoginProps {
  onLogin: () => void
}

export function Login({ onLogin }: LoginProps) {
  const { user, sendLoginLink } = useAuth()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Firebase has already signed the user in (returning from magic link)
  useEffect(() => {
    if (user) onLogin()
  }, [user, onLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.toLowerCase().endsWith("@scad.edu")) {
      setError("Only @scad.edu email addresses are accepted.")
      return
    }

    setLoading(true)
    try {
      await sendLoginLink(email)
      setSent(true)
    } catch {
      setError("Failed to send login link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-[#1A1A1A] mb-2 text-4xl">Frame</h1>
        <p className="text-[#6B6860] mb-8">Check your SCAD email for a login link.</p>
        <p className="text-sm text-[#6B6860]">Sent to {email}</p>
        <button
          onClick={() => { setSent(false); setEmail("") }}
          className="mt-6 text-[#F2A900] text-sm underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center px-6">
      <h1 className="text-[#1A1A1A] mb-2 text-4xl">Frame</h1>
      <p className="text-[#6B6860] mb-12">The SCAD photo community.</p>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <label className="block text-[#1A1A1A] mb-2">SCAD Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yourname@scad.edu"
            className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Send me a login link"}
        </button>

        <p className="text-xs text-[#6B6860] text-center">
          Only .scad.edu emails are accepted.
        </p>
      </form>
    </div>
  )
}
