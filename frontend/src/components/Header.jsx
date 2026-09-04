import React from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, UserCheck, Shield, ChevronDown } from "lucide-react";

export default function Header() {
  const { role, user, language, setLanguage, switchRole, supportedLanguages, t } = useAuth();

  return (
    <>
      {/* Official Tricolor Ribbon */}
      <div className="gov-tricolor-stripe">
        <div className="gov-stripe-saffron"></div>
        <div className="gov-stripe-white"></div>
        <div className="gov-stripe-green"></div>
      </div>

      <header className="gov-header">
        <div className="gov-header-inner">
          <div className="gov-brand">
            <div className="gov-emblem" title="Government of India">
              {t("emblem_text", "Agri")}
            </div>
            <div className="gov-title-block">
              <h1>{t("portal_title", "National Agricultural Procurement & Harvest Scheduling Platform")}</h1>
              <p>{t("portal_subtitle", "Ministry of Agriculture & Farmers Welfare • Government of India • SIH26032")}</p>
            </div>
          </div>

          <div className="gov-header-controls">
            {/* Bhashini Multi-Language Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Globe size={18} color="#ffffff" />
              <select
                id="language-select"
                aria-label={t("language_select", "Select Language")}
                className="gov-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                title={t("language_select", "Select Language")}
              >
                {Object.entries(supportedLanguages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Persona Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                id="role-select"
                aria-label={t("role_select", "Switch User Persona")}
                className="gov-lang-select"
                style={{ backgroundColor: "#137547", fontWeight: 700, borderColor: "#4ade80" }}
                value={role}
                onChange={(e) => switchRole(e.target.value)}
              >
                <option value="FARMER">{t("role_farmer", "🧑‍🌾 Farmer")}</option>
                <option value="OFFICER">{t("role_officer", "🏢 Mandi Officer")}</option>
                <option value="ADMIN">{t("role_admin", "🏛️ Government Admin")}</option>
              </select>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
