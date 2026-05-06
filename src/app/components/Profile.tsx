import { useState, useEffect, useRef } from "react";
import { Star, Camera, Plus, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { Shoot, subscribeToShoots, updateUserProfile } from "../../lib/firestore";
import { uploadImage } from "../../lib/storage";
import { uploadToCloudinary } from "../../lib/cloudinary";

interface ProfileProps {
  onNavigateToShoot: (shoot: Shoot) => void;
}

const STATIC_REVIEWS = [
  { id: "1", from: "Maya Chen", rating: 5, text: "Professional and punctual. Great to work with!", date: "Apr 2026" },
  { id: "2", from: "Jordan Ellis", rating: 5, text: "Brought great energy to the shoot. Would book again.", date: "Mar 2026" },
  { id: "3", from: "Alex Rodriguez", rating: 4, text: "Very natural in front of the camera. Highly recommend.", date: "Feb 2026" },
];

export function Profile({ onNavigateToShoot }: ProfileProps) {
  const { user, profile, signOut } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"posts" | "bookmarked">("posts");
  const [myPosts, setMyPosts] = useState<Shoot[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Editable profile fields
  const [displayName, setDisplayName] = useState("");
  const [major, setMajor] = useState("");
  const [role, setRole] = useState("Student");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setMajor(profile.major ?? "");
    setRole(profile.role ?? "Student");
    setBio(profile.bio ?? "");
    const urls: (string | null)[] = [null, null, null, null];
    profile.portfolioUrls.slice(0, 4).forEach((url, i) => { urls[i] = url; });
    setPortfolioUrls(urls);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    return subscribeToShoots((all) => {
      setMyPosts(all.filter((s) => s.photographerUid === user.uid));
    });
  }, [user]);

  // ── Avatar upload via Cloudinary ─────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateUserProfile(user.uid, { profilePhotoUrl: url });
      toast.success("Profile photo updated.");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Try again.");
    } finally {
      setUploadingAvatar(false);
      // Reset so the same file can be re-selected
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  // ── Profile field save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim() || displayName,
        major: major.trim(),
        role,
        bio: bio.trim(),
      });
      toast.success("Profile saved.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Portfolio grid ────────────────────────────────────────────────────────────
  const handlePortfolioUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(index);
    try {
      const url = await uploadImage(file, `portfolios/${user.uid}/${index}_${Date.now()}`);
      const newUrls = [...portfolioUrls];
      newUrls[index] = url;
      setPortfolioUrls(newUrls);
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

  const initials = profile?.initials ?? "?";
  const profilePhotoUrl = profile?.profilePhotoUrl;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Avatar */}
      <div className="px-4 py-8 border-b border-[#E8E4DC]">
        <div className="flex flex-col items-center">
          {/* Hidden file input for avatar */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="relative mb-3">
            {/* Avatar: photo or initials fallback */}
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#F2A900] flex items-center justify-center text-[#1A1A1A] text-3xl font-medium">
                {initials}
              </div>
            )}

            {/* Camera badge — taps the hidden file input */}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-[44px] h-[44px] rounded-full bg-[#1A1A1A] flex items-center justify-center border-2 border-white disabled:opacity-60"
            >
              {uploadingAvatar ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          <p className="text-sm text-[#6B6860]">{user?.email}</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Editable fields */}
        <div className="space-y-4">
          <h3 className="text-[#1A1A1A]">Edit Profile</h3>

          <div>
            <label className="block text-sm text-[#1A1A1A] mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#1A1A1A] mb-1">Major</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g., Photography BFA"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#1A1A1A] mb-1">Year / Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F2A900]"
            >
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate</option>
              <option value="Faculty">Faculty</option>
              <option value="Alumni">Alumni</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#1A1A1A] mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you..."
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-[#1A1A1A] placeholder:text-[#6B6860] focus:outline-none focus:ring-2 focus:ring-[#F2A900] resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#F2A900] text-[#1A1A1A] py-3 rounded-lg min-h-[44px] active:bg-[#D99500] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

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
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#E8E4DC] text-[#6B6860] min-h-[44px] active:bg-[#FAF8F5] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
