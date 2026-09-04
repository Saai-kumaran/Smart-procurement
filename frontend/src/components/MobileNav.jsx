import React from "react";
import { useAuth } from "../context/AuthContext";
import { Home, PlusCircle, Calendar, QrCode, CloudSun } from "lucide-react";

export default function MobileNav({ activeTab, setActiveTab }) {
  const { t } = useAuth();

  const navItems = [
    { id: "dashboard", label: t("nav_dashboard", "Home"), icon: Home },
    { id: "book-slot", label: t("nav_book_slot", "Book"), icon: Calendar },
    { id: "register-crop", label: t("nav_register_crop", "Crop"), icon: PlusCircle },
    { id: "queue", label: t("nav_queue", "Queue"), icon: QrCode },
    { id: "weather", label: t("nav_weather", "Weather"), icon: CloudSun },
  ];

  return (
    <nav className="farmer-bottom-nav" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-btn-${item.id}`}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
