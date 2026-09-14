"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ProfileContextValue {
  /** The signed-in user's own avatar URL — null when signed out or unset. */
  avatarUrl: string | null;
  /** Called after a successful avatar upload so every consumer (navbar,
   *  dropdown, profile header) updates immediately without a reload. */
  updateAvatarUrl: (url: string) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  avatarUrl: null,
  updateAvatarUrl: () => {},
});

export function useProfileContext() {
  return useContext(ProfileContext);
}

/** Seeded server-side (see layout.tsx) with the signed-in user's current
 *  avatar_url — same structure as ThemeProvider. */
export function ProfileProvider({
  initialAvatarUrl,
  children,
}: {
  initialAvatarUrl: string | null;
  children: React.ReactNode;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const updateAvatarUrl = useCallback((url: string) => {
    setAvatarUrl(url);
  }, []);

  return (
    <ProfileContext.Provider value={{ avatarUrl, updateAvatarUrl }}>
      {children}
    </ProfileContext.Provider>
  );
}
