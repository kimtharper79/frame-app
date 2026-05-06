import { Camera } from "lucide-react";

interface EmptyStateBoardProps {
  onPostShoot: () => void;
}

export function EmptyStateBoard({ onPostShoot }: EmptyStateBoardProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#E8E4DC]">
        <h1 className="text-[#1A1A1A] tracking-tight">Frame</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-[#F2A900] bg-opacity-10 flex items-center justify-center mb-6">
          <Camera className="w-10 h-10 text-[#F2A900]" />
        </div>
        <h2 className="text-[#1A1A1A] mb-2">Nothing posted yet.</h2>
        <p className="text-sm text-[#6B6860] text-center mb-8 max-w-xs">
          Be the first to post a shoot or check back soon.
        </p>
        <button
          onClick={onPostShoot}
          className="w-full max-w-xs bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors"
        >
          Post a shoot
        </button>
      </div>
    </div>
  );
}
