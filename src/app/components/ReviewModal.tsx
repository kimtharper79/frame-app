import { useState } from "react";
import { Star, X } from "lucide-react";

interface ReviewModalProps {
  modelName: string;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => void;
}

export function ReviewModal({ modelName, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, reviewText);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5 text-[#6B6860]" />
        </button>

        <h2 className="text-[#1A1A1A] mb-2">How did it go?</h2>
        <p className="text-sm text-[#6B6860] mb-6">
          Leave a quick review for {modelName}
        </p>

        <div className="flex gap-2 mb-6 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? "fill-[#F2A900] text-[#F2A900]"
                    : "text-[#E8E4DC]"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write a few words..."
          rows={3}
          className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900] resize-none mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-[#6B6860] py-3 min-h-[44px] active:text-[#1A1A1A] transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors"
          >
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}
