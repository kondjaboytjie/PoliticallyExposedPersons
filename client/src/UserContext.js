import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (storedUser && storedUser !== "undefined" && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Invalid JSON in sessionStorage for user:", err);
        setUser(null);
        sessionStorage.removeItem("user");
      }
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
