import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  Shoot,
  InterestRecord,
  getOrCreateThread,
  sendMessage,
  subscribeToShootInterested,
} from "../../lib/firestore";

interface ShootDetailProps {
  shoot: Shoot;
  onBack: () => void;
  onInterested: (threadId: string) => void;
}

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ShootDetail({ shoot, onBack, onInterested }: ShootDetailProps) {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState<InterestRecord[]>([]);

  const isOwnShoot = !!user && shoot.photographerUid === user.uid;
  const alreadyInterested = profile?.interestedShoots?.includes(shoot.id) ?? false;
  const count  = shoot.interestedCount ?? 0;
  const isFull = count >= shoot.modelsNeeded;

  // Subscribe to interested users — only needed when viewing your own shoot
  useEffect(() => {
    if (!isOwnShoot) return;
    return subscribeToShootInterested(shoot.id, setInterestedUsers);
  }, [shoot.id, isOwnShoot]);

  // Tapping "I'm interested" on the detail view opens a direct message thread
  const handleInterested = async () => {
    if (!user || !profile) { toast.error("Sign in to message photographers."); return; }
    if (!shoot.photographerUid) { toast("This photographer isn't on Frame yet."); return; }
    if (isOwnShoot) { toast("That's your own shoot!"); return; }

    setBusy(true);
    try {
      const threadId = await getOrCreateThread(
        {
          id: shoot.id,
          title: shoot.title,
          photographerUid: shoot.photographerUid,
          photographerName: shoot.photographerName,
          photographerInitials: shoot.photographerInitials,
        },
        { uid: user.uid, displayName: profile.displayName, initials: profile.initials }
      );
      await sendMessage(
        threadId,
        user.uid,
        `I'm interested in your shoot: "${shoot.title}"`,
        shoot.photographerUid
      );
      onInterested(threadId);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send message. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hero image or plain header */}
      {shoot.photoUrl ? (
        <div className="relative w-full aspect-video flex-shrink-0">
          <img src={shoot.photoUrl} alt={shoot.title} className="w-full h-full object-cover" />
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-white bg-opacity-90 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
          <button
            onClick={onBack}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Title + photographer */}
        <div>
          <h1 className="text-[#1A1A1A] mb-3">{shoot.title}</h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
              {shoot.photographerInitials}
            </div>
            <p className="text-[#1A1A1A]">{shoot.photographerName}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Date &amp; Time</p>
            <p className="text-[#1A1A1A]">{shoot.date} · {shoot.time}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Location</p>
            <p className="text-[#1A1A1A]">{shoot.location}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Models Needed</p>
            <p className="text-[#1A1A1A]">{shoot.modelsNeeded}</p>
          </div>

          {/* Spot counter */}
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Spots</p>
            {isFull ? (
              <p className="text-red-500 font-medium">Full — all spots filled</p>
            ) : (
              <p className="text-[#1A1A1A]">
                {count} of {shoot.modelsNeeded}{" "}
                {shoot.modelsNeeded === 1 ? "spot" : "spots"} filled
              </p>
            )}
          </div>

          {shoot.equipment && (
            <div>
              <p className="text-sm text-[#6B6860] mb-1">Equipment</p>
              <p className="text-[#1A1A1A]">{shoot.equipment}</p>
            </div>
          )}
          {shoot.styleMood && (
            <div>
              <p className="text-sm text-[#6B6860] mb-1">Style / Mood</p>
              <p className="text-[#1A1A1A] leading-relaxed">{shoot.styleMood}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {shoot.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-[#E8E4DC] text-[#6B6860] rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Interested users — photographer only ─────────────────────── */}
        {isOwnShoot && (
          <div>
            <p className="text-sm text-[#6B6860] mb-3 font-medium">
              Who's interested ({interestedUsers.length})
            </p>
            {interestedUsers.length === 0 ? (
              <p className="text-sm text-[#6B6860]">
                No one yet. Share the link to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {interestedUsers.map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E4DC]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-xs font-medium flex-shrink-0">
                      {avatarInitials(r.userName)}
                    </div>
                    <div>
                      <p className="text-sm text-[#1A1A1A]">{r.userName}</p>
                      <p className="text-xs text-[#6B6860]">{r.userEmail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions — hidden for own shoot ─────────────────────────────── */}
      {!isOwnShoot && (
        <div className="px-4 py-4 pb-[24px] border-t border-[#E8E4DC] space-y-3 flex-shrink-0">
          {isFull ? (
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
              onClick={handleInterested}
              disabled={busy}
              className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
            >
              {busy ? "Sending…" : "I'm interested"}
            </button>
          )}

          {shoot.bookingLink && (
            <a
              href={shoot.bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-white text-[#1A1A1A] py-3 rounded-lg min-h-[44px] border border-[#1A1A1A] active:bg-[#FAF8F5] transition-colors"
            >
              Book a slot
            </a>
          )}
        </div>
      )}
    </div>
  );
}
