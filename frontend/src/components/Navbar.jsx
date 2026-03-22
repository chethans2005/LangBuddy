import { Link, useLocation } from "react-router";
import { BellIcon, LogOutIcon, Cat } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import ProfileDropdown from "./ProfileDropdown";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMessageNotifications } from "../lib/api";

const Navbar = () => {
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const { logoutMutation } = useLogout();
  const [hasMsgNotifications, setHasMsgNotifications] = useState(false);

  useEffect(() => {
    const readInitial = (() => {
      try {
        const raw = localStorage.getItem("message_notifications");
        const arr = raw ? JSON.parse(raw) : [];
        return arr.length > 0;
      } catch (err) {
        return false;
      }
    })();
    setHasMsgNotifications(readInitial);

    const handler = (e) => {
      const val = Number(e?.detail ?? 0);
      setHasMsgNotifications(val > 0);
      // also refetch server-side notifications
      try {
        refetch();
      } catch (err) {
        /* ignore */
      }
    };

    window.addEventListener("messageNotificationsUpdated", handler);

    // also listen to storage in case other tabs update
    const storageHandler = (ev) => {
      if (ev.key === "message_notifications") {
        try {
          const arr = ev.newValue ? JSON.parse(ev.newValue) : [];
          setHasMsgNotifications(arr.length > 0);
        } catch (err) {
          setHasMsgNotifications(false);
        }
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("messageNotificationsUpdated", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  // fetch server-side notifications (so dot shows even after migration)
  const { data: serverNotes, refetch } = useQuery({
    queryKey: ["messageNotificationsCount"],
    queryFn: async () => {
      try {
        const res = await getMessageNotifications();
        return (res.notifications || []).length;
      } catch (err) {
        return 0;
      }
    },
  });

  useEffect(() => {
    if (typeof serverNotes === "number") setHasMsgNotifications((v) => v || serverNotes > 0);
  }, [serverNotes]);

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <Cat className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  LangBuddy
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"}>
              <div className="relative inline-block overflow-visible">
                <button className="btn btn-ghost btn-circle">
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                </button>
                {hasMsgNotifications && (
                  <span className="absolute -top-1 -right-1 z-50 w-3 h-3 rounded-full bg-error ring-2 ring-base-100" />
                )}
              </div>
            </Link>
          </div>

          {/* TODO */}
          <ThemeSelector />

          <ProfileDropdown />

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;