import { createContext, useContext, useEffect, useState } from 'react';
import { getProfiles } from '../services/api';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfiles()
      .then((data) => {
        setProfiles(data);
        const stored = parseInt(localStorage.getItem('activeProfileId'), 10);
        const valid = data.find((p) => p.id === stored);
        setActiveProfileId(valid ? stored : data[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function selectProfile(id) {
    setActiveProfileId(id);
    localStorage.setItem('activeProfileId', String(id));
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <ProfileContext.Provider value={{ profiles, setProfiles, activeProfileId, activeProfile, selectProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
