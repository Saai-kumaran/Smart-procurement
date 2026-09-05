import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Calendar,
  MapPin,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CloudRain,
  XCircle,
  Wheat,
  RefreshCw
} from "lucide-react";

export default function SlotBooking({ setActiveTab, onSelectBooking }) {
  const { user, t } = useAuth();

  const farmerId = user?.farmerId || "frm-01";

  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingCrops, setLoadingCrops] = useState(true);

  const [recommendationData, setRecommendationData] = useState(null);

  const [reserving, setReserving] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // ============================================================
  // LOAD REGISTERED CROPS
  // ============================================================

  useEffect(() => {
    loadCrops();
  }, [farmerId]);

  const loadCrops = async () => {
    setLoadingCrops(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const farms = await api.getFarmerFarms(farmerId);

      const farmList = Array.isArray(farms) ? farms : [];

      const allCrops = farmList.flatMap((farm) =>
        Array.isArray(farm?.crops) ? farm.crops : []
      );

      setCrops(allCrops);

      if (allCrops.length > 0) {
        const firstCrop = allCrops[0];

        setSelectedCropId(firstCrop.id);

        await fetchRecommendations(firstCrop.id);
      } else {
        setRecommendationData(null);
        setSelectedCropId("");

        setInfoMsg(
          t(
            "no_registered_crop",
            "No registered crops found. Please register your crop before booking a procurement slot."
          )
        );
      }
    } catch (err) {
      console.error("Error loading crops:", err);

      setCrops([]);
      setRecommendationData(null);

      setErrorMsg(
        t(
          "crop_loading_error",
          "Unable to load registered crops. Please try again."
        )
      );
    } finally {
      setLoadingCrops(false);
    }
  };

  // ============================================================
  // FETCH AI RECOMMENDATIONS
  // ============================================================

  const fetchRecommendations = async (cropId) => {
    if (!cropId) {
      setRecommendationData(null);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    setConfirmedBooking(null);

    try {
      const data = await api.recommendSlots(
        farmerId,
        cropId
      );

      const recommendations = Array.isArray(
        data?.recommendations
      )
        ? data.recommendations
        : [];

      setRecommendationData({
        ...data,
        recommendations
      });

      if (recommendations.length === 0) {
        setInfoMsg(
          t(
            "no_slots_found",
            "No suitable procurement slots are currently available for this crop."
          )
        );
      }
    } catch (err) {
      console.error(
        "Error generating slot recommendations:",
        err
      );

      setRecommendationData(null);

      setErrorMsg(
        t(
          "recommendation_error",
          "Failed to generate AI slot recommendations."
        ) +
        (err?.message
          ? ` ${err.message}`
          : "")
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SELECTED CROP
  // ============================================================

  const selectedCrop = crops.find(
    (crop) => crop.id === selectedCropId
  );

  const registeredQuantity = Number(
    selectedCrop?.estimated_quantity_quintals
  );

  // ============================================================
  // WEATHER RISK
  // ============================================================

  const getWeatherRisk = (slot) => {
    const risk = String(
      slot?.weather_risk_level || "LOW"
    ).toUpperCase();

    if (risk === "HIGH") {
      return "HIGH";
    }

    if (
      risk === "MEDIUM" ||
      risk === "MODERATE"
    ) {
      return "MEDIUM";
    }

    return "LOW";
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "HIGH":
        return "#dc2626";

      case "MEDIUM":
        return "#d97706";

      default:
        return "#16a34a";
    }
  };

  const getRiskBackground = (risk) => {
    switch (risk) {
      case "HIGH":
        return "#fef2f2";

      case "MEDIUM":
        return "#fffbeb";

      default:
        return "#f0fdf4";
    }
  };

  const getRiskText = (risk) => {
    switch (risk) {
      case "HIGH":
        return t(
          "risk_high",
          "High Weather Risk"
        );

      case "MEDIUM":
        return t(
          "risk_moderate",
          "Moderate Weather Risk"
        );

      default:
        return t(
          "risk_low",
          "Low Risk • Favorable"
        );
    }
  };

  // ============================================================
  // FILTERED RISK SLOTS
  // ============================================================

  const recommendations =
    recommendationData?.recommendations || [];

  const highRiskSlots = recommendations.filter(
    (slot) => getWeatherRisk(slot) === "HIGH"
  );

  const mediumRiskSlots =
    recommendations.filter(
      (slot) => getWeatherRisk(slot) === "MEDIUM"
    );

  const lowRiskSlots = recommendations.filter(
    (slot) => getWeatherRisk(slot) === "LOW"
  );

  const bestSafeSlot =
    lowRiskSlots.length > 0
      ? lowRiskSlots[0]
      : null;

  // ============================================================
  // CONFIRM BOOKING
  // ============================================================

  const handleConfirmSlot = async (slot) => {
    if (!selectedCrop) {
      setErrorMsg(
        t(
          "select_crop_required",
          "Please select a registered crop before booking."
        )
      );

      return;
    }

    const risk = getWeatherRisk(slot);

    // ----------------------------------------------------------
    // BLOCK HIGH WEATHER RISK
    // ----------------------------------------------------------

    if (risk === "HIGH") {
      setErrorMsg(
        t(
          "high_weather_booking_blocked",
          "This slot cannot be booked because the forecast shows HIGH weather risk. Please choose a LOW-risk slot recommended by the AI."
        )
      );

      return;
    }

    // ----------------------------------------------------------
    // VALIDATE REGISTERED QUANTITY
    // ----------------------------------------------------------

    if (
      !Number.isFinite(registeredQuantity) ||
      registeredQuantity <= 0
    ) {
      setErrorMsg(
        t(
          "invalid_crop_quantity",
          "The registered crop quantity is invalid. Please update your crop registration before booking."
        )
      );

      return;
    }

    // ----------------------------------------------------------
    // CHECK MANDI CAPACITY
    // ----------------------------------------------------------

    const remainingCapacity = Number(
      slot?.remaining_capacity
    );

    if (
      Number.isFinite(remainingCapacity) &&
      registeredQuantity > remainingCapacity
    ) {
      setErrorMsg(
        `This mandi slot has only ${remainingCapacity}q remaining capacity, while your registered quantity is ${registeredQuantity}q. Please choose another slot.`
      );

      return;
    }

    setReserving(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const payload = {
        farmer_id: farmerId,
        crop_id: selectedCropId,

        centre_id: slot.centre_id,
        slot_id: slot.slot_id,

        slot_date: slot.slot_date,
        time_window: slot.time_window,

        // Use the actual registered crop quantity.
        quantity_quintals: registeredQuantity
      };

      const res = await api.confirmBooking(payload);

      setConfirmedBooking(res);

      if (onSelectBooking && res?.id) {
        onSelectBooking(res.id);
      }
    } catch (err) {
      console.error(
        "Booking confirmation failed:",
        err
      );

      setErrorMsg(
        t(
          "booking_confirmation_error",
          "Booking confirmation failed."
        ) +
        (err?.message
          ? ` ${err.message}`
          : "")
      );
    } finally {
      setReserving(false);
    }
  };

  // ============================================================
  // LOADING CROPS
  // ============================================================

  if (loadingCrops) {
    return (
      <div
        className="gov-card"
        style={{
          textAlign: "center",
          padding: "40px 20px"
        }}
      >
        <RefreshCw
          size={32}
          style={{
            margin: "0 auto 12px",
            animation:
              "spin 1s linear infinite"
          }}
        />

        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            marginBottom: "6px"
          }}
        >
          {t(
            "loading_crops",
            "Loading Registered Crops..."
          )}
        </h3>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px"
          }}
        >
          {t(
            "loading_crop_message",
            "Fetching your registered crop information."
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ========================================================
          MAIN HEADER
      ======================================================== */}

      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Calendar
              size={22}
              color="var(--gov-primary)"
            />

            <span>
              {t(
                "slot_booking_title",
                "AI-Powered Harvest Slot Allocation & Congestion Balancer"
              )}
            </span>
          </div>

          <span className="status-badge badge-inspection">
            AI Multi-Objective
          </span>
        </div>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "16px"
          }}
        >
          {t(
            "slot_booking_subtitle",
            "Avoid mandi traffic jams, minimize open-air crop spoilage, and secure guaranteed same-day weighment."
          )}
        </p>

        {/* ======================================================
            CROP SELECTION
        ====================================================== */}

        {crops.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
              flexWrap: "wrap",
              marginBottom: "16px"
            }}
          >
            <div
              className="form-group"
              style={{
                flex: "1 1 240px",
                marginBottom: "0"
              }}
            >
              <label className="form-label">
                {t(
                  "select_crop_label",
                  "Select Registered Crop:"
                )}
              </label>

              <select
                id="select-booking-crop"
                className="form-control"
                value={selectedCropId}
                onChange={(e) => {
                  const cropId =
                    e.target.value;

                  setSelectedCropId(cropId);

                  setRecommendationData(null);
                  setConfirmedBooking(null);

                  fetchRecommendations(cropId);
                }}
                disabled={loading}
              >
                {crops.map((crop) => (
                  <option
                    key={crop.id}
                    value={crop.id}
                  >
                    {crop.crop_name} (
                    {crop.variety}) •{" "}
                    {
                      crop.estimated_quantity_quintals
                    }{" "}
                    Quintals
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-recalculate-slots"
              className="btn btn-secondary"
              style={{
                height: "48px"
              }}
              onClick={() =>
                fetchRecommendations(
                  selectedCropId
                )
              }
              disabled={
                loading ||
                !selectedCropId
              }
            >
              <TrendingUp size={18} />

              <span>
                {loading
                  ? t(
                    "optimizing",
                    "Optimizing..."
                  )
                  : t(
                    "refresh",
                    "Re-calculate Slots"
                  )}
              </span>
            </button>
          </div>
        )}

        {/* ======================================================
            REGISTERED QUANTITY
        ====================================================== */}

        {selectedCrop && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              background: "#f8fafc",
              border:
                "1px solid var(--border-color)",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "13px"
            }}
          >
            <Wheat
              size={17}
              color="var(--gov-primary)"
            />

            <span>
              {t(
                "registered_quantity",
                "Registered Quantity"
              )}
              :{" "}
              <strong>
                {
                  selectedCrop.estimated_quantity_quintals
                }{" "}
                quintals
              </strong>
            </span>
          </div>
        )}

        {/* ======================================================
            INFORMATION MESSAGE
        ====================================================== */}

        {infoMsg && (
          <div
            className="gov-alert gov-alert-warning"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "16px"
            }}
          >
            <AlertTriangle size={21} />

            <div>{infoMsg}</div>
          </div>
        )}

        {/* ======================================================
            HIGH WEATHER ALERT
        ====================================================== */}

        {highRiskSlots.length > 0 && (
          <div
            className="gov-alert gov-alert-danger"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "16px"
            }}
          >
            <CloudRain size={21} />

            <div>
              <strong>
                {t(
                  "ai_weather_alert",
                  "AI Weather Safety Alert"
                )}
              </strong>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "13px"
                }}
              >
                {highRiskSlots.length ===
                  1
                  ? `High weather risk detected on ${highRiskSlots[0].slot_date}. Outdoor harvesting and mandi transport are not recommended for this window.`
                  : `High weather risk detected across ${highRiskSlots.length} recommended window(s). The AI has prioritized safer delivery windows.`}
              </div>

              {bestSafeSlot && (
                <div
                  style={{
                    marginTop: "7px",
                    fontWeight: 700,
                    fontSize: "13px"
                  }}
                >
                  {t(
                    "recommended_safe_option",
                    "Recommended safe option"
                  )}
                  :{" "}
                  {bestSafeSlot.slot_date} •{" "}
                  {bestSafeSlot.time_window}{" "}
                  {t("at", "at")}{" "}
                  {
                    bestSafeSlot.centre_name
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================
            MEDIUM WEATHER SUMMARY
        ====================================================== */}

        {highRiskSlots.length === 0 &&
          mediumRiskSlots.length > 0 && (
            <div
              className="gov-alert gov-alert-warning"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "16px"
              }}
            >
              <AlertTriangle size={21} />

              <div>
                <strong>
                  {t(
                    "moderate_weather_alert",
                    "Moderate Weather Conditions"
                  )}
                </strong>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "13px"
                  }}
                >
                  {mediumRiskSlots.length}{" "}
                  recommended window(s) have
                  moderate weather risk. Carry
                  tarpaulin protection and prefer
                  early delivery where possible.
                </div>
              </div>
            </div>
          )}

        {/* ======================================================
            ERROR
        ====================================================== */}

        {errorMsg && (
          <div className="gov-alert gov-alert-danger">
            <AlertTriangle size={20} />

            <div>{errorMsg}</div>
          </div>
        )}

        {/* ======================================================
            CONFIRMATION SUCCESS
        ====================================================== */}

        {confirmedBooking && (
          <div
            className="gov-alert gov-alert-success"
            style={{
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <CheckCircle
                size={24}
                color="#16a34a"
              />

              <strong
                style={{
                  fontSize: "17px"
                }}
              >
                {t(
                  "slot_confirmed_success",
                  "Procurement Slot Successfully Confirmed!"
                )}
              </strong>
            </div>

            <div>
              {t(
                "token",
                "Digital Token"
              )}
              :{" "}
              <strong>
                {
                  confirmedBooking.booking_token
                }
              </strong>{" "}
              | #
              {
                confirmedBooking.token_number
              }
            </div>

            <div>
              {t(
                "reporting_mandi",
                "Reporting Centre"
              )}
              :{" "}
              <strong>
                {
                  confirmedBooking.centre_name
                }
              </strong>{" "}
              |{" "}
              {
                confirmedBooking.slot_date
              }{" "}
              (
              {
                confirmedBooking.slot_time
              }
              )
            </div>

            <div
              style={{
                fontSize: "13px",
                marginTop: "2px"
              }}
            >
              {t(
                "booked_quantity",
                "Booked Quantity"
              )}
              :{" "}
              <strong>
                {
                  confirmedBooking.quantity_quintals ??
                  registeredQuantity
                }{" "}
                quintals
              </strong>
            </div>

            <button
              id="btn-goto-digital-pass"
              className="btn btn-primary btn-sm"
              style={{
                alignSelf:
                  "flex-start",
                marginTop: "6px"
              }}
              onClick={() =>
                setActiveTab(
                  "booking-details"
                )
              }
            >
              {t(
                "view_qr_pass",
                "View QR Pass"
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          NO CROPS
      ======================================================== */}

      {crops.length === 0 && (
        <div
          className="gov-card"
          style={{
            textAlign: "center",
            padding: "35px 20px",
            marginTop: "16px"
          }}
        >
          <Wheat
            size={48}
            color="var(--gov-primary)"
            style={{
              margin: "0 auto 12px"
            }}
          />

          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginBottom: "7px"
            }}
          >
            {t(
              "no_crop_registered_title",
              "No Crop Registered"
            )}
          </h3>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              marginBottom: "16px"
            }}
          >
            {t(
              "no_crop_registered_description",
              "Register your harvested crop before selecting an optimal procurement slot."
            )}
          </p>

          <button
            className="btn btn-primary"
            onClick={() =>
              setActiveTab(
                "register-crop"
              )
            }
          >
            {t(
              "register_crop_now",
              "Register Crop Now"
            )}
          </button>
        </div>
      )}

      {/* ========================================================
          RECOMMENDED SLOTS
      ======================================================== */}

      {recommendations.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginBottom: "12px",
              color: "var(--gov-navy)"
            }}
          >
            {t(
              "best_ai_slots",
              "Recommended Optimal Delivery Windows (AI Ranked)"
            )}
          </h3>

          {recommendations.map(
            (slot, index) => {
              const risk =
                getWeatherRisk(slot);

              const isTopRanked =
                index === 0;

              const isBlocked =
                risk === "HIGH";

              const remainingCapacity =
                Number(
                  slot?.remaining_capacity
                );

              const capacityInsufficient =
                Number.isFinite(
                  remainingCapacity
                ) &&
                Number.isFinite(
                  registeredQuantity
                ) &&
                registeredQuantity >
                remainingCapacity;

              const cannotBook =
                isBlocked ||
                capacityInsufficient;

              return (
                <div
                  key={
                    slot.slot_id ||
                    `${slot.centre_id}-${slot.slot_date}-${index}`
                  }
                  className={`slot-card ${isTopRanked
                    ? "recommended-top"
                    : ""
                    }`}
                  id={`slot-card-${index + 1
                    }`}
                  style={{
                    opacity: isBlocked
                      ? 0.88
                      : 1,

                    border:
                      risk === "HIGH"
                        ? "1px solid #fecaca"
                        : risk ===
                          "MEDIUM"
                          ? "1px solid #fde68a"
                          : undefined
                  }}
                >
                  {/* Rank */}
                  <div className="slot-rank-badge">
                    {index === 0
                      ? "★ Rank #1 (AI Optimal Fit)"
                      : `#${index + 1} Alternative`}
                  </div>

                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "12px"
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                          color:
                            "var(--gov-navy)"
                        }}
                      >
                        {
                          slot.centre_name
                        }
                      </h4>

                      <div
                        style={{
                          fontSize: "13px",
                          color:
                            "var(--text-muted)",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "6px",
                          marginTop:
                            "2px"
                        }}
                      >
                        <MapPin
                          size={15}
                        />

                        <span>
                          {slot.district ||
                            "N/A"}{" "}
                          •{" "}
                          {t(
                            "distance",
                            "Distance"
                          )}
                          :{" "}
                          <strong>
                            {
                              slot.distance_km
                            }{" "}
                            km
                          </strong>{" "}
                          (~
                          {
                            slot.estimated_travel_minutes
                          }{" "}
                          mins)
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div
                      style={{
                        textAlign:
                          "right"
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "24px",
                          fontWeight:
                            900,
                          color:
                            "var(--gov-primary)"
                        }}
                      >
                        {slot.score ?? "—"}

                        <span
                          style={{
                            fontSize:
                              "14px"
                          }}
                        >
                          /100
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize:
                            "11px",
                          fontWeight:
                            700,
                          textTransform:
                            "uppercase",
                          color:
                            "var(--text-muted)"
                        }}
                      >
                        Optimization
                        Score
                      </div>
                    </div>
                  </div>

                  {/* Slot Details */}
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "10px",
                      padding: "10px",
                      backgroundColor:
                        "#f8fafc",
                      borderRadius:
                        "6px",
                      marginBottom:
                        "12px",
                      border:
                        "1px solid var(--border-color)"
                    }}
                  >
                    {/* Date */}
                    <div>
                      <div
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "var(--text-muted)",
                          fontWeight:
                            700
                        }}
                      >
                        {t(
                          "slot_datetime",
                          "Date & Time"
                        )}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "14px",
                          fontWeight:
                            700
                        }}
                      >
                        {
                          slot.slot_date
                        }{" "}
                        •{" "}
                        {
                          slot.time_window
                        }
                      </div>
                    </div>

                    {/* Weather */}
                    <div>
                      <div
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "var(--text-muted)",
                          fontWeight:
                            700
                        }}
                      >
                        {t(
                          "harvest_risk_col",
                          "Weather Risk"
                        )}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "14px",
                          fontWeight:
                            700,
                          color:
                            getRiskColor(
                              risk
                            )
                        }}
                      >
                        {
                          getRiskText(
                            risk
                          )
                        }{" "}
                        •{" "}
                        {slot.weather_condition ||
                          "Forecast available"}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div>
                      <div
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "var(--text-muted)",
                          fontWeight:
                            700
                        }}
                      >
                        {t(
                          "capacity_utilization",
                          "Mandi Utilization"
                        )}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "14px",
                          fontWeight:
                            700
                        }}
                      >
                        {
                          slot.utilization_pct ??
                          "N/A"
                        }
                        %{" "}
                        (
                        {t(
                          "remaining",
                          "Remaining"
                        )}
                        :{" "}
                        {
                          slot.remaining_capacity ??
                          "N/A"
                        }
                        q)
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      HIGH WEATHER WARNING
                  ================================================= */}

                  {risk === "HIGH" && (
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "flex-start",
                        gap: "8px",
                        padding:
                          "10px",
                        marginBottom:
                          "10px",
                        background:
                          getRiskBackground(
                            risk
                          ),
                        borderRadius:
                          "6px",
                        color:
                          "#b91c1c",
                        fontSize:
                          "13px",
                        fontWeight:
                          600
                      }}
                    >
                      <XCircle
                        size={18}
                      />

                      <span>
                        {t(
                          "booking_blocked_weather",
                          "Booking blocked: High weather risk detected. Choose a safer LOW-risk delivery window."
                        )}
                      </span>
                    </div>
                  )}

                  {/* =================================================
                      MEDIUM WEATHER WARNING
                  ================================================= */}

                  {risk === "MEDIUM" && (
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "flex-start",
                        gap: "8px",
                        padding:
                          "10px",
                        marginBottom:
                          "10px",
                        background:
                          getRiskBackground(
                            risk
                          ),
                        borderRadius:
                          "6px",
                        color:
                          "#92400e",
                        fontSize:
                          "13px",
                        fontWeight:
                          600
                      }}
                    >
                      <AlertTriangle
                        size={18}
                      />

                      <span>
                        {t(
                          "moderate_weather_warning",
                          "Moderate weather risk. Carry tarpaulin protection and prefer an early delivery window."
                        )}
                      </span>
                    </div>
                  )}

                  {/* =================================================
                      CAPACITY WARNING
                  ================================================= */}

                  {capacityInsufficient && (
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "flex-start",
                        gap: "8px",
                        padding:
                          "10px",
                        marginBottom:
                          "10px",
                        background:
                          "#fff7ed",
                        borderRadius:
                          "6px",
                        color:
                          "#9a3412",
                        fontSize:
                          "13px",
                        fontWeight:
                          600
                      }}
                    >
                      <AlertTriangle
                        size={18}
                      />

                      <span>
                        {t(
                          "capacity_insufficient",
                          "This slot does not have enough remaining mandi capacity for your registered crop quantity."
                        )}
                      </span>
                    </div>
                  )}

                  {/* =================================================
                      CONFIRM BUTTON
                  ================================================= */}

                  <button
                    id={`btn-confirm-slot-${index + 1
                      }`}
                    className="btn btn-primary btn-block"
                    disabled={
                      reserving ||
                      cannotBook
                    }
                    onClick={() =>
                      handleConfirmSlot(
                        slot
                      )
                    }
                    style={{
                      cursor:
                        cannotBook
                          ? "not-allowed"
                          : "pointer",

                      opacity:
                        cannotBook
                          ? 0.6
                          : 1
                    }}
                  >
                    {isBlocked ? (
                      <>
                        <XCircle
                          size={18}
                        />

                        <span>
                          {t(
                            "unavailable_weather",
                            "Unavailable Due to Weather Risk"
                          )}
                        </span>
                      </>
                    ) : capacityInsufficient ? (
                      <>
                        <XCircle
                          size={18}
                        />

                        <span>
                          {t(
                            "insufficient_capacity",
                            "Insufficient Mandi Capacity"
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle
                          size={18}
                        />

                        <span>
                          {t(
                            "reserve_this_slot",
                            "Reserve This Slot"
                          )}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}