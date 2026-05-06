import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  Collab,
  subscribeToCollabs,
  createCollab,
  deleteCollab,
} from "../../lib/firestore";

interface CollabsProps {
  onOpenMessages: () => void;
}

// Shown while Firestore collection is empty or loading
const SEED_COLLABS: Collab[] = [
  {
    id: "seed-c1",
    posterUid: "",
    posterName: "Zoe Park",
    posterInitials: "ZP",
    title: "Fashion Design Final — Need a Photographer",
    whatYouNeed: "Studio photographer comfortable with editorial strobes",
    major: "Fashion Design BFA",
    deadline: "May 14, 2026",
    description:
      "Shooting my senior collection in the Élan studio. May 14, 10 am – 2 pm. Editorial look, structured lighting.",
    lookingFor: "Photography student",
  },
  {
    id: "seed-c2",
    posterUid: "",
    posterName: "Marcus Webb",
    posterInitials: "MW",
    title: "Brand Identity Project — Looking for Documentary Photographer",
    whatYouNeed: "Documentary photographer for two sessions",
    major: "Graphic Design BFA",
    deadline: "Flexible",
    description:
      "Documenting a local Savannah business for my capstone. Flexible scheduling, two sessions.",
    lookingFor: "Any photographer",
  },
  {
    id: "seed-c3",
    posterUid: "",
    posterName: "Priya Nair",
    posterInitials: "PN",
    title: "Film Short — Need a Still Photographer for BTS",
    whatYouNeed: "BTS stills on location in the Historic District",
    major: "Film and Television MFA",
    deadline: "May 17–18, 2026",
    description:
      "Behind-the-scenes stills for a short film. May 17–18, shooting on location.",
    lookingFor: "Any photographer",
  },
];

const LOOKING_FOR_OPTIONS = ["Photography student", "Any photographer", "Alumni"];

const INPUT =
  "w-full px-3 py-2 bg-white border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900] text-sm";

export function Collabs({ onOpenMessages }: CollabsProps) {
  const { user, profile } = useAuth();

  const [firestoreCollabs, setFirestoreCollabs] = useState<Collab[]>([]);
  const [fsLoading, setFsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [whatYouNeed, setWhatYouNeed] = useState("");
  const [major, setMajor] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [lookingFor, setLookingFor] = useState("Photography student");

  // Subscribe to Firestore collabs
  useEffect(() => {
    return subscribeToCollabs((data) => {
      setFirestoreCollabs(data);
      setFsLoading(false);
    });
  }, []);

  // Pre-fill major from profile when form opens
  useEffect(() => {
    if (showForm && profile?.major && !major) setMajor(profile.major);
  }, [showForm, profile]);

  const collabs =
    !fsLoading && firestoreCollabs.length > 0 ? firestoreCollabs : SEED_COLLABS;

  const resetForm = () => {
    setTitle("");
    setWhatYouNeed("");
    setMajor(profile?.major ?? "");
    setDeadline("");
    setDescription("");
    setLookingFor("Photography student");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!title.trim()) { toast.error("Add a title."); return; }
    if (!whatYouNeed.trim()) { toast.error("Describe what you need."); return; }

    setSubmitting(true);
    try {
      const displayDeadline = deadline
        ? new Date(deadline + "T12:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Flexible";

      await createCollab({
        posterUid: user.uid,
        posterName: profile.displayName,
        posterInitials: profile.initials,
        title: title.trim(),
        whatYouNeed: whatYouNeed.trim(),
        major: major.trim(),
        deadline: displayDeadline,
        description: description.trim(),
        lookingFor,
      });

      toast.success("Collab request posted!");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't post. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collab: Collab) => {
    if (!window.confirm(`Delete "${collab.title}"?`)) return;
    try {
      await deleteCollab(collab.id);
      toast.success("Deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete. Try again.");
    }
  };

  const handleInterested = (posterName: string) => {
    toast(`Message ${posterName} in the Messages tab — collab DMs coming soon.`);
    onOpenMessages();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
        <h1 className="text-[#1A1A1A] mb-4">Collabs</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors font-medium"
        >
          {showForm ? "Cancel" : "Post a collab request"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ── Inline form ───────────────────────────────────────────────── */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[#1A1A1A]">New collab request</h3>
              <button type="button" onClick={resetForm} className="p-1 text-[#6B6860]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#1A1A1A] mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fashion Final — Need a Photographer"
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-sm text-[#1A1A1A] mb-1">What you need</label>
              <input
                type="text"
                value={whatYouNeed}
                onChange={(e) => setWhatYouNeed(e.target.value)}
                placeholder="e.g., Studio photographer, 3 hours"
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-sm text-[#1A1A1A] mb-1">Your major</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g., Fashion Design BFA"
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-sm text-[#1A1A1A] mb-1">
                Deadline <span className="text-[#6B6860]">(optional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-sm text-[#1A1A1A] mb-1">Brief description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell photographers more about your project..."
                className={`${INPUT} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm text-[#1A1A1A] mb-1">Looking for</label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className={INPUT}
              >
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post it."}
            </button>
          </form>
        )}

        {/* ── Collab cards ──────────────────────────────────────────────── */}
        {collabs.map((collab) => {
          const isOwn =
            !!user && collab.posterUid !== "" && collab.posterUid === user.uid;
          return (
            <div
              key={collab.id}
              className="bg-white border border-[#E8E4DC] rounded-lg p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
                    {collab.posterInitials}
                  </div>
                  <div>
                    <p className="text-[#1A1A1A]">{collab.posterName}</p>
                    <p className="text-sm text-[#6B6860]">{collab.major}</p>
                  </div>
                </div>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(collab)}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B6860] active:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div>
                <h3 className="text-[#1A1A1A] mb-1">{collab.title}</h3>
                {collab.whatYouNeed && (
                  <p className="text-sm text-[#6B6860] mb-1">Need: {collab.whatYouNeed}</p>
                )}
                <p className="text-sm text-[#1A1A1A] leading-relaxed mb-2">
                  {collab.description}
                </p>
                <p className="text-sm text-[#6B6860]">Looking for: {collab.lookingFor}</p>
                <p className="text-sm text-[#6B6860]">{collab.deadline}</p>
              </div>

              {!isOwn && (
                <button
                  onClick={() => handleInterested(collab.posterName)}
                  className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors"
                >
                  I'm interested
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
