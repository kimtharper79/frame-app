import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useShoots } from "../../hooks/useShoots";
import { useAuth } from "../../contexts/AuthContext";
import { Shoot, getOrCreateThread, sendMessage } from "../../lib/firestore";

const STYLE_TAGS = ["All", "Portrait", "Fashion", "Documentary", "Studio Lighting", "Editorial", "Experimental"];

// Seed data shown while Firestore is empty or loading
const SEED_SHOOTS: Shoot[] = [
  {
    id: "seed-1",
    photographerName: "Maya Chen",
    photographerInitials: "MC",
    title: "Studio Lighting Final — Rembrandt Study",
    date: "May 8, 2026",
    time: "2:00 PM - 5:00 PM",
    location: "Élan Building Studio B",
    modelsNeeded: 2,
    styleMood: "Classic Rembrandt lighting technique for my final portfolio. Looking for models comfortable with dramatic shadows and longer sitting times.",
    equipment: "Canon EOS R5, 85mm f/1.4, Profoto B10 lighting kit",
    tags: ["Portrait", "Studio Lighting"],
    bookingLink: "https://calendly.com/mayachen/studio-shoot",
    photoUrl: "https://images.unsplash.com/photo-1692594497527-8f3394a0ab5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBwaG90b2dyYXBoeSUyMGxpZ2h0aW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc4MDI2NTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "seed-2",
    photographerName: "Jordan Ellis",
    photographerInitials: "JE",
    title: "Editorial Fashion Shoot — Spring Collection",
    date: "May 10, 2026",
    time: "10:00 AM - 2:00 PM",
    location: "Boundary Street Studios",
    modelsNeeded: 3,
    styleMood: "Editorial series inspired by 1970s minimalism. Clean lines, neutral tones, flowing fabrics. Looking for diverse models comfortable with movement.",
    equipment: "Sony A7IV, 24-70mm f/2.8, natural light + reflectors",
    tags: ["Fashion", "Editorial"],
    bookingLink: null,
    photoUrl: null,
  },
  {
    id: "seed-3",
    photographerName: "Alex Rodriguez",
    photographerInitials: "AR",
    title: "Documentary Series — Savannah Street Life",
    date: "May 12, 2026",
    time: "8:00 AM - 12:00 PM",
    location: "Historic District (Meeting at Forsyth Park)",
    modelsNeeded: 1,
    styleMood: "Documenting daily life in Savannah's historic district. Candid, observational style. Need someone comfortable being photographed in public spaces.",
    equipment: "Fujifilm X-T5, 35mm f/2, handheld/natural light",
    tags: ["Documentary", "Experimental"],
    bookingLink: null,
    photoUrl: null,
  },
  {
    id: "seed-4",
    photographerName: "Sam Taylor",
    photographerInitials: "ST",
    title: "Experimental Light Painting Project",
    date: "May 14, 2026",
    time: "7:00 PM - 10:00 PM",
    location: "Montgomery Hall Room 204",
    modelsNeeded: 2,
    styleMood: "Creating abstract light paintings with human subjects. Models will need to hold still for 30-second exposures. Unique, experimental imagery.",
    equipment: "Nikon Z6II, 50mm f/1.8, LED wands, long exposure setup",
    tags: ["Experimental", "Studio Lighting"],
    bookingLink: "https://calendly.com/samtaylor/lightpainting",
    photoUrl: null,
  },
  {
    id: "seed-5",
    photographerName: "Riley Park",
    photographerInitials: "RP",
    title: "Senior Portfolio — Contemporary Portraiture",
    date: "May 15, 2026",
    time: "1:00 PM - 4:00 PM",
    location: "Élan Building Studio A",
    modelsNeeded: 1,
    styleMood: "Contemporary portraits with a focus on genuine expression. Mix of digital and film. Looking for someone expressive and comfortable in front of the camera.",
    equipment: "Canon 5D Mark IV, 50mm f/1.2, medium format film camera",
    tags: ["Portrait", "Editorial"],
    bookingLink: null,
    photoUrl: null,
  },
];

interface BoardProps {
  onNavigateToShoot: (shoot: Shoot) => void;
  onInterested: (threadId: string) => void;
}

export function Board({ onNavigateToShoot, onInterested }: BoardProps) {
  const { user, profile } = useAuth();
  const { shoots: firestoreShoots, loading } = useShoots();
  const [selectedTag, setSelectedTag] = useState("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Show Firestore data once loaded; fall back to seed shoots while loading or if empty
  const shoots = !loading && firestoreShoots.length > 0 ? firestoreShoots : SEED_SHOOTS;

  const filtered =
    selectedTag === "All"
      ? shoots
      : shoots.filter((s) => s.tags.includes(selectedTag));

  const handleInterested = async (shoot: Shoot) => {
    if (!user || !profile) {
      toast.error("Sign in to message photographers.");
      return;
    }
    if (!shoot.photographerUid) {
      toast("This photographer isn't on Frame yet — post your own shoot and they'll find you!");
      return;
    }
    if (shoot.photographerUid === user.uid) {
      toast("That's your own shoot!");
      return;
    }

    setBusyId(shoot.id);
    try {
      const threadId = await getOrCreateThread(
        {
          id: shoot.id,
          title: shoot.title,
          photographerUid: shoot.photographerUid,
          photographerName: shoot.photographerName,
          photographerInitials: shoot.photographerInitials,
        },
        {
          uid: user.uid,
          displayName: profile.displayName,
          initials: profile.initials,
        }
      );
      // Send the opening message and notify the photographer
      await sendMessage(threadId, user.uid, `I'm interested in your shoot: "${shoot.title}"`, shoot.photographerUid);
      onInterested(threadId);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send message. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header + filter */}
      <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[#1A1A1A] tracking-tight">Frame</h1>
          <button className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-[#1A1A1A]" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {STYLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full whitespace-nowrap min-h-[44px] transition-colors ${
                selectedTag === tag
                  ? "bg-[#F2A900] text-[#1A1A1A]"
                  : "bg-white text-[#6B6860] border border-[#E8E4DC]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[#E8E4DC] rounded-lg p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8E4DC]" />
                  <div className="h-4 bg-[#E8E4DC] rounded w-28" />
                </div>
                <div className="h-4 bg-[#E8E4DC] rounded w-3/4" />
                <div className="h-3 bg-[#E8E4DC] rounded w-1/2" />
                <div className="h-10 bg-[#E8E4DC] rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#1A1A1A] mb-2">No shoots posted yet.</p>
            <p className="text-sm text-[#6B6860]">Be the first — tap Post to share yours.</p>
          </div>
        )}

        {filtered.map((shoot) => (
          <div
            key={shoot.id}
            className="bg-white border border-[#E8E4DC] rounded-lg overflow-hidden"
          >
            {shoot.photoUrl && (
              <button
                onClick={() => onNavigateToShoot(shoot)}
                className="block w-full aspect-video overflow-hidden"
              >
                <img
                  src={shoot.photoUrl}
                  alt={shoot.title}
                  className="w-full h-full object-cover"
                />
              </button>
            )}

            <div className="p-4 space-y-3">
              {/* Photographer row */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
                  {shoot.photographerInitials}
                </div>
                <p className="text-[#1A1A1A]">{shoot.photographerName}</p>
              </div>

              {/* Shoot info — tapping opens detail */}
              <button
                onClick={() => onNavigateToShoot(shoot)}
                className="w-full text-left space-y-1"
              >
                <h3 className="text-[#1A1A1A]">{shoot.title}</h3>
                <p className="text-sm text-[#6B6860]">{shoot.date} • {shoot.time}</p>
                <p className="text-sm text-[#6B6860]">{shoot.location}</p>
                <p className="text-sm text-[#6B6860] mt-1">
                  {shoot.modelsNeeded} {shoot.modelsNeeded === 1 ? "model" : "models"} needed
                </p>
              </button>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {shoot.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[#E8E4DC] text-[#6B6860] rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleInterested(shoot)}
                disabled={busyId === shoot.id}
                className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
              >
                {busyId === shoot.id ? "Sending…" : "I'm interested"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
