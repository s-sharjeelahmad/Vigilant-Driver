import { useEffect, useState } from "react";
import { Plus, Link as LinkIcon, Trash2, Car } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/ToastContext";
import { companyApi } from "../lib/apiClient";
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
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [assignForm, setAssignForm] = useState({ driver_id: "", vehicle_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "assign"
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const { showToast } = useToast();

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
      setVehicleForm(initialVehicle);
      setShowModal(false);
      showToast("Vehicle registered successfully.", "success");
      await loadData();
    } catch (err) {
      setModalError(err.message || "Unable to register vehicle.");
      showToast("Unable to register vehicle.", "error");
    } finally {
      setSaving(false);
    }
  };

  const onAssignVehicle = async (event) => {
    event.preventDefault();
    setModalError("");

    if (!assignForm.driver_id || !assignForm.vehicle_id) {
      setModalError("Driver ID and vehicle ID are required.");
      return;
    }

    setSaving(true);
    try {
      await companyApi.assignVehicle(assignForm);
      setAssignForm({ driver_id: "", vehicle_id: "" });
      setShowModal(false);
      showToast("Vehicle successfully assigned to driver.", "success");
      await loadData();
    } catch (err) {
      setModalError(err.message || "Unable to assign vehicle.");
      showToast("Unable to assign vehicle.", "error");
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setPageError("");
    try {
      await companyApi.deleteVehicle(vehicleToDelete.vehicle_id);
      showToast("Vehicle removed successfully.", "success");
      await loadData();
    } catch (err) {
      showToast(err.message || "Unable to remove vehicle.", "error");
    } finally {
      setVehicleToDelete(null);
    }
  };

  const openModal = (mode) => {
    setModalMode(mode);
    setShowModal(true);
    setModalError("");
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Fleet Vehicles</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Register and manage vehicles across your operations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => openModal("assign")}
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LinkIcon size={18} /> Assign Vehicle
          </button>
          <button 
            onClick={() => openModal("add")}
            style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Register Vehicle
          </button>
        </div>
      </div>

      <ErrorBanner message={pageError} />

      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? <TableSkeleton /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vehicle Tag</th>
                  <th>Type</th>
                  <th>Make & Model</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length ? vehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--color-surface-elevated)', padding: '0.5rem', borderRadius: '6px' }}><Car size={16} /></div>
                        <span className="ds-label" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{formatDisplayValue(vehicle.vehicle_number)}</span>
                      </div>
                    </td>
                    <td>{formatDisplayValue(vehicle.vehicle_type) || "-"}</td>
                    <td>
                      {vehicle.make || vehicle.model ? (
                        <div className="ds-body-small">
                          {formatDisplayValue(vehicle.make)} {formatDisplayValue(vehicle.model)}
                        </div>
                      ) : "-"}
                    </td>
                    <td>{formatDisplayValue(vehicle.year) || "-"}</td>
                    <td>{vehicle.is_active ? <StatusPill status="Active" /> : <StatusPill status="Inactive" />}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => setVehicleToDelete(vehicle)}
                        style={{ background: 'transparent', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '0.35rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Remove Vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: 0 }}>
                      <EmptyState title="No vehicles found" description="There are no vehicles registered in this fleet yet." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={executeDeleteVehicle}
        title="Remove Vehicle"
        message={`Are you sure you want to completely remove vehicle ${vehicleToDelete?.vehicle_number} from the system?`}
        confirmText="Remove Vehicle"
        isDestructive={true}
      />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: 'var(--shadow-high)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 className="ds-heading-2" style={{ margin: 0 }}>{modalMode === "add" ? "Register Vehicle" : "Assign Driver"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>×</button>
            </div>

            {/* Segmented Control */}
            <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <button type="button" onClick={() => setModalMode("add")} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: modalMode === "add" ? 'var(--color-surface)' : 'transparent', color: modalMode === "add" ? 'var(--color-text-primary)' : 'var(--color-text-muted)', boxShadow: modalMode === "add" ? 'var(--shadow-low)' : 'none' }}>
                Register New
              </button>
              <button type="button" onClick={() => setModalMode("assign")} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: modalMode === "assign" ? 'var(--color-surface)' : 'transparent', color: modalMode === "assign" ? 'var(--color-text-primary)' : 'var(--color-text-muted)', boxShadow: modalMode === "assign" ? 'var(--shadow-low)' : 'none' }}>
                Assign Driver
              </button>
            </div>

            <ErrorBanner message={modalError} />

            {modalMode === "add" ? (
              <form onSubmit={onAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  License Plate / Tag *
                  <input name="vehicle_number" value={vehicleForm.vehicle_number} onChange={onVehicleChange} required style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="e.g. ABC-123" />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Type
                    <input name="vehicle_type" value={vehicleForm.vehicle_type} onChange={onVehicleChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="e.g. Truck, Van" />
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Year
                    <input type="number" name="year" value={vehicleForm.year} onChange={onVehicleChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="e.g. 2024" />
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Make
                    <input name="make" value={vehicleForm.make} onChange={onVehicleChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="e.g. Ford" />
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Model
                    <input name="model" value={vehicleForm.model} onChange={onVehicleChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} placeholder="e.g. Transit" />
                  </label>
                </div>
                
                <button type="submit" disabled={saving} style={{ marginTop: '1rem', background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? "Registering..." : "Register Vehicle"}
                </button>
              </form>
            ) : (
              <form onSubmit={onAssignVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Select Driver *
                  <select name="driver_id" value={assignForm.driver_id} onChange={onAssignChange} required style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                    <option value="">-- Choose a driver --</option>
                    {drivers.map((d) => <option key={d.driver_id} value={d.driver_id}>{d.full_name}</option>)}
                  </select>
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Select Vehicle *
                  <select name="vehicle_id" value={assignForm.vehicle_id} onChange={onAssignChange} required style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                    <option value="">-- Choose a vehicle --</option>
                    {vehicles.map((v) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number}</option>)}
                  </select>
                </label>
                <button type="submit" disabled={saving} style={{ marginTop: '1rem', background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? "Assigning..." : "Confirm Assignment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyVehiclesPage;
