import { useState, useEffect } from "react";
import { Plus, Minus, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { createShoot, createCollab } from "../../lib/firestore";
import { uploadImage } from "../../lib/storage";

interface PostShootProps {
  onBack: () => void;
  onSubmit: () => void;
}

const AVAILABLE_TAGS = [
  "Portrait", "Fashion", "Documentary", "Studio Lighting",
  "Editorial", "Experimental", "Product", "Landscape", "Street",
];

const LOOKING_FOR_OPTIONS = ["Photography student", "Any photographer", "Alumni"];

const INPUT =
  "w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]";

export function PostShoot({ onBack, onSubmit }: PostShootProps) {
  const { user, profile } = useAuth();

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const [postType, setPostType] = useState<"shoot" | "collab">("shoot");

  // ── Shoot form state ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [styleMood, setStyleMood] = useState("");
  const [equipment, setEquipment] = useState("");
  const [modelsNeeded, setModelsNeeded] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ── Collab form state ────────────────────────────────────────────────────────
  const [collabTitle, setCollabTitle] = useState("");
  const [whatYouNeed, setWhatYouNeed] = useState("");
  const [collabMajor, setCollabMajor] = useState("");
  const [collabDeadline, setCollabDeadline] = useState("");
  const [collabDescription, setCollabDescription] = useState("");
  const [collabLookingFor, setCollabLookingFor] = useState("Photography student");

  const [submitting, setSubmitting] = useState(false);

  // Pre-fill collabMajor from profile
  useEffect(() => {
    if (profile?.major && !collabMajor) setCollabMajor(profile.major);
  }, [profile]);

  // ── Shoot helpers ────────────────────────────────────────────────────────────
  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Shoot submit ─────────────────────────────────────────────────────────────
  const handleShootSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!title.trim()) { toast.error("Add a shoot title."); return; }
    if (!date) { toast.error("Add a date."); return; }
    if (!location.trim()) { toast.error("Add a location."); return; }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadImage(
          photoFile,
          `shoots/${user.uid}/${Date.now()}_${photoFile.name}`
        );
      }

      const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });

      await createShoot({
        photographerUid: user.uid,
        photographerName: profile.displayName,
        photographerInitials: profile.initials,
        title: title.trim(),
        date: displayDate,
        time: time || "TBD",
        location: location.trim(),
        modelsNeeded,
        styleMood: styleMood.trim(),
        equipment: equipment.trim(),
        tags: selectedTags,
        bookingLink: null,
        photoUrl,
        createdBy: user.email ?? "",
      });

      toast.success("Shoot posted!");
      onSubmit();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Collab submit ────────────────────────────────────────────────────────────
  const handleCollabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!collabTitle.trim()) { toast.error("Add a title."); return; }
    if (!whatYouNeed.trim()) { toast.error("Describe what you need."); return; }

    setSubmitting(true);
    try {
      const displayDeadline = collabDeadline
        ? new Date(collabDeadline + "T12:00:00").toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })
        : "Flexible";

      await createCollab({
        posterUid: user.uid,
        posterName: profile.displayName,
        posterInitials: profile.initials,
        title: collabTitle.trim(),
        whatYouNeed: whatYouNeed.trim(),
        major: collabMajor.trim(),
        deadline: displayDeadline,
        description: collabDescription.trim(),
        lookingFor: collabLookingFor,
      });

      toast.success("Collab request posted!");
      onSubmit();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
        <h1 className="text-[#1A1A1A]">Post.</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-8">
        {/* ── Segmented toggle ─────────────────────────────────────────── */}
        <div className="flex bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-1 mb-6">
          {(["shoot", "collab"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors min-h-[36px] ${
                postType === type
                  ? "bg-[#F2A900] text-[#1A1A1A]"
                  : "text-[#6B6860]"
              }`}
            >
              {type === "shoot" ? "Shoot" : "Collab"}
            </button>
          ))}
        </div>

        {/* ── Shoot form ───────────────────────────────────────────────── */}
        {postType === "shoot" && (
          <form onSubmit={handleShootSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Shoot Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Studio Lighting Final — Rembrandt Study"
                className={INPUT}
              />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">
                Shoot Photo <span className="text-[#6B6860]">(optional)</span>
              </label>
              {photoPreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <img src={photoPreview} alt="Shoot" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-[#1A1A1A] bg-opacity-70 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="block w-full aspect-video border-2 border-dashed border-[#F2A900] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#D99500] transition-colors">
                  <Camera className="w-12 h-12 text-[#F2A900] mb-2" />
                  <span className="text-sm text-[#F2A900]">Tap to upload</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1A1A1A] mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-[#1A1A1A] mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Élan Building Studio B"
                className={INPUT}
              />
            </div>

            {/* Models needed */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Models Needed</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setModelsNeeded(Math.max(1, modelsNeeded - 1))}
                  className="w-[44px] h-[44px] flex items-center justify-center bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg"
                >
                  <Minus className="w-5 h-5 text-[#1A1A1A]" />
                </button>
                <span className="text-xl text-[#1A1A1A] min-w-[2rem] text-center">{modelsNeeded}</span>
                <button
                  type="button"
                  onClick={() => setModelsNeeded(modelsNeeded + 1)}
                  className="w-[44px] h-[44px] flex items-center justify-center bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg"
                >
                  <Plus className="w-5 h-5 text-[#1A1A1A]" />
                </button>
              </div>
            </div>

            {/* Style/Mood */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Style / Mood</label>
              <textarea
                rows={4}
                value={styleMood}
                onChange={(e) => setStyleMood(e.target.value)}
                placeholder="Describe the vibe, lighting, wardrobe, and what you need from models..."
                className={`${INPUT} resize-none`}
              />
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-[#1A1A1A] mb-2">Equipment</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g., Canon EOS R5, 85mm f/1.4, Profoto B10"
                className={INPUT}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[#1A1A1A] mb-3">Style Tags</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full min-h-[44px] transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[#F2A900] text-[#1A1A1A]"
                        : "bg-[#FAF8F5] text-[#6B6860] border border-[#E8E4DC]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
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

        {/* ── Collab form ──────────────────────────────────────────────── */}
        {postType === "collab" && (
          <form onSubmit={handleCollabSubmit} className="space-y-6">
            <div>
              <label className="block text-[#1A1A1A] mb-2">Title</label>
              <input
                type="text"
                value={collabTitle}
                onChange={(e) => setCollabTitle(e.target.value)}
                placeholder="e.g., Fashion Final — Need a Photographer"
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] mb-2">What you need</label>
              <input
                type="text"
                value={whatYouNeed}
                onChange={(e) => setWhatYouNeed(e.target.value)}
                placeholder="e.g., Studio photographer, 3 hours"
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] mb-2">Your major</label>
              <input
                type="text"
                value={collabMajor}
                onChange={(e) => setCollabMajor(e.target.value)}
                placeholder="e.g., Fashion Design BFA"
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] mb-2">
                Deadline <span className="text-[#6B6860]">(optional)</span>
              </label>
              <input
                type="date"
                value={collabDeadline}
                onChange={(e) => setCollabDeadline(e.target.value)}
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] mb-2">Brief description</label>
              <textarea
                rows={4}
                value={collabDescription}
                onChange={(e) => setCollabDescription(e.target.value)}
                placeholder="Tell photographers more about your project..."
                className={`${INPUT} resize-none`}
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] mb-2">Looking for</label>
              <select
                value={collabLookingFor}
                onChange={(e) => setCollabLookingFor(e.target.value)}
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
      </div>
    </div>
  );
}
