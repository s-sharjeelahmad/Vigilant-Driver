import { useEffect, useState } from "react";
import { User, Mail, CreditCard, Calendar, CheckCircle2, Shield, Edit2, Key } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { adminApi } from "../lib/apiClient";
import { formatDateTimeUS } from "../lib/dateFormatter";

function AdminProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const adminName = profile?.full_name || profile?.username || "System Admin";
  const adminInitials = adminName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.getProfile();
        setProfile(data || {});
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEditStart = () => {
    setEditForm({
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      email: profile?.email || "",
      cnic: profile?.cnic || "",
      password: "",
      confirm_password: ""
    });
    setIsEditing(true);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditError("");
    setEditSuccess("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateEditForm = () => {
    if (editForm.cnic && (editForm.cnic.length !== 13 || !/^\d{13}$/.test(editForm.cnic))) {
      setEditError("CNIC must be exactly 13 digits");
      return false;
    }
    if (editForm.email && !editForm.email.includes("@")) {
      setEditError("Please enter a valid email address");
      return false;
    }
    if (editForm.password) {
      if (editForm.password.length < 8) {
        setEditError("Password must be at least 8 characters");
        return false;
      }
      if (editForm.password !== editForm.confirm_password) {
        setEditError("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setSavingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const updatePayload = {
        ...(editForm.full_name && editForm.full_name !== profile.full_name ? { full_name: editForm.full_name } : {}),
        ...(editForm.username && editForm.username !== profile.username ? { username: editForm.username } : {}),
        ...(editForm.email && editForm.email !== profile.email ? { email: editForm.email } : {}),
        ...(editForm.cnic && editForm.cnic !== profile.cnic ? { cnic: editForm.cnic } : {}),
        ...(editForm.password ? { password: editForm.password } : {})
      };

      if (Object.keys(updatePayload).length === 0) {
        setEditError("No changes to save");
        setSavingEdit(false);
        return;
      }

      const updatedProfile = await adminApi.updateProfile(updatePayload);
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditForm({});
      setEditSuccess("Profile updated successfully");
    } catch (err) {
      setEditError(err.message || "Unable to update profile.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', animation: 'pulse 2s infinite', opacity: 0.5 }}>
        <div style={{ height: '40px', width: '200px', background: 'var(--color-surface-elevated)', borderRadius: '8px', marginBottom: '2rem' }}></div>
        <div className="card" style={{ height: '400px', background: 'var(--color-surface)' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Administrator Identity</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Manage your super-admin credentials and personal details.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleEditStart}
            style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Edit2 size={16} /> Edit Details
          </button>
        )}
      </div>

      <ErrorBanner message={error} />
      {editSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(36, 161, 72, 0.1)', borderLeft: '4px solid var(--color-success)', borderRadius: '4px', color: 'var(--color-status-safe)', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{editSuccess}</span>
        </div>
      )}

      {profile && !isEditing && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: '120px', background: 'linear-gradient(to right, #475569, #1e293b)' }}></div>
          <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-40px', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--color-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#475569', border: '4px solid var(--color-bg)', boxShadow: 'var(--shadow-low)' }}>
                {adminInitials}
              </div>
              <div>
                <StatusPill status="Super Admin" />
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h2 className="ds-display-small" style={{ margin: '0 0 0.5rem 0' }}>{adminName}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> {profile.email || "No email"}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={16} /> CNIC: {profile.cnic || "No CNIC"}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-divider)', margin: '0 0 2rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 className="ds-heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={18} /> Profile Information</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Username</div>
                      <div className="ds-body" style={{ fontFamily: 'monospace' }}>@{profile.username}</div>
                    </div>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Admin ID</div>
                      <div className="ds-body" style={{ fontFamily: 'monospace' }}>{profile.admin_id}</div>
                    </div>
                  </div>
                  <div>
                    <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Full Legal Name</div>
                    <div className="ds-body">{profile.full_name || "-"}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 className="ds-heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18} /> System Timestamps</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Last Active</div>
                    <div className="ds-body">{formatDateTimeUS(profile.last_active)}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Account Created</div>
                      <div className="ds-body-small">{formatDateTimeUS(profile.created_at)}</div>
                    </div>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Last Updated</div>
                      <div className="ds-body-small">{formatDateTimeUS(profile.updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="ds-heading-2" style={{ margin: '0 0 1.5rem 0' }}>Edit Identity</h2>
          
          <ErrorBanner message={editError} />

          <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <h3 className="ds-heading-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Full Name
                  <input type="text" name="full_name" value={editForm.full_name} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Username
                  <input type="text" name="username" value={editForm.username} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
              </div>
            </div>

            <div>
              <h3 className="ds-heading-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Contact & Identity</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Email Address
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  CNIC (13 digits)
                  <input type="text" name="cnic" value={editForm.cnic} onChange={handleEditChange} maxLength="13" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
              </div>
            </div>

            <div>
              <h3 className="ds-heading-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={18} /> Authentication</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  New Password
                  <input type="password" name="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep current" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Confirm Password
                  <input type="password" name="confirm_password" value={editForm.confirm_password} onChange={handleEditChange} placeholder="Confirm new password" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button type="submit" disabled={savingEdit} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={handleEditCancel} disabled={savingEdit} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminProfilePage;
