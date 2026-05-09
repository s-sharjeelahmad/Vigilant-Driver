import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import CompanySubnav from "../components/CompanySubnav";
import { companyApi } from "../lib/apiClient";
import { clearCompanySession } from "../lib/companySession";
import { formatDisplayValue } from "../lib/dateFormatter";

const initialVehicle = {
  vehicle_number: "",
  vehicle_type: "",
  make: "",
  model: "",
  year: "",
  is_active: true
};

function CompanyVehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [assignForm, setAssignForm] = useState({ driver_id: "", vehicle_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");

  const loadData = async () => {
    setLoading(true);
    setPageError("");
    try {
      const [vehicleData, driverData] = await Promise.all([
        companyApi.getVehicles(),
        companyApi.getDrivers().catch(() => [])
      ]);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setDrivers(Array.isArray(driverData) ? driverData : []);
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("no vehicles found")) {
        setVehicles([]);
      } else {
        setPageError(err.message || "Unable to load vehicles.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onVehicleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setVehicleForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onAssignChange = (event) => {
    const { name, value } = event.target;
    setAssignForm((prev) => ({ ...prev, [name]: value }));
  };

  const onAddVehicle = async (event) => {
    event.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!vehicleForm.vehicle_number.trim()) {
      setModalError("Vehicle number is required.");
      return;
    }

    setSaving(true);
    try {
      await companyApi.addVehicle({
        ...vehicleForm,
        year: vehicleForm.year === "" ? null : Number(vehicleForm.year)
      });
      setModalSuccess("Vehicle created successfully.");
      setVehicleForm(initialVehicle);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || "Unable to add vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const onAssignVehicle = async (event) => {
    event.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!assignForm.driver_id || !assignForm.vehicle_id) {
      setModalError("Driver ID and vehicle ID are required.");
      return;
    }

    setSaving(true);
    try {
      await companyApi.assignVehicle(assignForm);
      setModalSuccess("Vehicle assigned successfully.");
      setAssignForm({ driver_id: "", vehicle_id: "" });
      setShowModal(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || "Unable to assign vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteVehicle = async (vehicleId) => {
    setPageError("");
    setPageSuccess("");
    try {
      await companyApi.deleteVehicle(vehicleId);
      setPageSuccess("Vehicle deleted successfully.");
      await loadData();
    } catch (err) {
      setPageError(err.message || "Unable to delete vehicle.");
    }
  };

  const handleLogout = () => {
    clearCompanySession();
    navigate("/login", { replace: true });
  };

  const openModal = (mode) => {
    setModalMode(mode);
    setShowModal(true);
    setModalError("");
    setModalSuccess("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <section className="section">
      <div className="container container-wide company-page-wrap">
        <div className={`page-content ${showModal ? "is-blurred" : ""}`}>
          <div className="company-head">
            <SectionHeader eyebrow="Company Vehicles" title="Vehicle Management" text="Register vehicles and assign them to company drivers." />
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </div>

          <CompanySubnav />

          <article className="card">
            <div className="card-header">
              <h3>Vehicle List</h3>
              <div className="action-row">
                <button type="button" className="btn btn-primary" onClick={() => openModal("add")}>Add Vehicle</button>
                <button type="button" className="btn btn-ghost" onClick={() => openModal("assign")}>Assign Vehicle</button>
              </div>
            </div>
            {loading ? <p className="state loading">Loading vehicles...</p> : null}
            {pageError ? <p className="state error">{pageError}</p> : null}
            {pageSuccess ? <p className="state success">{pageSuccess}</p> : null}

            {!loading && !pageError ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Type</th>
                      <th>Make</th>
                      <th>Model</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length ? vehicles.map((vehicle) => (
                      <tr key={vehicle.vehicle_id}>
                        <td>{formatDisplayValue(vehicle.vehicle_number)}</td>
                        <td>{formatDisplayValue(vehicle.vehicle_type)}</td>
                        <td>{formatDisplayValue(vehicle.make)}</td>
                        <td>{formatDisplayValue(vehicle.model)}</td>
                        <td>{formatDisplayValue(vehicle.year)}</td>
                        <td>{vehicle.is_active ? "Active" : "Inactive"}</td>
                        <td><button type="button" className="btn btn-danger" onClick={() => onDeleteVehicle(vehicle.vehicle_id)}>Delete</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </div>

        {showModal ? (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Vehicle Actions</h3>
                <button type="button" className="modal-close" onClick={handleCloseModal}>✕</button>
              </div>
              <div className="tab-row">
                <button type="button" className={`btn ${modalMode === "add" ? "btn-primary" : "btn-ghost"}`} onClick={() => setModalMode("add")}>Add Vehicle</button>
                <button type="button" className={`btn ${modalMode === "assign" ? "btn-primary" : "btn-ghost"}`} onClick={() => setModalMode("assign")}>Assign Vehicle</button>
              </div>

              {modalError ? <div className="modal-alert error">{modalError}</div> : null}
              {modalSuccess ? <div className="modal-alert success">{modalSuccess}</div> : null}
              {modalMode === "add" ? (
                <form className="admin-form" onSubmit={onAddVehicle}>
                  <label>Vehicle Number *<input name="vehicle_number" value={vehicleForm.vehicle_number} onChange={onVehicleChange} required /></label>
                  <label>Vehicle Type<input name="vehicle_type" value={vehicleForm.vehicle_type} onChange={onVehicleChange} /></label>
                  <label>Make<input name="make" value={vehicleForm.make} onChange={onVehicleChange} /></label>
                  <label>Model<input name="model" value={vehicleForm.model} onChange={onVehicleChange} /></label>
                  <label>Year<input type="number" name="year" value={vehicleForm.year} onChange={onVehicleChange} /></label>
                  <label className="inline-check"><input type="checkbox" name="is_active" checked={vehicleForm.is_active} onChange={onVehicleChange} />Active</label>
                  <button type="submit" className="btn btn-primary full" disabled={saving}>{saving ? "Saving..." : "Create Vehicle"}</button>
                </form>
              ) : (
                <form className="admin-form" onSubmit={onAssignVehicle}>
                  <label>
                    Driver ID *
                    <select name="driver_id" value={assignForm.driver_id} onChange={onAssignChange} required>
                      <option value="">Select driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.driver_id} value={driver.driver_id}>{driver.full_name || driver.driver_id}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Vehicle ID *
                    <select name="vehicle_id" value={assignForm.vehicle_id} onChange={onAssignChange} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.vehicle_number || vehicle.vehicle_id}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn btn-primary full" disabled={saving}>{saving ? "Saving..." : "Assign Vehicle"}</button>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default CompanyVehiclesPage;
