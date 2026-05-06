import { useState } from "react";
import { ArrowLeft, Plus, Minus, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { createShoot } from "../../lib/firestore";
import { uploadImage } from "../../lib/storage";

interface PostShootProps {
  onBack: () => void;
  onSubmit: () => void;
}

const AVAILABLE_TAGS = [
  "Portrait", "Fashion", "Documentary", "Studio Lighting",
  "Editorial", "Experimental", "Product", "Landscape", "Street",
];

export function PostShoot({ onBack, onSubmit }: PostShootProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [equipment, setEquipment] = useState("");
  const [bookingLink, setBookingLink] = useState("");
  const [modelsNeeded, setModelsNeeded] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Format date/time for display
      const displayDate = date
        ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "";

      await createShoot({
        photographerUid: user.uid,
        photographerName: profile.displayName,
        photographerInitials: profile.initials,
        title: title.trim(),
        date: displayDate,
        time: time || "TBD",
        location: location.trim(),
        modelsNeeded,
        description: description.trim(),
        equipment: equipment.trim(),
        tags: selectedTags,
        bookingLink: bookingLink.trim() || null,
        photoUrl,
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <h1 className="text-[#1A1A1A] mb-6">Post a shoot.</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Shoot Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Studio Lighting Final — Rembrandt Study"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">
              Add a shoot photo <span className="text-[#6B6860]">(optional)</span>
            </label>
            {photoPreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <img src={photoPreview} alt="Shoot" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
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
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
              />
            </div>
            <div>
              <label className="block text-[#1A1A1A] mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
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
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
            />
          </div>

          {/* Models needed */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Models Needed</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setModelsNeeded(Math.max(1, modelsNeeded - 1))}
                className="w-[44px] h-[44px] flex items-center justify-center bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A]"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-xl text-[#1A1A1A] min-w-[2rem] text-center">{modelsNeeded}</span>
              <button
                type="button"
                onClick={() => setModelsNeeded(modelsNeeded + 1)}
                className="w-[44px] h-[44px] flex items-center justify-center bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Style/Mood Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the style, mood, and what you're looking for in models..."
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900] resize-none"
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">Equipment Being Used</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g., Canon EOS R5, 85mm f/1.4, Profoto B10 lighting kit"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
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

          {/* Booking link */}
          <div>
            <label className="block text-[#1A1A1A] mb-2">
              Booking Link <span className="text-[#6B6860]">(optional)</span>
            </label>
            <input
              type="url"
              value={bookingLink}
              onChange={(e) => setBookingLink(e.target.value)}
              placeholder="https://calendly.com/yourname/shoot"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post it."}
          </button>
        </form>
      </div>
    </div>
  );
}
