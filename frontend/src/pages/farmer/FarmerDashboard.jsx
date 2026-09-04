import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Volume2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Wheat,
  RotateCcw
} from "lucide-react";

export default function FarmerDashboard({ setActiveTab, onSelectBooking }) {
  const { user, language, t } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voiceText, setVoiceText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [geofenceMessage, setGeofenceMessage] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadFarmerData();
  }, [user.farmerId, language]);

  const loadFarmerData = async () => {
    setLoading(true);
    try {
      const data = await api.getFarmerBookings(user.farmerId || "frm-01");
      setBookings(data || []);
      if (data && data.length > 0) {
        // Fetch Bhashini voice text for the primary booking
        const latest = data[0];
        const voice = await api.getVoiceScript(
          latest.booking_token,
          latest.centre_name,
          latest.slot_time,
          language
        );
        setVoiceText(voice.voice_script);
      }
    } catch (err) {
      console.error("Error loading farmer bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (!voiceText) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceText);
      if (language === "hi") utterance.lang = "hi-IN";
      else if (language === "pa") utterance.lang = "pa-IN";
      else if (language === "mr") utterance.lang = "mr-IN";
      else if (language === "te") utterance.lang = "te-IN";
      else if (language === "ta") utterance.lang = "ta-IN";
      else if (language === "kn") utterance.lang = "kn-IN";
      else if (language === "bn") utterance.lang = "bn-IN";
      else if (language === "gu") utterance.lang = "gu-IN";
      else utterance.lang = "en-IN";

      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(voiceText);
    }
  };

  const handleGeofenceCheckIn = async (bookingId) => {
    setCheckingIn(true);
    try {
      // Simulate farmer device GPS coordinates matching Karnal Mandi (29.6858, 76.9906)
      const res = await api.checkInGeofence(bookingId, 29.6858, 76.9906);
      setGeofenceMessage(res.message);
      await loadFarmerData();
    } catch (err) {
      setGeofenceMessage("GPS check-in failed: " + err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const activeBooking = bookings.find((b) => b.status !== "CANCELLED") || bookings[0];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="gov-card" style={{ borderLeft: "5px solid var(--gov-primary)", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--gov-navy)" }}>
              {t("welcome_farmer", "Welcome")}, {user.name}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "2px" }}>
              {t("village", "Village")}: {user.village || "Uchana, Karnal"} • {t("farmer_id", "Farmer ID")}: {user.farmerId || "frm-01"}
            </p>
          </div>
          <button
            id="btn-voice-readout"
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
            onClick={handleSpeak}
          >
            <Volume2 size={18} />
            <span>{isSpeaking ? t("stop_audio", "Stop Audio") : t("listen_audio", "Listen Audio")}</span>
          </button>
        </div>

        {voiceText && (
          <div className="voice-readout-bar" style={{ marginTop: "12px", marginBottom: "0" }}>
            <span className="voice-text">📢 {voiceText}</span>
          </div>
        )}
      </div>

      {/* Geofence Auto-Checkin Alert */}
      {geofenceMessage && (
        <div className="gov-alert gov-alert-success">
          <CheckCircle size={20} />
          <div>
            <strong>{t("checkin_geofence", "Geofence Check-in")}:</strong> {geofenceMessage}
          </div>
        </div>
      )}

      {/* Primary Active Booking Card */}
      {activeBooking ? (
        <div className="gov-card" style={{ border: "2px solid #0284c7", backgroundColor: "#ffffff" }}>
          <div className="gov-card-header">
            <div>
              <span className="form-help" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                {t("active_slot_header", "Active Procurement Slot")}
              </span>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--gov-navy)", letterSpacing: "1px" }}>
                {t("token", "Token")}: #{activeBooking.booking_token}
              </h3>
            </div>
            <span className={`status-badge badge-${activeBooking.status.toLowerCase().replace(/_/g, "-")}`}>
              {activeBooking.status.replace(/_/g, " ")}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <MapPin size={22} color="var(--gov-primary)" />
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{t("mandi_centre", "Mandi Centre")}</div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>{activeBooking.centre_name}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={22} color="var(--gov-primary)" />
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{t("slot_datetime", "Date & Time")}</div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>
                  {activeBooking.slot_date} • {activeBooking.slot_time}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Wheat size={22} color="var(--gov-primary)" />
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{t("crop_and_qty", "Crop & Qty")}</div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>
                  {activeBooking.crop_name} • {activeBooking.quantity_quintals}q
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={22} color="var(--gov-primary)" />
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{t("est_wait", "Est. Wait Time")}</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--gov-primary)" }}>
                  ~{activeBooking.estimated_wait_minutes || 20} mins ({t("in_queue_pos", "Queue")} #{activeBooking.token_number || 101})
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
            <button
              id="btn-view-qr-pass"
              className="btn btn-primary"
              style={{ flex: "1 1 180px" }}
              onClick={() => {
                if (onSelectBooking) onSelectBooking(activeBooking.id);
                setActiveTab("booking-details");
              }}
            >
              <QrCode size={20} />
              <span>{t("view_qr_pass", "View QR Pass")}</span>
            </button>

            {activeBooking.status === "BOOKED" && (
              <button
                id="btn-geofence-checkin"
                className="btn btn-warning"
                style={{ flex: "1 1 180px" }}
                disabled={checkingIn}
                onClick={() => handleGeofenceCheckIn(activeBooking.id)}
              >
                <MapPin size={20} />
                <span>{checkingIn ? t("checkin_in_progress", "Checking in...") : t("checkin_geofence", "Check-in")}</span>
              </button>
            )}

            <button
              id="btn-track-queue"
              className="btn btn-secondary"
              style={{ flex: "1 1 140px" }}
              onClick={() => {
                if (onSelectBooking) onSelectBooking(activeBooking.id);
                setActiveTab("queue");
              }}
            >
              <TrendingUp size={20} />
              <span>{t("track_queue", "Track Queue")}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="gov-card" style={{ textAlign: "center", padding: "32px 16px" }}>
          <Wheat size={48} color="var(--gov-primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>
            {t("no_active_slot_title", "No Active Slot Booked")}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
            {t("no_active_slot_desc", "Reserve an optimal time slot at your nearest procurement mandi based on harvest maturity.")}
          </p>
          <button
            id="btn-book-first-slot"
            className="btn btn-primary"
            onClick={() => setActiveTab("book-slot")}
          >
            {t("book_slot_now", "Book Slot Now")}
          </button>
        </div>
      )}

      {/* Quick Action Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginTop: "16px" }}>
        <div
          className="gov-card"
          style={{ cursor: "pointer", borderLeft: "4px solid var(--gov-primary)" }}
          onClick={() => setActiveTab("book-slot")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--gov-navy)" }}>
                {t("nav_book_slot", "Book New Procurement Slot")}
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                {t("slot_booking_title", "AI Multi-Objective Slot Optimizer")}
              </p>
            </div>
            <ArrowRight size={22} color="var(--gov-primary)" />
          </div>
        </div>

        <div
          className="gov-card"
          style={{ cursor: "pointer", borderLeft: "4px solid var(--gov-saffron)" }}
          onClick={() => setActiveTab("register-crop")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--gov-navy)" }}>
                {t("nav_register_crop", "Register Harvested Crop")}
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                {t("crop_reg_subtitle", "Farm parcel area, GPS & variety")}
              </p>
            </div>
            <ArrowRight size={22} color="var(--gov-saffron)" />
          </div>
        </div>

        <div
          className="gov-card"
          style={{ cursor: "pointer", borderLeft: "4px solid #16a34a" }}
          onClick={() => setActiveTab("payment")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--gov-navy)" }}>
                {t("nav_payment", "DBT Payment Status")}
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                {t("payment_subtitle", "MSP rates, weighment slips & bank transfer")}
              </p>
            </div>
            <ArrowRight size={22} color="#16a34a" />
          </div>
        </div>
      </div>
    </div>
  );
}
