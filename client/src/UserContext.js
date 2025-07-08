import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage if available
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Save user to localStorage on login
  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (storedUser && token) {
    setUser(JSON.parse(storedUser));
  } else {
    setUser(null);
  }
}, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
