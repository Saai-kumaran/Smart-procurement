import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Volume2,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Wheat,
  RotateCcw,
} from "lucide-react";

export default function FarmerDashboard({ setActiveTab, onSelectBooking }) {
  const { user, language, t } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [voiceText, setVoiceText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [geofenceMessage, setGeofenceMessage] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const farmerId = user?.farmerId || "frm-01";

  useEffect(() => {
    if (farmerId) {
      loadFarmerData();
    }
  }, [farmerId, language]);

  const loadFarmerData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // ---------------------------------------------------------
      // 1. Load farmer bookings
      // ---------------------------------------------------------
      const data = await api.getFarmerBookings(farmerId);

      const bookingList = Array.isArray(data) ? data : [];
      setBookings(bookingList);

      // ---------------------------------------------------------
      // 2. Load Bhashini voice script independently
      //    Voice failure should NOT break the dashboard.
      // ---------------------------------------------------------
      setVoiceText("");

      if (bookingList.length > 0) {
        const active = bookingList.find(
          (booking) => booking.status !== "CANCELLED"
        );

        if (active) {
          try {
            const voice = await api.getVoiceScript(
              active.booking_token,
              active.centre_name,
              active.slot_time,
              language
            );

            if (voice?.voice_script) {
              setVoiceText(voice.voice_script);
            }
          } catch (voiceError) {
            console.warn(
              "Voice script unavailable:",
              voiceError
            );
          }
        }
      }
    } catch (err) {
      console.error("Error loading farmer bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -------------------------------------------------------------
  // Voice Readout
  // -------------------------------------------------------------
  const handleSpeak = () => {
    if (!voiceText) return;

    if ("speechSynthesis" in window) {
      // Stop currently playing speech
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(voiceText);

      if (language === "hi") {
        utterance.lang = "hi-IN";
      } else if (language === "pa") {
        utterance.lang = "pa-IN";
      } else if (language === "mr") {
        utterance.lang = "mr-IN";
      } else if (language === "te") {
        utterance.lang = "te-IN";
      } else if (language === "ta") {
        utterance.lang = "ta-IN";
      } else if (language === "kn") {
        utterance.lang = "kn-IN";
      } else if (language === "bn") {
        utterance.lang = "bn-IN";
      } else if (language === "gu") {
        utterance.lang = "gu-IN";
      } else {
        utterance.lang = "en-IN";
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(voiceText);
    }
  };

  // -------------------------------------------------------------
  // Geofence Check-in
  // -------------------------------------------------------------
  const handleGeofenceCheckIn = async (bookingId) => {
    if (!bookingId) return;

    setCheckingIn(true);
    setGeofenceMessage(null);

    try {
      /*
       * Demo GPS coordinates for Karnal Main Anaj Mandi.
       * Replace these with navigator.geolocation in the
       * production version.
       */
      const latitude = 29.6858;
      const longitude = 76.9906;

      const res = await api.checkInGeofence(
        bookingId,
        latitude,
        longitude
      );

      setGeofenceMessage(
        res?.message || t(
          "checkin_success",
          "Geofence check-in successful."
        )
      );

      await loadFarmerData();
    } catch (err) {
      console.error("Geofence check-in failed:", err);

      setGeofenceMessage(
        "GPS check-in failed: " +
        (err?.message || "Unable to verify location.")
      );
    } finally {
      setCheckingIn(false);
    }
  };

  // -------------------------------------------------------------
  // Find active booking
  // -------------------------------------------------------------
  const activeBooking =
    bookings.find(
      (booking) => booking.status !== "CANCELLED"
    ) || null;

  // -------------------------------------------------------------
  // Status formatting
  // -------------------------------------------------------------
  const formatStatus = (status) => {
    if (!status) return "UNKNOWN";

    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClass = (status) => {
    if (!status) return "badge-booked";

    return `badge-${status
      .toLowerCase()
      .replace(/_/g, "-")}`;
  };

  // -------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div
        className="gov-card"
        style={{
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        <RotateCcw
          size={32}
          style={{
            margin: "0 auto 12px",
            animation: "spin 1s linear infinite",
          }}
        />

        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            marginBottom: "6px",
          }}
        >
          {t(
            "loading_dashboard",
            "Loading Farmer Dashboard..."
          )}
        </h3>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          {t(
            "loading_farmer_data",
            "Fetching your latest procurement information."
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* =========================================================
          WELCOME BANNER
      ========================================================= */}
      <div
        className="gov-card"
        style={{
          borderLeft: "5px solid var(--gov-primary)",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--gov-navy)",
              }}
            >
              {t("welcome_farmer", "Welcome")},{" "}
              {user?.name || t("farmer", "Farmer")}
            </h2>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "14px",
                marginTop: "2px",
              }}
            >
              {t("village", "Village")}:{" "}
              {user?.village || "Uchana, Karnal"} •{" "}
              {t("farmer_id", "Farmer ID")}:{" "}
              {farmerId}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {/* Refresh */}
            <button
              id="btn-refresh-dashboard"
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
              onClick={() => loadFarmerData(true)}
            >
              <RotateCcw
                size={17}
                style={{
                  animation: refreshing
                    ? "spin 1s linear infinite"
                    : "none",
                }}
              />

              <span>
                {refreshing
                  ? t("refreshing", "Refreshing...")
                  : t("refresh", "Refresh")}
              </span>
            </button>

            {/* Voice */}
            {voiceText && (
              <button
                id="btn-voice-readout"
                className="btn btn-secondary btn-sm"
                style={{
                  backgroundColor: "#eff6ff",
                  borderColor: "#bfdbfe",
                  color: "#1d4ed8",
                }}
                onClick={handleSpeak}
              >
                <Volume2 size={18} />

                <span>
                  {isSpeaking
                    ? t("stop_audio", "Stop Audio")
                    : t("listen_audio", "Listen Audio")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Voice Readout */}
        {voiceText && (
          <div
            className="voice-readout-bar"
            style={{
              marginTop: "12px",
              marginBottom: "0",
            }}
          >
            <span className="voice-text">
              📢 {voiceText}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================
          GEOFENCE MESSAGE
      ========================================================= */}
      {geofenceMessage && (
        <div className="gov-alert gov-alert-success">
          <CheckCircle size={20} />

          <div>
            <strong>
              {t(
                "checkin_geofence",
                "Geofence Check-in"
              )}
              :
            </strong>{" "}
            {geofenceMessage}
          </div>
        </div>
      )}

      {/* =========================================================
          ACTIVE BOOKING
      ========================================================= */}
      {activeBooking ? (
        <div
          className="gov-card"
          style={{
            border: "2px solid #0284c7",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Card Header */}
          <div className="gov-card-header">
            <div>
              <span
                className="form-help"
                style={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {t(
                  "active_slot_header",
                  "Active Procurement Slot"
                )}
              </span>

              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--gov-navy)",
                  letterSpacing: "1px",
                }}
              >
                {t("token", "Token")}: #
                {activeBooking.booking_token || "N/A"}
              </h3>
            </div>

            <span
              className={`status-badge ${getStatusClass(
                activeBooking.status
              )}`}
            >
              {formatStatus(activeBooking.status)}
            </span>
          </div>

          {/* Booking Information */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            {/* Mandi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <MapPin
                size={22}
                color="var(--gov-primary)"
              />

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {t(
                    "mandi_centre",
                    "Mandi Centre"
                  )}
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {activeBooking.centre_name ||
                    "Not Available"}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Calendar
                size={22}
                color="var(--gov-primary)"
              />

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {t(
                    "slot_datetime",
                    "Date & Time"
                  )}
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {activeBooking.slot_date || "N/A"} •{" "}
                  {activeBooking.slot_time || "N/A"}
                </div>
              </div>
            </div>

            {/* Crop & Quantity */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Wheat
                size={22}
                color="var(--gov-primary)"
              />

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {t(
                    "crop_and_qty",
                    "Crop & Qty"
                  )}
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {activeBooking.crop_name ||
                    "N/A"}{" "}
                  •{" "}
                  {activeBooking.quantity_quintals ??
                    "N/A"}
                  q
                </div>
              </div>
            </div>

            {/* Queue */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Clock
                size={22}
                color="var(--gov-primary)"
              />

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {t(
                    "est_wait",
                    "Est. Wait Time"
                  )}
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--gov-primary)",
                  }}
                >
                  {activeBooking
                    .estimated_wait_minutes != null
                    ? `~${activeBooking.estimated_wait_minutes} mins`
                    : t(
                      "wait_not_available",
                      "Wait time unavailable"
                    )}

                  {activeBooking.token_number !=
                    null && (
                      <>
                        {" "}
                        (
                        {t(
                          "in_queue_pos",
                          "Queue"
                        )}{" "}
                        #
                        {activeBooking.token_number})
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              ACTION BUTTONS
          ===================================================== */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            {/* QR Pass */}
            <button
              id="btn-view-qr-pass"
              className="btn btn-primary"
              style={{
                flex: "1 1 180px",
              }}
              onClick={() => {
                if (onSelectBooking) {
                  onSelectBooking(activeBooking.id);
                }

                setActiveTab("booking-details");
              }}
            >
              <QrCode size={20} />

              <span>
                {t(
                  "view_qr_pass",
                  "View QR Pass"
                )}
              </span>
            </button>

            {/* Geofence Check-in */}
            {activeBooking.status === "BOOKED" && (
              <button
                id="btn-geofence-checkin"
                className="btn btn-warning"
                style={{
                  flex: "1 1 180px",
                }}
                disabled={
                  checkingIn ||
                  !activeBooking.id
                }
                onClick={() =>
                  handleGeofenceCheckIn(
                    activeBooking.id
                  )
                }
              >
                <MapPin size={20} />

                <span>
                  {checkingIn
                    ? t(
                      "checkin_in_progress",
                      "Checking in..."
                    )
                    : t(
                      "checkin_geofence",
                      "Check-in"
                    )}
                </span>
              </button>
            )}

            {/* Track Queue */}
            <button
              id="btn-track-queue"
              className="btn btn-secondary"
              style={{
                flex: "1 1 140px",
              }}
              onClick={() => {
                if (onSelectBooking) {
                  onSelectBooking(activeBooking.id);
                }

                setActiveTab("queue");
              }}
            >
              <TrendingUp size={20} />

              <span>
                {t(
                  "track_queue",
                  "Track Queue"
                )}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================
           NO ACTIVE SLOT
        ========================================================= */
        <div
          className="gov-card"
          style={{
            textAlign: "center",
            padding: "32px 16px",
          }}
        >
          <Wheat
            size={48}
            color="var(--gov-primary)"
            style={{
              margin: "0 auto 12px",
            }}
          />

          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            {t(
              "no_active_slot_title",
              "No Active Slot Booked"
            )}
          </h3>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {t(
              "no_active_slot_desc",
              "Reserve an optimal time slot at your nearest procurement mandi based on harvest maturity."
            )}
          </p>

          <button
            id="btn-book-first-slot"
            className="btn btn-primary"
            onClick={() =>
              setActiveTab("book-slot")
            }
          >
            {t(
              "book_slot_now",
              "Book Slot Now"
            )}
          </button>
        </div>
      )}

      {/* =========================================================
          QUICK ACTION GRID
      ========================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "14px",
          marginTop: "16px",
        }}
      >
        {/* Book Slot */}
        <div
          className="gov-card"
          style={{
            cursor: "pointer",
            borderLeft:
              "4px solid var(--gov-primary)",
          }}
          onClick={() =>
            setActiveTab("book-slot")
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--gov-navy)",
                }}
              >
                {t(
                  "nav_book_slot",
                  "Book New Procurement Slot"
                )}
              </h4>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                }}
              >
                {t(
                  "slot_booking_title",
                  "AI Multi-Objective Slot Optimizer"
                )}
              </p>
            </div>

            <ArrowRight
              size={22}
              color="var(--gov-primary)"
            />
          </div>
        </div>

        {/* Register Crop */}
        <div
          className="gov-card"
          style={{
            cursor: "pointer",
            borderLeft:
              "4px solid var(--gov-saffron)",
          }}
          onClick={() =>
            setActiveTab("register-crop")
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--gov-navy)",
                }}
              >
                {t(
                  "nav_register_crop",
                  "Register Harvested Crop"
                )}
              </h4>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                }}
              >
                {t(
                  "crop_reg_subtitle",
                  "Farm parcel area, GPS & variety"
                )}
              </p>
            </div>

            <ArrowRight
              size={22}
              color="var(--gov-saffron)"
            />
          </div>
        </div>

        {/* Payment */}
        <div
          className="gov-card"
          style={{
            cursor: "pointer",
            borderLeft: "4px solid #16a34a",
          }}
          onClick={() =>
            setActiveTab("payment")
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--gov-navy)",
                }}
              >
                {t(
                  "nav_payment",
                  "DBT Payment Status"
                )}
              </h4>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "3px",
                }}
              >
                {t(
                  "payment_subtitle",
                  "MSP rates, weighment slips & bank transfer"
                )}
              </p>
            </div>

            <ArrowRight
              size={22}
              color="#16a34a"
            />
          </div>
        </div>
      </div>
    </div>
  );
}