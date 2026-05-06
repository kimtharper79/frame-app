import { useState, useEffect } from "react";
import { Home, Plus, Users, User, MessageCircle } from "lucide-react";
import { Board } from "./components/Board";
import { ShootDetail } from "./components/ShootDetail";
import { PostShoot } from "./components/PostShoot";
import { Profile } from "./components/Profile";
import { Collabs } from "./components/Collabs";
import { Login } from "./components/Login";
import { Messages } from "./components/Messages";
import { useAuth } from "../contexts/AuthContext";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { Shoot } from "../lib/firestore";

type Screen = "login" | "board" | "shoot" | "post" | "collabs" | "profile" | "messages";

export default function App() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const unreadCount = useUnreadCount(user?.uid ?? null);

  useEffect(() => {
    if (!loading) setCurrentScreen(user ? "board" : "login");
  }, [user, loading]);

  const navigateToShoot = (shoot: Shoot) => {
    setSelectedShoot(shoot);
    setCurrentScreen("shoot");
  };

  // Called when "I'm interested" succeeds — go straight to the thread
  const openThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setCurrentScreen("messages");
  };

  const navigateTo = (screen: Screen) => {
    // Clear thread selection when navigating via bottom nav so Messages shows thread list
    if (screen !== "messages") setSelectedThreadId(null);
    setCurrentScreen(screen);
  };

  const showBottomNav =
    currentScreen !== "post" &&
    currentScreen !== "shoot" &&
    currentScreen !== "login";

  const navItems = [
    { screen: "board" as Screen, label: "Board", icon: Home },
    { screen: "messages" as Screen, label: "Messages", icon: MessageCircle, badge: unreadCount },
    { screen: "post" as Screen, label: "Post", icon: Plus },
    { screen: "collabs" as Screen, label: "Collabs", icon: Users },
    { screen: "profile" as Screen, label: "Profile", icon: User },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F2A900] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F5F5F5] flex items-center justify-center">
      <div className="h-full w-full max-w-[390px] bg-white flex flex-col mx-auto shadow-lg relative overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {currentScreen === "login" && (
            <Login onLogin={() => setCurrentScreen("board")} />
          )}
          {currentScreen === "board" && (
            <Board
              onNavigateToShoot={navigateToShoot}
              onInterested={openThread}
            />
          )}
          {currentScreen === "shoot" && selectedShoot && (
            <ShootDetail
              shoot={selectedShoot}
              onBack={() => setCurrentScreen("board")}
              onInterested={openThread}
            />
          )}
          {currentScreen === "post" && (
            <PostShoot
              onBack={() => setCurrentScreen("board")}
              onSubmit={() => setCurrentScreen("board")}
            />
          )}
          {currentScreen === "messages" && (
            <Messages initialThreadId={selectedThreadId} />
          )}
          {currentScreen === "collabs" && (
            <Collabs onOpenMessages={() => navigateTo("messages")} />
          )}
          {currentScreen === "profile" && <Profile onNavigateToShoot={navigateToShoot} />}
        </div>

        {showBottomNav && (
          <nav className="border-t border-[#E8E4DC] bg-white flex-shrink-0">
            <div className="flex items-center justify-around px-1 py-3 pb-[20px]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.screen;
                return (
                  <button
                    key={item.screen}
                    onClick={() => navigateTo(item.screen)}
                    className="flex flex-col items-center gap-1 px-2 py-2 min-h-[44px] flex-1 relative"
                  >
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 ${isActive ? "text-[#F2A900]" : "text-[#6B6860]"}`}
                      />
                      {item.badge != null && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#F2A900] text-[#1A1A1A] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] ${isActive ? "text-[#F2A900]" : "text-[#6B6860]"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
