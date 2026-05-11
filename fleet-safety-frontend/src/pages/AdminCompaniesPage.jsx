import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Building, Building2, Trash2, Edit } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import SearchInput from "../components/SearchInput";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/ToastContext";
import { adminApi } from "../lib/apiClient";
import { formatDateTimeUS } from "../lib/dateFormatter";

const initialForm = {
  company_name: "",
  company_type: "",
  email: "",
  password: "",
  country_code: "+92",
  contact_number: "",
  company_address: "",
  city: "Karachi",
  country: "Pakistan",
  subscription_plan: "basic",
  subscription_status: "active",
  subscription_expiry: ""
};

const subscriptionPlanOptions = [
  { label: "Basic Tier", value: "basic" },
  { label: "Premium Tier", value: "premium" }
];

const subscriptionStatusOptions = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" }
];

const countryCodeOptions = [
  { label: "Pakistan (+92)", value: "+92" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "Canada (+1)", value: "+1" }
];

const countryCityMap = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Multan", "Peshawar", "Quetta"],
  USA: ["New York", "Los Angeles", "Chicago", "Houston", "Dallas"],
  UK: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]
};

function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const { showToast } = useToast();

  const loadCompanies = async (searchTerm = "") => {
    setLoading(true);
    setListError("");
    try {
      const data = await adminApi.getCompanies(searchTerm);
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setListError(err.message || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const onFormChange = (event) => {
    const { name, value } = event.target;
    if (name === "contact_number") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    if (name === "country") {
      const defaultCity = countryCityMap[value]?.[0] || "";
      setForm((prev) => ({ ...prev, country: value, city: defaultCity }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createPayload = useMemo(() => {
    const payload = {
      ...form,
      company_name: form.company_name.trim(),
      email: form.email.trim(),
      password: form.password
    };

    Object.keys(payload).forEach((key) => {
      if (typeof payload[key] === "string" && payload[key].trim() === "") {
        payload[key] = null;
      }
    });

    return payload;
  }, [form]);

  const onCreateCompany = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.company_name.trim() || !form.email.trim() || !form.password) {
      setFormError("Company name, email and password are required.");
      return;
    }

    if (form.contact_number && form.contact_number.length !== 10) {
      setFormError("Contact number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.addCompany(createPayload);
      setForm(initialForm);
      setShowForm(false);
      showToast("Company successfully created.", "success");
      await loadCompanies(search.trim());
    } catch (err) {
      setFormError(err.message || "Unable to create company.");
      showToast("Unable to create company.", "error");
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteCompany = async () => {
    if (!companyToDelete) return;
    setListError("");
    try {
      await adminApi.deleteCompany(companyToDelete.company_id);
      showToast("Company and associated data deleted.", "success");
      await loadCompanies(search.trim());
    } catch (err) {
      showToast(err.message || "Unable to delete company.", "error");
    } finally {
      setCompanyToDelete(null);
    }
  };

  const openForm = () => {
    setForm(initialForm);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
    setFormSuccess("");
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Company Organizations</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Manage access, subscriptions, and profiles for all fleet organizations.</p>
        </div>
        <button 
          onClick={openForm}
          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Provision Company
        </button>
      </div>

      <ErrorBanner message={listError} />

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchInput 
            value={search} 
            onChange={(val) => { setSearch(val); loadCompanies(val); }} 
            placeholder="Search by name, email, or city..." 
          />
        </div>


        {loading ? <TableSkeleton /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Location</th>
                  <th>Subscription</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length ? companies.map((company) => (
                  <tr key={company.company_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--color-surface-elevated)', padding: '0.5rem', borderRadius: '6px', flexShrink: 0 }}><Building2 size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{company.company_name || "N/A"}</div>
                          <div className="ds-caption" style={{ color: 'var(--color-text-muted)' }}>{company.email || "No email"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ds-body-small">{company.city || "-"}</div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)' }}>{company.country || "-"}</div>
                    </td>
                    <td>
                      <span className="ds-label" style={{ background: 'var(--color-surface-elevated)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', textTransform: 'capitalize' }}>
                        {company.subscription_plan || "None"}
                      </span>
                    </td>
                    <td>
                      {company.subscription_status === "active" ? <StatusPill status="Active" /> : <StatusPill status="Suspended" />}
                    </td>
                    <td className="ds-body-small">{formatDateTimeUS(company.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => setCompanyToDelete(company)}
                        style={{ background: 'transparent', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '0.35rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Delete Company"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: 0 }}>
                      <EmptyState title="No organizations found" description="You have not provisioned any companies yet, or your search query returned no results." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={executeDeleteCompany}
        title="Delete Organization"
        message={`WARNING: You are about to delete ${companyToDelete?.company_name} and all associated drivers, vehicles, and sessions. This is a permanent destructive action.`}
        confirmText="Delete Organization"
        isDestructive={true}
      />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={closeForm}>
          <div 
            className="card" 
            style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'var(--shadow-high)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h2 className="ds-heading-2" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={20} /> Provision Organization Account</h2>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>×</button>
            </div>

            <ErrorBanner message={formError} />

            <form onSubmit={onCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Account Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="ds-label" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-divider)', paddingBottom: '0.25rem' }}>Account Details</h3>
                
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Company Name *
                  <input name="company_name" value={form.company_name} onChange={onFormChange} placeholder="e.g., SafeTransport Ltd" required style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Email *
                    <input type="email" name="email" value={form.email} onChange={onFormChange} placeholder="admin@company.com" required style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Initial Password *
                    <input type="password" name="password" value={form.password} onChange={onFormChange} placeholder="Min 8 chars" required style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                  </label>
                </div>
              </div>

              {/* Location & Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="ds-label" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-divider)', paddingBottom: '0.25rem' }}>Location & Contact</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Country Code
                    <select name="country_code" value={form.country_code} onChange={onFormChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      {countryCodeOptions.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Phone Number
                    <input name="contact_number" value={form.contact_number} onChange={onFormChange} placeholder="10 digits" maxLength={10} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Country
                    <select name="country" value={form.country} onChange={onFormChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      {Object.keys(countryCityMap).map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    City
                    <select name="city" value={form.city} onChange={onFormChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      {(countryCityMap[form.country] || []).map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {/* Billing Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h3 className="ds-label" style={{ margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Billing & Provisioning</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Plan Type
                    <select name="subscription_plan" value={form.subscription_plan} onChange={onFormChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      {subscriptionPlanOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Account Status
                    <select name="subscription_status" value={form.subscription_status} onChange={onFormChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      {subscriptionStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Expiry Date
                    <input type="date" name="subscription_expiry" value={form.subscription_expiry} onChange={onFormChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ flex: 1, background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Provisioning..." : "Create Organization"}
                </button>
                <button 
                  type="button" 
                  onClick={closeForm}
                  style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCompaniesPage;
