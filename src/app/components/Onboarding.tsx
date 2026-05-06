import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { updateUserProfile } from "../../lib/firestore";

interface OnboardingProps {
  onComplete: () => void;
}

const YEAR_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate",
  "Faculty",
  "Alumni",
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const INPUT =
  "w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]";

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("Junior");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) { toast.error("Add your name to continue."); return; }
    if (!major.trim()) { toast.error("Add your major to continue."); return; }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        initials: initialsFromName(displayName),
        major: major.trim(),
        role: year,
        bio: bio.trim(),
        onboarded: true,
      });
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 border-b border-[#E8E4DC] flex-shrink-0">
        <h1 className="text-[#1A1A1A] mb-1">Set up your profile.</h1>
        <p className="text-sm text-[#6B6860]">Help other students know who you are.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Your name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Kim Harper"
              autoComplete="name"
              className={INPUT}
            />
          </div>

          {/* Major */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Major</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g., Photography BFA"
              className={INPUT}
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={INPUT}
            >
              {YEAR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">
              Bio <span className="text-[#6B6860]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about what you shoot or what you're looking for..."
              className={`${INPUT} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60 font-medium"
          >
            {saving ? "Saving…" : "Let's go"}
          </button>
        </form>
      </div>
    </div>
  );
}
