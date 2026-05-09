import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import AdminSubnav from "../components/AdminSubnav";
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
  { label: "Basic", value: "basic" },
  { label: "Premium", value: "premium" }
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

const prettyValue = (value) => {
  if (!value) {
    return "N/A";
  }
  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

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

  const onSearchSubmit = async (event) => {
    event.preventDefault();
    await loadCompanies(search.trim());
  };

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

    payload.company_name = form.company_name.trim();
    payload.email = form.email.trim();
    payload.password = form.password;

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

    if (form.contact_number.length !== 10) {
      setFormError("Contact number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.addCompany(createPayload);
      setFormSuccess("Company created successfully.");
      setForm(initialForm);
      setShowForm(false);
      await loadCompanies(search.trim());
    } catch (err) {
      setFormError(err.message || "Unable to create company.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteCompany = async (companyId) => {
    setListError("");
    setListSuccess("");
    try {
      await adminApi.deleteCompany(companyId);
      setListSuccess("Company deleted successfully.");
      await loadCompanies(search.trim());
    } catch (err) {
      setListError(err.message || "Unable to delete company.");
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
    <section className="section">
      <div className="container container-wide admin-page-wrap">
        <div className={`page-content ${showForm ? "is-blurred" : ""}`}>
          <SectionHeader
            eyebrow="Admin Management"
            title="Company Administration"
            text="Review, search, create, and remove company accounts based on backend-admin controls."
          />

          <AdminSubnav />

          <article className="card">
            <div className="card-header">
              <h3>Search Companies</h3>
              <button type="button" className="btn btn-primary" onClick={openForm}>Add Company</button>
            </div>
            <form className="admin-inline-form" onSubmit={onSearchSubmit}>
              <label>
                Search
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Company name, email, city, type"
                />
              </label>
              <button type="submit" className="btn btn-primary">Find</button>
            </form>

            {loading ? <p className="state loading">Loading companies...</p> : null}
            {listError ? <p className="state error">{listError}</p> : null}
            {listSuccess ? <p className="state success">{listSuccess}</p> : null}

            {!loading && !listError ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>City</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length ? companies.map((company) => (
                      <tr key={company.company_id}>
                        <td>{company.company_name || "N/A"}</td>
                        <td>{company.email || "N/A"}</td>
                        <td>{company.city || "N/A"}</td>
                        <td>{prettyValue(company.subscription_plan)}</td>
                        <td>{prettyValue(company.subscription_status)}</td>
                        <td>{formatDateTimeUS(company.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => onDeleteCompany(company.company_id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </div>

        {showForm ? (
          <div className="modal-backdrop" onClick={closeForm}>
            <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Add Company</h3>
                <button type="button" className="modal-close" onClick={closeForm}>✕</button>
              </div>
              {formError ? <div className="modal-alert error">{formError}</div> : null}
              {formSuccess ? <div className="modal-alert success">{formSuccess}</div> : null}
              <form className="admin-form" onSubmit={onCreateCompany}>
                <label>
                  Company Name *
                  <input name="company_name" value={form.company_name} onChange={onFormChange} placeholder="e.g., SafeTransport Ltd" required />
                </label>
                <label>
                  Company Type
                  <input name="company_type" value={form.company_type} onChange={onFormChange} placeholder="e.g., Logistics, Taxi Service, Delivery" />
                </label>
                <label>
                  Email *
                  <input type="email" name="email" value={form.email} onChange={onFormChange} placeholder="company@example.com" required />
                </label>
                <label>
                  Password *
                  <input type="password" name="password" value={form.password} onChange={onFormChange} placeholder="Minimum 8 characters" required />
                </label>
                <label>
                  Country Code
                  <select name="country_code" value={form.country_code} onChange={onFormChange}>
                    {countryCodeOptions.map((option) => (
                      <option key={option.label} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Contact Number
                  <input
                    name="contact_number"
                    value={form.contact_number}
                    onChange={onFormChange}
                    placeholder="e.g., 3361234567"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                  <small className="field-hint">Must be exactly 10 digits (excluding country code).</small>
                </label>
                <label>
                  Company Address
                  <input name="company_address" value={form.company_address} onChange={onFormChange} placeholder="Street address of headquarters" />
                </label>
                <label>
                  Country
                  <select name="country" value={form.country} onChange={onFormChange}>
                    {Object.keys(countryCityMap).map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <small className="field-hint">Select your company's country.</small>
                </label>
                <label>
                  City
                  <select name="city" value={form.city} onChange={onFormChange}>
                    {(countryCityMap[form.country] || []).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <small className="field-hint">Select operating city.</small>
                </label>
                <label>
                  Subscription Plan
                  <select name="subscription_plan" value={form.subscription_plan} onChange={onFormChange}>
                    {subscriptionPlanOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Subscription Status
                  <select name="subscription_status" value={form.subscription_status} onChange={onFormChange}>
                    {subscriptionStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Subscription Expiry
                  <input type="date" name="subscription_expiry" value={form.subscription_expiry} onChange={onFormChange} />
                </label>
                <button type="submit" className="btn btn-primary full" disabled={saving}>
                  {saving ? "Saving..." : "Create Company"}
                </button>
                <button type="button" className="btn btn-ghost full" onClick={closeForm}>Cancel</button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default AdminCompaniesPage;
