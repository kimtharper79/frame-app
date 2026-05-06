import { toast } from "sonner";

interface CollabsProps {
  onOpenMessages: () => void;
}

const collabs = [
  {
    id: "1",
    poster: "Zoe Park",
    initials: "ZP",
    major: "Fashion Design BFA • Junior",
    title: "Fashion Design Final — Need a Photographer",
    description:
      "Shooting my senior collection in the Élan studio. Need someone comfortable with studio strobes and editorial work. May 14, 10am–2pm.",
    lookingFor: "Photography student",
    date: "May 14, 2026",
  },
  {
    id: "2",
    poster: "Marcus Webb",
    initials: "MW",
    major: "Graphic Design BFA • Senior",
    title: "Brand Identity Project — Looking for Documentary Photographer",
    description:
      "Documenting a local Savannah business for my capstone. Two sessions, flexible scheduling.",
    lookingFor: "Photography student or alumni",
    date: "Flexible",
  },
  {
    id: "3",
    poster: "Priya Nair",
    initials: "PN",
    major: "Film and Television MFA",
    title: "Film Short — Need a Still Photographer for BTS",
    description:
      "Behind-the-scenes stills for a short film shooting on location in the Historic District. May 17–18.",
    lookingFor: "Any photographer",
    date: "May 17–18, 2026",
  },
];

export function Collabs({ onOpenMessages }: CollabsProps) {
  const handleInterested = (poster: string) => {
    toast(`Message ${poster} via your SCAD email — direct messaging for Collabs is coming soon.`);
    onOpenMessages();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#E8E4DC] flex-shrink-0">
        <h1 className="text-[#1A1A1A] mb-4">Collabs</h1>
        <button className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors">
          Post a collab request
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {collabs.map((collab) => (
          <div key={collab.id} className="bg-white border border-[#E8E4DC] rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-sm font-medium flex-shrink-0">
                {collab.initials}
              </div>
              <div>
                <p className="text-[#1A1A1A]">{collab.poster}</p>
                <p className="text-sm text-[#6B6860]">{collab.major}</p>
              </div>
            </div>

            <div>
              <h3 className="text-[#1A1A1A] mb-2">{collab.title}</h3>
              <p className="text-sm text-[#1A1A1A] leading-relaxed mb-2">{collab.description}</p>
              <p className="text-sm text-[#6B6860]">Looking for: {collab.lookingFor}</p>
              <p className="text-sm text-[#6B6860]">{collab.date}</p>
            </div>

            <button
              onClick={() => handleInterested(collab.poster)}
              className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors"
            >
              I'm interested
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
