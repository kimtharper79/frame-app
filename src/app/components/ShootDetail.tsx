import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { Shoot, getOrCreateThread, sendMessage } from "../../lib/firestore";

interface ShootDetailProps {
  shoot: Shoot;
  onBack: () => void;
  onInterested: (threadId: string) => void;
}

export function ShootDetail({ shoot, onBack, onInterested }: ShootDetailProps) {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleInterested = async () => {
    if (!user || !profile) { toast.error("Sign in to message photographers."); return; }
    if (!shoot.photographerUid) {
      toast("This photographer isn't on Frame yet.");
      return;
    }
    if (shoot.photographerUid === user.uid) { toast("That's your own shoot!"); return; }

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
        <div>
          <h1 className="text-[#1A1A1A] mb-3">{shoot.title}</h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
              {shoot.photographerInitials}
            </div>
            <p className="text-[#1A1A1A]">{shoot.photographerName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Date & Time</p>
            <p className="text-[#1A1A1A]">{shoot.date} • {shoot.time}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Location</p>
            <p className="text-[#1A1A1A]">{shoot.location}</p>
          </div>
          <div>
            <p className="text-sm text-[#6B6860] mb-1">Models Needed</p>
            <p className="text-[#1A1A1A]">{shoot.modelsNeeded}</p>
          </div>
          {shoot.equipment && (
            <div>
              <p className="text-sm text-[#6B6860] mb-1">Equipment</p>
              <p className="text-[#1A1A1A]">{shoot.equipment}</p>
            </div>
          )}
          {shoot.styleMood && (
            <div>
              <p className="text-sm text-[#6B6860] mb-1">Style/Mood</p>
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
      </div>

      {/* Actions */}
      <div className="px-4 py-4 pb-[24px] border-t border-[#E8E4DC] space-y-3 flex-shrink-0">
        <button
          onClick={handleInterested}
          disabled={busy}
          className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
        >
          {busy ? "Sending…" : "I'm interested"}
        </button>
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
    </div>
  );
}
