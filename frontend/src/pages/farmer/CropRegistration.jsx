import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Wheat, Plus, CheckCircle, MapPin, Calendar, Layers } from "lucide-react";

export default function CropRegistration({ setActiveTab }) {
  const { user, t } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New Farm form state
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [surveyNumber, setSurveyNumber] = useState("");
  const [areaAcres, setAreaAcres] = useState("5.0");
  const [latitude, setLatitude] = useState("29.7214");
  const [longitude, setLongitude] = useState("76.9621");
  const [soilType, setSoilType] = useState("Alluvial Loam");
  const [irrigationSource, setIrrigationSource] = useState("Tube Well");

  // New Crop form state
  const [cropName, setCropName] = useState("Wheat");
  const [variety, setVariety] = useState("PBW-550");
  const [sowingDate, setSowingDate] = useState("2026-05-15");
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("2026-09-08");
  const [quantityQuintals, setQuantityQuintals] = useState("60.0");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFarms();
  }, [user.farmerId]);

  const loadFarms = async () => {
    setLoading(true);
    try {
      const data = await api.getFarmerFarms(user.farmerId || "frm-01");
      setFarms(data || []);
      if (data && data.length > 0) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      console.error("Error loading farms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createFarm({
        farmer_id: user.farmerId || "frm-01",
        survey_number: surveyNumber || `SY-${Math.floor(Math.random() * 900 + 100)}`,
        area_acres: parseFloat(areaAcres),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        soil_type: soilType,
        irrigation_source: irrigationSource,
      });
      setSuccessMsg("Farm plot registered successfully!");
      setShowAddFarm(false);
      await loadFarms();
    } catch (err) {
      alert("Error registering farm: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    if (!selectedFarmId) {
      alert("Please select a farm plot first.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createCrop({
        farm_id: selectedFarmId,
        crop_name: cropName,
        variety: variety,
        sowing_date: sowingDate,
        expected_harvest_date: expectedHarvestDate,
        estimated_quantity_quintals: parseFloat(quantityQuintals),
      });
      setSuccessMsg("Crop registered successfully! Redirecting to slot booking...");
      await loadFarms();
      setTimeout(() => {
        setActiveTab("book-slot");
      }, 1500);
    } catch (err) {
      alert("Error registering crop: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Wheat size={22} color="var(--gov-primary)" />
            <span>{t("crop_reg_heading", "Farm Land & Harvested Crop Registration")}</span>
          </div>
          <button
            id="btn-toggle-add-farm"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddFarm(!showAddFarm)}
          >
            <Plus size={16} />
            <span>{showAddFarm ? t("btn_hide_farm", "Hide Form") : t("btn_add_farm", "+ Add New Farm Plot")}</span>
          </button>
        </div>

        {successMsg && (
          <div className="gov-alert gov-alert-success">
            <CheckCircle size={20} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Optional Add Farm Section */}
        {showAddFarm && (
          <form onSubmit={handleCreateFarm} style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "6px", marginBottom: "20px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "var(--gov-navy)" }}>
              {t("farm_plot_details", "Register New Farm Plot")}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">{t("survey_number", "Survey / Khasra No.")}</label>
                <input
                  type="text"
                  className="form-control"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  placeholder="e.g. SY-108/B"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("area_acres", "Area (Acres)")}</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={areaAcres}
                  onChange={(e) => setAreaAcres(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("latitude_lbl", "GPS Latitude")}</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-control"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("longitude_lbl", "GPS Longitude")}</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-control"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" id="btn-submit-farm" className="btn btn-primary" disabled={submitting}>
              {t("save_farm_plot", "Save Farm Plot")}
            </button>
          </form>
        )}

        {/* Crop Registration Form */}
        <form onSubmit={handleCreateCrop}>
          <div className="form-group">
            <label className="form-label">{t("select_farm_plot", "Select Registered Farm Plot")}</label>
            <select
              id="select-farm"
              className="form-control"
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              required
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  Survey #{f.survey_number} • {f.area_acres} Acres (GPS: {f.latitude}, {f.longitude})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">{t("crop_name", "Crop Name")}</label>
              <select
                id="select-crop-name"
                className="form-control"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
              >
                <option value="Wheat">Wheat - MSP ₹2,275/q</option>
                <option value="Paddy">Paddy - MSP ₹2,300/q</option>
                <option value="Basmati Rice">Basmati Rice - MSP ₹3,200/q</option>
                <option value="Soybean">Soybean - MSP ₹4,600/q</option>
                <option value="Maize">Maize - MSP ₹2,090/q</option>
                <option value="Cotton">Cotton - MSP ₹6,620/q</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("crop_variety", "Crop Variety")}</label>
              <input
                id="input-variety"
                type="text"
                className="form-control"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. PBW-550, HD-3086"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("sowing_date", "Sowing Date")}</label>
              <input
                id="input-sowing-date"
                type="date"
                className="form-control"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("expected_harvest", "Expected Harvest Date")}</label>
              <input
                id="input-harvest-date"
                type="date"
                className="form-control"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("estimated_yield", "Estimated Quantity (Quintals)")}</label>
              <input
                id="input-quantity"
                type="number"
                step="1"
                min="1"
                className="form-control"
                value={quantityQuintals}
                onChange={(e) => setQuantityQuintals(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-crop"
            className="btn btn-primary btn-block"
            style={{ marginTop: "12px" }}
            disabled={submitting}
          >
            {submitting ? "Registering..." : t("btn_submit_crop", "Register Crop for Procurement")}
          </button>
        </form>
      </div>

      {/* Currently Registered Crops Table */}
      <div className="gov-card">
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px", color: "var(--gov-navy)" }}>
          {t("registered_farms_crops", "Registered Farms & Active Crops")}
        </h3>

        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Farm Parcel</th>
                <th>{t("crop_name", "Crop")}</th>
                <th>{t("crop_variety", "Variety")}</th>
                <th>{t("sowing_date", "Sowing")}</th>
                <th>{t("crop_and_qty", "Quantity (Quintals)")}</th>
                <th>MSP Rate</th>
                <th>{t("status_label", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {farms.flatMap((f) =>
                f.crops.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{f.survey_number}</strong> ({f.area_acres} Acres)</td>
                    <td>{c.crop_name}</td>
                    <td>{c.variety}</td>
                    <td>{c.sowing_date}</td>
                    <td><strong>{c.estimated_quantity_quintals} q</strong></td>
                    <td>₹{c.msp_rate}/q</td>
                    <td>
                      <span className="status-badge badge-procurement-completed">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
