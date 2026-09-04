import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { SUPPORTED_LANGUAGES, translations } from "./translations";

const AuthContext = createContext();

export const DEMO_USERS = {
  FARMER: {
    id: "usr-farm-01",
    username: "ramesh_kumar",
    name: "Ramesh Kumar",
    role: "FARMER",
    phone: "9876543210",
    farmerId: "frm-01",
    village: "Uchana, Karnal",
    district: "Karnal",
    state: "Haryana"
  },
  OFFICER: {
    id: "usr-off-01",
    username: "officer_karnal",
    name: "Rajesh Verma",
    role: "OFFICER",
    phone: "9811111111",
    centreId: "cnt-01",
    centreName: "Karnal Main Anaj Mandi",
    district: "Karnal"
  },
  ADMIN: {
    id: "usr-admin-01",
    username: "admin",
    name: "Dr. Arvind Sharma",
    role: "ADMIN",
    phone: "9800000000",
    department: "Ministry of Agriculture & Farmers Welfare"
  }
};

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState("FARMER");
  const [user, setUser] = useState(DEMO_USERS.FARMER);
  const [language, setLanguage] = useState("en"); // Default English as requested by user
  const [supportedLanguages, setSupportedLanguages] = useState(SUPPORTED_LANGUAGES);

  // Translation helper with English fallback
  const t = (key, fallback = "") => {
    const langDict = translations[language] || translations.en || {};
    return langDict[key] || translations.en?.[key] || fallback || key;
  };

  // Switch persona conveniently during live demo
  const switchRole = (newRole) => {
    setRole(newRole);
    setUser(DEMO_USERS[newRole]);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        language,
        setLanguage,
        switchRole,
        supportedLanguages,
        t,
        translations
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
