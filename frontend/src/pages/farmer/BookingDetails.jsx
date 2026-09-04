import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Printer,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Wheat
} from "lucide-react";

export default function BookingDetails({ bookingId, setActiveTab }) {
  const { user, t } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInMsg, setCheckInMsg] = useState("");

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    setLoading(true);
    try {
      if (bookingId) {
        const data = await api.getBookingDetails(bookingId);
        setBooking(data);
      } else {
        const list = await api.getFarmerBookings(user.farmerId || "frm-01");
        if (list && list.length > 0) {
          const detail = await api.getBookingDetails(list[0].id);
          setBooking(detail);
        }
      }
    } catch (err) {
      console.error("Error loading booking details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateGateArrival = async () => {
    if (!booking) return;
    try {
      const res = await api.checkInGeofence(booking.id, 29.6858, 76.9906);
      setCheckInMsg(res.message);
      await loadBooking();
    } catch (err) {
      setCheckInMsg("Check-in error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="gov-card" style={{ textAlign: "center", padding: "40px" }}>
        <p>{t("loading_pass", "Loading Digital Pass...")}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="gov-card" style={{ textAlign: "center", padding: "40px" }}>
        <p>{t("no_booking_found", "No booking found.")}</p>
        <button className="btn btn-primary" style={{ marginTop: "12px" }} onClick={() => setActiveTab("book-slot")}>
          {t("book_slot_now", "Book Slot Now")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <button
          id="btn-back-to-dash"
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveTab("dashboard")}
        >
          <ArrowLeft size={16} />
          <span>{t("btn_back", "Back to Dashboard")}</span>
        </button>

        <button
          id="btn-print-pass"
          className="btn btn-secondary btn-sm"
          onClick={handlePrint}
        >
          <Printer size={16} />
          <span>{t("btn_print_pdf", "Print / Save PDF")}</span>
        </button>
      </div>

      {checkInMsg && (
        <div className="gov-alert gov-alert-success">
          <CheckCircle size={20} />
          <div>{checkInMsg}</div>
        </div>
      )}

      {/* Official Digital QR Pass Card */}
      <div className="digital-pass" id="printable-pass">
        <div className="pass-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
            <div className="gov-emblem" style={{ width: "28px", height: "28px", fontSize: "14px" }}>
              {t("emblem_text", "Agri")}
            </div>
            <strong style={{ fontSize: "15px", color: "var(--gov-navy)" }}>
              {t("pass_emblem_title", "Government of India • Ministry of Consumer Affairs, Food & Public Distribution")}
            </strong>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {t("pass_digital_title", "National Agricultural Procurement Digital Gate Pass")}
          </p>
        </div>

        <div className="pass-token" id="pass-token-display">
          {booking.booking_token}
        </div>

        <div style={{ display: "inline-block", margin: "4px 0 12px" }}>
          <span className={`status-badge badge-${booking.status.toLowerCase().replace(/_/g, "-")}`}>
            {booking.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* QR Code */}
        <div className="pass-qr">
          <QRCodeSVG value={booking.qr_token || booking.booking_token} size={170} level="H" />
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontFamily: "monospace" }}>
            {booking.qr_token}
          </div>
        </div>

        {/* Pass Details Table */}
        <div style={{ textAlign: "left", fontSize: "14px", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("farmer_label", "Farmer")}:</span>
            <strong>{booking.farmer_name}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("mobile_label", "Mobile")}:</span>
            <strong>{booking.farmer_phone}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("mandi_centre", "Mandi Centre")}:</span>
            <strong>{booking.centre_name}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("slot_datetime", "Date & Time")}:</span>
            <strong>{booking.slot_date} ({booking.slot_time})</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("crop_and_qty", "Crop & Quantity")}:</span>
            <strong>{booking.crop_name} • {booking.quantity_quintals}q</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("queue_token_label", "Queue Token")}:</span>
            <strong style={{ color: "var(--gov-primary)", fontSize: "16px" }}>#{booking.token_number || 101}</strong>
          </div>
        </div>

        {/* Mandi Gate Check-in Action */}
        {booking.status === "BOOKED" && (
          <div style={{ marginTop: "18px", borderTop: "1px dashed var(--border-color)", paddingTop: "14px" }}>
            <button
              id="btn-gate-checkin-pass"
              className="btn btn-warning btn-block"
              onClick={handleSimulateGateArrival}
            >
              <MapPin size={18} />
              <span>{t("btn_gate_checkin", "Check-in at Mandi Gate")}</span>
            </button>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
              {t("geofence_note", "Geofence auto-detects arrival within 500m of the mandi gate.")}
            </p>
          </div>
        )}
      </div>

      {/* Instructions for Farmer */}
      <div className="gov-card" style={{ maxWidth: "420px", margin: "16px auto 0" }}>
        <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px", color: "var(--gov-navy)" }}>
          {t("instructions_title", "Mandi Entry & Processing Guidelines:")}
        </h4>
        <ul style={{ fontSize: "13px", color: "var(--text-muted)", paddingLeft: "18px", lineHeight: "1.6" }}>
          <li>{t("inst_1", "Report to the mandi gate 15 minutes before your allocated slot.")}</li>
          <li>{t("inst_2", "Show this digital QR pass to the intake and security officer.")}</li>
          <li>{t("inst_3", "Ensure grain moisture is below 12-14% (FAQ quality compliance).")}</li>
          <li>{t("inst_4", "Direct Benefit Transfer (DBT) will be credited automatically post-weighment.")}</li>
        </ul>
      </div>
    </div>
  );
}
