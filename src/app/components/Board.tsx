import { useState } from "react";
import { SlidersHorizontal, Search, Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useShoots } from "../../hooks/useShoots";
import { useAuth } from "../../contexts/AuthContext";
import {
  Shoot,
  markInterest,
  deleteShoot,
} from "../../lib/firestore";

// ─── Constants ───────────────────────────────────────────────────────────────

const STYLE_TAGS = [
  "All", "Portrait", "Fashion", "Documentary",
  "Studio Lighting", "Editorial", "Experimental", "Street", "Product", "Landscape",
];

const FILTER_TAGS = STYLE_TAGS.filter((t) => t !== "All");
const MODEL_OPTS  = ["Any", "1", "2", "3+"];
const DATE_OPTS   = ["Any time", "This week", "This month"];
const FRAME_URL   = "https://kimtharper79.github.io/frame-app/";

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_SHOOTS: Shoot[] = [
  {
    id: "seed-1",
    photographerName: "Maya Chen",
    photographerInitials: "MC",
    title: "Studio Lighting Final — Rembrandt Study",
    date: "May 8, 2026",
    time: "2:00 PM – 5:00 PM",
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
    time: "10:00 AM – 2:00 PM",
    location: "Boundary Street Studios",
    modelsNeeded: 3,
    styleMood: "Editorial series inspired by 1970s minimalism. Clean lines, neutral tones, flowing fabrics.",
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
    time: "8:00 AM – 12:00 PM",
    location: "Historic District (Meeting at Forsyth Park)",
    modelsNeeded: 1,
    styleMood: "Documenting daily life in Savannah's historic district. Candid, observational style.",
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
    time: "7:00 PM – 10:00 PM",
    location: "Montgomery Hall Room 204",
    modelsNeeded: 2,
    styleMood: "Creating abstract light paintings with human subjects. Models hold still for 30-second exposures.",
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
    time: "1:00 PM – 4:00 PM",
    location: "Élan Building Studio A",
    modelsNeeded: 1,
    styleMood: "Contemporary portraits with a focus on genuine expression. Mix of digital and film.",
    equipment: "Canon 5D Mark IV, 50mm f/1.2, medium format film camera",
    tags: ["Portrait", "Editorial"],
    bookingLink: null,
    photoUrl: null,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isShootPast(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  } catch {
    return false;
  }
}

function isInDateRange(dateStr: string, range: string): boolean {
  if (range === "Any time") return true;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (range === "This week") {
      const end = new Date(today);
      end.setDate(today.getDate() + 7);
      return d >= today && d <= end;
    }
    if (range === "This month") {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
  } catch { /* fall through */ }
  return true;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface BoardProps {
  onNavigateToShoot: (shoot: Shoot) => void;
  onInterested: (threadId: string) => void; // kept for API compat; not called by card button
}

export function Board({ onNavigateToShoot }: BoardProps) {
  const { user, profile } = useAuth();
  const { shoots: firestoreShoots, loading } = useShoots();

  // ── Quick-filter pill strip ─────────────────────────────────────────────────
  const [selectedTag, setSelectedTag] = useState("All");

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Filter drawer ───────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Pending = draft state while drawer is open
  const [pendingTags,   setPendingTags]   = useState<string[]>([]);
  const [pendingModels, setPendingModels] = useState("Any");
  const [pendingDate,   setPendingDate]   = useState("Any time");
  // Applied = committed filter state
  const [filterTags,   setFilterTags]   = useState<string[]>([]);
  const [filterModels, setFilterModels] = useState("Any");
  const [filterDate,   setFilterDate]   = useState("Any time");

  // ── Busy state ──────────────────────────────────────────────────────────────
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const shoots = !loading && firestoreShoots.length > 0 ? firestoreShoots : SEED_SHOOTS;
  const interestedShootIds = new Set(profile?.interestedShoots ?? []);
  const isFilterActive =
    filterTags.length > 0 || filterModels !== "Any" || filterDate !== "Any time";

  // ── Filtering ───────────────────────────────────────────────────────────────
  let filtered = shoots;

  if (selectedTag !== "All")
    filtered = filtered.filter((s) => s.tags.includes(selectedTag));

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.photographerName.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filterTags.length > 0)
    filtered = filtered.filter((s) => filterTags.some((ft) => s.tags.includes(ft)));

  if (filterModels !== "Any") {
    filtered = filtered.filter((s) => {
      if (filterModels === "1")  return s.modelsNeeded === 1;
      if (filterModels === "2")  return s.modelsNeeded === 2;
      if (filterModels === "3+") return s.modelsNeeded >= 3;
      return true;
    });
  }

  if (filterDate !== "Any time")
    filtered = filtered.filter((s) => isInDateRange(s.date, filterDate));

  // Active shoots first, past at bottom
  const sortedFiltered = [
    ...filtered.filter((s) => !isShootPast(s.date)),
    ...filtered.filter((s) => isShootPast(s.date)),
  ];

  // ── Drawer helpers ──────────────────────────────────────────────────────────
  const openDrawer = () => {
    setPendingTags([...filterTags]);
    setPendingModels(filterModels);
    setPendingDate(filterDate);
    setDrawerOpen(true);
  };

  const applyFilters = () => {
    setFilterTags([...pendingTags]);
    setFilterModels(pendingModels);
    setFilterDate(pendingDate);
    setDrawerOpen(false);
  };

  const clearAll = () => {
    setPendingTags([]); setPendingModels("Any"); setPendingDate("Any time");
    setFilterTags([]);  setFilterModels("Any");  setFilterDate("Any time");
    setSelectedTag("All");
    setSearchQuery("");
    setDrawerOpen(false);
  };

  const togglePendingTag = (tag: string) =>
    setPendingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  // ── Card actions ─────────────────────────────────────────────────────────────
  const handleInterested = async (shoot: Shoot) => {
    if (!user || !profile) { toast.error("Sign in to message photographers."); return; }
    if (!shoot.photographerUid) { toast("This photographer isn't on Frame yet."); return; }
    if (shoot.photographerUid === user.uid) { toast("That's your own shoot!"); return; }

    setBusyId(shoot.id);
    try {
      await markInterest(shoot.id, user.uid, user.email ?? "", profile.displayName);
      toast.success(`Your interest has been sent to ${shoot.photographerName}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send interest. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (shoot: Shoot) => {
    if (!window.confirm(`Delete "${shoot.title}"?`)) return;
    try {
      await deleteShoot(shoot.id);
      toast.success("Shoot deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete. Try again.");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(FRAME_URL);
      toast("Link copied");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#E8E4DC] flex-shrink-0 space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h1 className="text-[#1A1A1A] tracking-tight">Frame</h1>
          <button
            onClick={openDrawer}
            className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5 text-[#1A1A1A]" />
            {isFilterActive && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F2A900]" />
            )}
          </button>
        </div>

        {/* Quick-filter pill strip */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STYLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full whitespace-nowrap min-h-[44px] transition-colors flex-shrink-0 ${
                selectedTag === tag
                  ? "bg-[#F2A900] text-[#1A1A1A]"
                  : "bg-white text-[#6B6860] border border-[#E8E4DC]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6860] pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, photographer…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
          />
        </div>
      </div>

      {/* ── Feed ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Skeletons */}
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

        {!loading && sortedFiltered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#1A1A1A] mb-2">No shoots match your filters.</p>
            <button onClick={clearAll} className="text-sm text-[#F2A900]">Clear all filters</button>
          </div>
        )}

        {sortedFiltered.map((shoot) => {
          const past             = isShootPast(shoot.date);
          const isOwn            = !!user && shoot.photographerUid === user.uid;
          const alreadyInterested = interestedShootIds.has(shoot.id);
          const count            = shoot.interestedCount ?? 0;
          const isFull           = count >= shoot.modelsNeeded;

          return (
            <div
              key={shoot.id}
              className={`bg-white border border-[#E8E4DC] rounded-lg overflow-hidden ${past ? "opacity-70" : ""}`}
            >
              {/* Hero image */}
              {shoot.photoUrl && (
                <button
                  onClick={() => onNavigateToShoot(shoot)}
                  className="block w-full aspect-video overflow-hidden"
                >
                  <img src={shoot.photoUrl} alt={shoot.title} className="w-full h-full object-cover" />
                </button>
              )}

              <div className="p-4 space-y-3">
                {/* Photographer row + action icons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
                      {shoot.photographerInitials}
                    </div>
                    <p className="text-[#1A1A1A]">{shoot.photographerName}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={handleShare}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B6860] active:text-[#1A1A1A] transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(shoot)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B6860] active:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Shoot info */}
                <button
                  onClick={() => onNavigateToShoot(shoot)}
                  className="w-full text-left space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[#1A1A1A]">{shoot.title}</h3>
                    {past && (
                      <span className="px-2 py-0.5 bg-[#E8E4DC] text-[#6B6860] rounded-full text-xs whitespace-nowrap">
                        Shoot passed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6B6860]">{shoot.date} · {shoot.time}</p>
                  <p className="text-sm text-[#6B6860]">{shoot.location}</p>
                  <p className="text-sm text-[#6B6860] mt-1">
                    {shoot.modelsNeeded} {shoot.modelsNeeded === 1 ? "model" : "models"} needed
                  </p>
                </button>

                {/* Spot counter */}
                <p className={`text-sm ${isFull ? "text-red-500 font-medium" : "text-[#6B6860]"}`}>
                  {isFull
                    ? "Full"
                    : count > 0
                      ? `${count} of ${shoot.modelsNeeded} ${shoot.modelsNeeded === 1 ? "spot" : "spots"} filled`
                      : `${shoot.modelsNeeded} ${shoot.modelsNeeded === 1 ? "spot" : "spots"} available`}
                </p>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {shoot.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-[#E8E4DC] text-[#6B6860] rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA — hidden on past shoots */}
                {!past && (
                  isFull ? (
                    <button
                      disabled
                      className="w-full bg-[#E8E4DC] text-[#6B6860] py-3 rounded-lg min-h-[44px] cursor-default"
                    >
                      Full
                    </button>
                  ) : alreadyInterested ? (
                    <button
                      disabled
                      className="w-full bg-[#FAF8F5] text-[#6B6860] py-3 rounded-lg min-h-[44px] border border-[#E8E4DC] cursor-default"
                    >
                      Interest sent ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInterested(shoot)}
                      disabled={busyId === shoot.id}
                      className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
                    >
                      {busyId === shoot.id ? "Sending…" : "I'm interested"}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter drawer backdrop ──────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[55] bg-black transition-opacity duration-300 ${
          drawerOpen ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Filter drawer panel ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 max-h-[82dvh] overflow-y-auto ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#E8E4DC] rounded-full" />
        </div>

        <div className="px-4 pb-8 space-y-6">
          {/* Drawer header */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-[#1A1A1A] font-medium text-lg">Filters</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={clearAll}
                className="text-sm text-[#6B6860] min-h-[44px] px-2 active:text-[#1A1A1A]"
              >
                Clear all
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#6B6860]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Style tags */}
          <div>
            <p className="text-sm text-[#1A1A1A] font-medium mb-3">Style</p>
            <div className="flex flex-wrap gap-2">
              {FILTER_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => togglePendingTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm min-h-[44px] transition-colors ${
                    pendingTags.includes(tag)
                      ? "bg-[#F2A900] text-[#1A1A1A]"
                      : "bg-[#FAF8F5] text-[#6B6860] border border-[#E8E4DC]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Models needed */}
          <div>
            <p className="text-sm text-[#1A1A1A] font-medium mb-3">Models needed</p>
            <div className="flex gap-2">
              {MODEL_OPTS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPendingModels(opt)}
                  className={`flex-1 py-2 rounded-lg text-sm min-h-[44px] border transition-colors ${
                    pendingModels === opt
                      ? "bg-[#F2A900] text-[#1A1A1A] border-[#F2A900]"
                      : "bg-white text-[#6B6860] border-[#E8E4DC]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-sm text-[#1A1A1A] font-medium mb-3">Date</p>
            <div className="flex gap-2">
              {DATE_OPTS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPendingDate(opt)}
                  className={`flex-1 py-2 rounded-lg text-sm min-h-[44px] border transition-colors ${
                    pendingDate === opt
                      ? "bg-[#F2A900] text-[#1A1A1A] border-[#F2A900]"
                      : "bg-white text-[#6B6860] border-[#E8E4DC]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Apply */}
          <button
            onClick={applyFilters}
            className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors font-medium"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
