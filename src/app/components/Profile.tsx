import { useState, useEffect } from "react";
import { Star, Camera, Plus, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { Shoot, subscribeToShoots, updateUserProfile } from "../../lib/firestore";
import { uploadImage } from "../../lib/storage";

interface ProfileProps {
  onNavigateToShoot: (shoot: Shoot) => void;
}

// Static reviews — a real review system is out of scope for this version
const STATIC_REVIEWS = [
  { id: "1", from: "Maya Chen", rating: 5, text: "Professional and punctual. Great to work with!", date: "Apr 2026" },
  { id: "2", from: "Jordan Ellis", rating: 5, text: "Brought great energy to the shoot. Would book again.", date: "Mar 2026" },
  { id: "3", from: "Alex Rodriguez", rating: 4, text: "Very natural in front of the camera. Highly recommend.", date: "Feb 2026" },
];

export function Profile({ onNavigateToShoot }: ProfileProps) {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "bookmarked">("posts");
  const [myPosts, setMyPosts] = useState<Shoot[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [uploading, setUploading] = useState<number | null>(null);

  // Pull the user's portfolio URLs from Firestore profile
  useEffect(() => {
    if (!profile) return;
    const urls: (string | null)[] = [null, null, null, null];
    profile.portfolioUrls.slice(0, 4).forEach((url, i) => { urls[i] = url; });
    setPortfolioUrls(urls);
  }, [profile]);

  // Subscribe to only this user's shoots
  useEffect(() => {
    if (!user) return;
    return subscribeToShoots((all) => {
      setMyPosts(all.filter((s) => s.photographerUid === user.uid));
    });
  }, [user]);

  const handlePortfolioUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(index);
    try {
      const url = await uploadImage(file, `portfolios/${user.uid}/${index}_${Date.now()}`);
      const newUrls = [...portfolioUrls];
      newUrls[index] = url;
      setPortfolioUrls(newUrls);
      // Persist to Firestore
      await updateUserProfile(user.uid, {
        portfolioUrls: newUrls.filter(Boolean) as string[],
      });
      toast.success("Portfolio updated.");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const removePortfolioImage = async (index: number) => {
    if (!user) return;
    const newUrls = [...portfolioUrls];
    newUrls[index] = null;
    setPortfolioUrls(newUrls);
    await updateUserProfile(user.uid, {
      portfolioUrls: newUrls.filter(Boolean) as string[],
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.displayName ?? "—";
  const initials = profile?.initials ?? "?";
  const major = profile?.major ?? "Photography BFA";
  const bio = profile?.bio ?? "Looking for new collaborations.";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Profile header */}
      <div className="px-4 py-8 border-b border-[#E8E4DC]">
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-3xl font-medium">
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 w-[44px] h-[44px] rounded-full bg-[#1A1A1A] flex items-center justify-center border-2 border-white">
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <h2 className="text-[#1A1A1A] mb-1">{displayName}</h2>
          <p className="text-sm text-[#6B6860] mb-2">{major}</p>
          {bio && (
            <p className="text-sm text-[#1A1A1A] text-center max-w-xs">{bio}</p>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Portfolio grid */}
        <div>
          <h3 className="text-[#1A1A1A] mb-3">Portfolio</h3>
          <div className="grid grid-cols-2 gap-3 mb-2">
            {portfolioUrls.map((url, index) => (
              <div key={index} className="aspect-square">
                {url ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img src={url} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePortfolioImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-[#1A1A1A] bg-opacity-70 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full border-2 border-dashed border-[#F2A900] bg-[#FAF8F5] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#D99500] transition-colors relative">
                    {uploading === index ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#F2A900] border-t-transparent animate-spin" />
                    ) : (
                      <Plus className="w-8 h-8 text-[#F2A900]" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePortfolioUpload(index, e)}
                      className="hidden"
                      disabled={uploading !== null}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6B6860]">Up to 4 images — saves to your profile</p>
        </div>

        {/* Tabs: Your posts / Bookmarked */}
        <div>
          <div className="flex gap-4 mb-4 border-b border-[#E8E4DC]">
            <button
              onClick={() => setActiveTab("posts")}
              className={`pb-3 border-b-2 min-h-[44px] transition-colors ${
                activeTab === "posts" ? "border-[#F2A900] text-[#1A1A1A]" : "border-transparent text-[#6B6860]"
              }`}
            >
              Your posts
            </button>
            <button
              onClick={() => setActiveTab("bookmarked")}
              className={`pb-3 border-b-2 min-h-[44px] transition-colors ${
                activeTab === "bookmarked" ? "border-[#F2A900] text-[#1A1A1A]" : "border-transparent text-[#6B6860]"
              }`}
            >
              Bookmarked
            </button>
          </div>

          <div className="space-y-3">
            {activeTab === "posts" && (
              <>
                {myPosts.length === 0 && (
                  <p className="text-sm text-[#6B6860]">No shoots posted yet.</p>
                )}
                {myPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => onNavigateToShoot(post)}
                    className="block w-full text-left p-4 bg-[#FAF8F5] rounded-lg border border-[#E8E4DC] min-h-[44px] active:border-[#F2A900] transition-colors"
                  >
                    <h4 className="text-[#1A1A1A] mb-1">{post.title}</h4>
                    <p className="text-sm text-[#6B6860]">{post.date}</p>
                    <p className="text-sm text-[#6B6860]">{post.location}</p>
                  </button>
                ))}
              </>
            )}

            {activeTab === "bookmarked" && (
              <p className="text-sm text-[#6B6860]">Bookmarks coming soon.</p>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h3 className="text-[#1A1A1A] mb-4">Reviews</h3>
          <div className="space-y-4">
            {STATIC_REVIEWS.map((review) => (
              <div key={review.id} className="p-4 bg-[#FAF8F5] rounded-lg border border-[#E8E4DC]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#1A1A1A]">{review.from}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#F2A900] text-[#F2A900]" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#6B6860] mb-1">{review.text}</p>
                <p className="text-xs text-[#6B6860]">{review.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#E8E4DC] text-[#6B6860] min-h-[44px] active:bg-[#FAF8F5] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
