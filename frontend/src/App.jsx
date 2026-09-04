import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";

// Farmer Pages
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import SlotBooking from "./pages/farmer/SlotBooking";
import CropRegistration from "./pages/farmer/CropRegistration";
import BookingDetails from "./pages/farmer/BookingDetails";
import QueueStatus from "./pages/farmer/QueueStatus";
import PaymentStatus from "./pages/farmer/PaymentStatus";
import WeatherAdvisory from "./pages/farmer/WeatherAdvisory";

// Officer Pages
import CentreDashboard from "./pages/officer/CentreDashboard";
import QueueManagement from "./pages/officer/QueueManagement";
import Inspection from "./pages/officer/Inspection";
import Weighbridge from "./pages/officer/Weighbridge";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

import {
  Home,
  Calendar,
  PlusCircle,
  QrCode,
  TrendingUp,
  CreditCard,
  CloudSun,
  Building2,
  Users,
  FileCheck,
  Scale
} from "lucide-react";

function PortalContent() {
  const { role, t } = useAuth();

  // Navigation states for respective personas
  const [farmerTab, setFarmerTab] = useState("dashboard");
  const [officerTab, setOfficerTab] = useState("dashboard");
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const farmerTabs = [
    { id: "dashboard", label: t("nav_dashboard", "Dashboard"), icon: Home },
    { id: "book-slot", label: t("nav_book_slot", "Book Slot"), icon: Calendar },
    { id: "register-crop", label: t("nav_register_crop", "Register Crop"), icon: PlusCircle },
    { id: "booking-details", label: t("nav_qr_pass", "QR Pass"), icon: QrCode },
    { id: "queue", label: t("nav_queue", "Queue Status"), icon: TrendingUp },
    { id: "payment", label: t("nav_payment", "DBT Payment"), icon: CreditCard },
    { id: "weather", label: t("nav_weather", "Weather & NDVI"), icon: CloudSun },
  ];

  const officerTabs = [
    { id: "dashboard", label: t("nav_officer_overview", "Centre Overview"), icon: Building2 },
    { id: "queue", label: t("nav_officer_queue", "Mandi Queue Gate"), icon: Users },
    { id: "inspection", label: t("nav_officer_inspection", "Quality Inspection"), icon: FileCheck },
    { id: "weighing", label: t("nav_officer_weighbridge", "Weighbridge Station"), icon: Scale },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main className="app-container" style={{ flex: 1 }}>
        {/* ============================================================ */}
        {/* FARMER PERSONA VIEW                                          */}
        {/* ============================================================ */}
        {role === "FARMER" && (
          <>
            {/* Desktop Navigation Tabs */}
            <nav className="gov-nav-tabs" aria-label="Farmer Navigation">
              {farmerTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = farmerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`desktop-farmer-tab-${tab.id}`}
                    className={`gov-nav-tab ${isActive ? "active" : ""}`}
                    onClick={() => setFarmerTab(tab.id)}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Content Rendering */}
            {farmerTab === "dashboard" && (
              <FarmerDashboard
                setActiveTab={setFarmerTab}
                onSelectBooking={setSelectedBookingId}
              />
            )}
            {farmerTab === "book-slot" && (
              <SlotBooking
                setActiveTab={setFarmerTab}
                onSelectBooking={setSelectedBookingId}
              />
            )}
            {farmerTab === "register-crop" && (
              <CropRegistration setActiveTab={setFarmerTab} />
            )}
            {farmerTab === "booking-details" && (
              <BookingDetails
                bookingId={selectedBookingId}
                setActiveTab={setFarmerTab}
              />
            )}
            {farmerTab === "queue" && (
              <QueueStatus
                bookingId={selectedBookingId}
                setActiveTab={setFarmerTab}
              />
            )}
            {farmerTab === "payment" && (
              <PaymentStatus bookingId={selectedBookingId} />
            )}
            {farmerTab === "weather" && (
              <WeatherAdvisory setActiveTab={setFarmerTab} />
            )}

            {/* Mobile Bottom Navigation Bar */}
            <MobileNav activeTab={farmerTab} setActiveTab={setFarmerTab} />
          </>
        )}

        {/* ============================================================ */}
        {/* MANDI OFFICER PERSONA VIEW                                   */}
        {/* ============================================================ */}
        {role === "OFFICER" && (
          <>
            <nav className="gov-nav-tabs" aria-label="Officer Navigation">
              {officerTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = officerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`desktop-officer-tab-${tab.id}`}
                    className={`gov-nav-tab ${isActive ? "active" : ""}`}
                    onClick={() => setOfficerTab(tab.id)}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {officerTab === "dashboard" && (
              <CentreDashboard
                setActiveOfficerTab={setOfficerTab}
                setSelectedBookingId={setSelectedBookingId}
              />
            )}
            {officerTab === "queue" && (
              <QueueManagement
                setActiveOfficerTab={setOfficerTab}
                setSelectedBookingId={setSelectedBookingId}
              />
            )}
            {officerTab === "inspection" && (
              <Inspection
                bookingId={selectedBookingId}
                setActiveOfficerTab={setOfficerTab}
              />
            )}
            {officerTab === "weighing" && (
              <Weighbridge
                bookingId={selectedBookingId}
                setActiveOfficerTab={setOfficerTab}
                setSelectedBookingId={setSelectedBookingId}
              />
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* NATIONAL ADMIN PERSONA VIEW                                  */}
        {/* ============================================================ */}
        {role === "ADMIN" && (
          <>
            <div className="gov-nav-tabs">
              <button className="gov-nav-tab active">
                <Building2 size={18} />
                <span>{t("nav_admin_command", "National Command Console")}</span>
              </button>
            </div>

            <AdminDashboard />
          </>
        )}
      </main>

      {/* Official Government Footer */}
      <footer
        style={{
          backgroundColor: "#0a2540",
          color: "#94a3b8",
          padding: "24px 16px",
          borderTop: "3px solid #ff9933",
          fontSize: "13px",
          marginTop: "auto"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center", lineHeight: "1.8" }}>
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
            {t("footer_title", "National Agricultural Procurement & Harvest Scheduling Platform • SIH26032")}
          </div>
          <div>
            {t("footer_dept", "Department of Agriculture & Farmers Welfare • Department of Food & Public Distribution, Government of India")}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
            {t("footer_tech", "Integrated Systems: Bhashini Multi-Lingual AI • Copernicus Sentinel-2 Satellite Remote Sensing • IMD Weather Intelligence • PFMS DBT Gateway")}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}
