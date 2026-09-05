import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Scale,
  CreditCard,
  FileCheck,
  RefreshCw
} from "lucide-react";

export default function QueueStatus({ bookingId, setActiveTab }) {
  const { user, t } = useAuth();
  const [queueInfo, setQueueInfo] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();

    const interval = setInterval(loadQueue, 10000);

    return () => clearInterval(interval);
  }, [bookingId]);

  const loadQueue = async () => {
    try {
      let bId = bookingId;

      if (!bId) {
        const bookings = await api.getFarmerBookings(
          user?.farmerId || "frm-01"
        );

        if (bookings && bookings.length > 0) {
          bId = bookings[0].id;
        }
      }

      if (bId) {
        const [bData, qData] = await Promise.all([
          api.getBookingDetails(bId),
          api.getBookingQueueStatus(bId)
        ]);

        setBooking(bData);
        setQueueInfo(qData);
      }
    } catch (err) {
      console.error("Error loading queue info:", err);
    } finally {
      setLoading(false);
    }
  };

  const STAGES = [
    {
      key: "BOOKED",
      label: t("stage_booked", "1. Slot Confirmed"),
      icon: Truck
    },
    {
      key: "CHECKED_IN",
      label: t("stage_gate_entry", "2. Gate Entry (Check-in)"),
      icon: Truck
    },
    {
      key: "INSPECTION",
      label: t("stage_quality_check", "3. Quality Inspection"),
      icon: FileCheck
    },
    {
      key: "WEIGHING",
      label: t("stage_weighbridge", "4. Weighbridge Scale"),
      icon: Scale
    },
    {
      key: "PAYMENT_SETTLED",
      label: t("stage_dbt_settled", "5. DBT Payment Settled"),
      icon: CreditCard
    }
  ];

  /*
   * Stage positions:
   * 0 = Slot Confirmed
   * 1 = Gate Entry
   * 2 = Quality Inspection
   * 3 = Weighbridge
   * 4 = Payment
   *
   * PAYMENT_PROCESSING and PAYMENT_SETTLED both belong
   * to the final payment stage.
   */
  const getStageIndex = (status) => {
    switch (status) {
      case "BOOKED":
        return 0;

      case "ARRIVED":
      case "CHECKED_IN":
        return 1;

      case "INSPECTION":
      case "QUALITY_CHECK":
        return 2;

      case "WEIGHING":
      case "PROCUREMENT_COMPLETED":
        return 3;

      case "PAYMENT_PROCESSING":
        return 4;

      case "PAYMENT_SETTLED":
        return 5;

      default:
        return 0;
    }
  };

  const currentIndex = booking
    ? getStageIndex(booking.status)
    : 0;

  const estimatedWait =
    queueInfo?.estimated_wait_minutes ?? 20;

  const vehiclesAhead =
    queueInfo?.vehicles_ahead ?? 0;

  const queuePosition =
    queueInfo?.position ?? 1;

  const bookingStatus =
    booking?.status ?? "BOOKED";

  const formatStatus = (status) => {
    if (!status) return "Booked";

    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  /*
   * Returns the correct text for each procurement stage.
   */
  const getStageStatusText = (stage, idx) => {
    if (bookingStatus === "PAYMENT_PROCESSING" && idx === 4) {
      return `● ${t(
        "payment_processing",
        "Payment Processing"
      )}`;
    }

    if (bookingStatus === "PAYMENT_SETTLED" && idx === 4) {
      return `✓ ${t(
        "payment_settled",
        "Payment Settled"
      )}`;
    }

    if (idx < currentIndex) {
      return `✓ ${t(
        "completed",
        "Completed"
      )}`;
    }

    if (idx === currentIndex) {
      return `● ${t(
        "in_progress",
        "In Progress"
      )}`;
    }

    return t(
      "pending",
      "Pending"
    );
  };

  if (loading) {
    return (
      <div className="gov-card">
        <div
          style={{
            textAlign: "center",
            padding: "40px"
          }}
        >
          <RefreshCw
            size={28}
            style={{
              animation: "spin 1s linear infinite",
              marginBottom: "10px"
            }}
          />

          <p style={{ color: "var(--text-muted)" }}>
            {t(
              "loading_queue",
              "Loading live queue status..."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="gov-card">

        {/* Header */}
        <div className="gov-card-header">
          <div className="gov-card-title">
            <TrendingUp
              size={22}
              color="var(--gov-primary)"
            />

            <span>
              {t(
                "queue_tracker_title",
                "Live Mandi Queue & Turnaround Tracker"
              )}
            </span>
          </div>

          <button
            id="btn-refresh-queue"
            className="btn btn-secondary btn-sm"
            onClick={loadQueue}
          >
            <RefreshCw size={16} />

            <span>
              {t("refresh", "Refresh")}
            </span>
          </button>
        </div>

        {booking ? (
          <div>

            {/* Booking / Centre Information */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "16px"
              }}
            >
              <div>
                <span
                  className="form-help"
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}
                >
                  {t(
                    "mandi_centre",
                    "Procurement Centre"
                  )}
                </span>

                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--gov-navy)"
                  }}
                >
                  {booking.centre_name}
                </h3>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    marginTop: "2px"
                  }}
                >
                  {t("token", "Token")}:{" "}
                  <strong>
                    {booking.booking_token}
                  </strong>

                  {" • "}

                  #{booking.token_number ?? 101}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  className={`status-badge badge-${bookingStatus
                    .toLowerCase()
                    .replace(/_/g, "-")}`}
                >
                  {formatStatus(bookingStatus)}
                </span>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "4px"
                  }}
                >
                  {booking.slot_date}{" "}
                  ({booking.slot_time})
                </div>
              </div>
            </div>

            {/* Queue Summary */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1.5px solid #bfdbfe",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px"
              }}
            >
              <Clock
                size={36}
                color="#2563eb"
              />

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#1e40af",
                    fontWeight: 700
                  }}
                >
                  {t(
                    "est_turnaround",
                    "Estimated Waiting Time"
                  )}
                </div>

                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 900,
                    color: "#1e3a8a"
                  }}
                >
                  ~{estimatedWait} mins
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#1e40af"
                  }}
                >
                  {t(
                    "vehicles_ahead",
                    "Vehicles ahead of you"
                  )}
                  :{" "}
                  <strong>
                    {vehiclesAhead}
                  </strong>

                  {" • "}

                  {t(
                    "position_in_queue",
                    "Position in queue"
                  )}
                  :{" "}
                  <strong>
                    #{queuePosition}
                  </strong>
                </div>
              </div>
            </div>

            {/* Queue Status Message */}
            {bookingStatus === "CHECKED_IN" && (
              <div
                className="gov-alert gov-alert-info"
                style={{
                  marginBottom: "20px"
                }}
              >
                <Clock
                  size={20}
                  color="#0284c7"
                />

                <div>
                  <strong>
                    {t(
                      "queue_checked_in",
                      "You are checked in and waiting for procurement processing."
                    )}
                  </strong>

                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "3px"
                    }}
                  >
                    {vehiclesAhead === 0
                      ? t(
                        "no_vehicles_ahead",
                        "You are next in line."
                      )
                      : `${vehiclesAhead} ${vehiclesAhead === 1
                        ? "vehicle is"
                        : "vehicles are"
                      } ahead of you.`}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Processing Message */}
            {bookingStatus === "PAYMENT_PROCESSING" && (
              <div
                className="gov-alert gov-alert-info"
                style={{
                  marginBottom: "20px"
                }}
              >
                <CreditCard
                  size={22}
                  color="#0284c7"
                />

                <div>
                  <strong>
                    {t(
                      "payment_processing_message",
                      "Your procurement is complete and DBT payment is being processed."
                    )}
                  </strong>

                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "3px"
                    }}
                  >
                    {t(
                      "payment_processing_subtext",
                      "Payment settlement is expected within 48–72 hours after verification."
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Procurement Stages */}
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "12px",
                color: "var(--gov-navy)"
              }}
            >
              {t(
                "procurement_stages",
                "Procurement Processing Stages"
              )}
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;

                const isCompleted =
                  idx < currentIndex;

                const isCurrent =
                  idx === currentIndex &&
                  currentIndex < STAGES.length;

                const isPending =
                  idx > currentIndex;

                /*
                 * Special case:
                 * PAYMENT_PROCESSING means the payment stage
                 * is currently running, but NOT completed.
                 */
                const isPaymentProcessing =
                  bookingStatus === "PAYMENT_PROCESSING" &&
                  idx === 4;

                /*
                 * PAYMENT_SETTLED means all stages are complete.
                 */
                const isPaymentSettled =
                  bookingStatus === "PAYMENT_SETTLED" &&
                  idx === 4;

                const stageIsCompleted =
                  isCompleted || isPaymentSettled;

                const stageIsCurrent =
                  isCurrent && !isPaymentSettled;

                const stageIsPending =
                  isPending && !isPaymentSettled;

                return (
                  <div
                    key={stage.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "6px",

                      backgroundColor:
                        stageIsCurrent ||
                          isPaymentProcessing
                          ? "#f0fdf4"
                          : stageIsCompleted
                            ? "#f8fafc"
                            : "#ffffff",

                      border:
                        stageIsCurrent ||
                          isPaymentProcessing
                          ? "2px solid #16a34a"
                          : "1px solid var(--border-color)"
                    }}
                  >

                    {/* Stage Icon */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        minWidth: "36px",
                        borderRadius: "50%",

                        backgroundColor:
                          stageIsCompleted
                            ? "#0284c7"
                            : stageIsCurrent ||
                              isPaymentProcessing
                              ? "#16a34a"
                              : "#e2e8f0",

                        color:
                          stageIsPending
                            ? "#64748b"
                            : "#ffffff",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {stageIsCompleted ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>

                    {/* Stage Information */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight:
                            stageIsCurrent ||
                              isPaymentProcessing
                              ? 800
                              : 600,

                          color:
                            stageIsCurrent ||
                              isPaymentProcessing
                              ? "#15803d"
                              : "var(--text-main)"
                        }}
                      >
                        {stage.label}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)"
                        }}
                      >
                        {getStageStatusText(stage, idx)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fully Completed Message */}
            {bookingStatus === "PAYMENT_SETTLED" && (
              <div
                className="gov-alert gov-alert-success"
                style={{
                  marginTop: "20px"
                }}
              >
                <CheckCircle
                  size={22}
                  color="#16a34a"
                />

                <div>
                  <strong>
                    {t(
                      "procurement_complete",
                      "Procurement and DBT payment process completed successfully."
                    )}
                  </strong>

                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "3px"
                    }}
                  >
                    {t(
                      "payment_settled_message",
                      "The payment has been successfully settled to the farmer's registered bank account."
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "30px"
            }}
          >
            <p>
              {t(
                "no_active_queue",
                "No active queue entry found."
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}