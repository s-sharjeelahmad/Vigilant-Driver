import { useEffect, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import AdminSubnav from "../components/AdminSubnav";
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

  const adminName = profile?.full_name || profile?.username || "Admin";
  const adminInitials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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

  return (
    <section className="section">
      <div className="container container-wide admin-page-wrap">
        <SectionHeader
          eyebrow="Admin Identity"
          title="My Admin Profile"
          text={isEditing ? "Edit your profile information" : "Manage your admin account details."}
        />

        <AdminSubnav />

        <article className="card">
          {loading ? <p className="state loading">Loading admin profile...</p> : null}
          {error ? <p className="state error">{error}</p> : null}

          {!loading && !error ? (
            <>
              {!isEditing && (
                <div className="profile-view">
                  <div className="profile-overview">
                    <div className="profile-overview-left">
                      <div className="profile-avatar">{adminInitials}</div>
                      <div className="profile-meta">
                        <h3>{adminName}</h3>
                        <p>{profile?.email || "-"}</p>
                        <div className="profile-tags">
                          <span className="profile-tag">Admin</span>
                          <span className="profile-tag">Active</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary edit-profile-button" onClick={handleEditStart}>
                      Edit Profile
                    </button>
                  </div>
                  <dl className="profile-grid">
                    <div>
                      <dt>Admin ID</dt>
                      <dd>{profile?.admin_id || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>Username</dt>
                      <dd>{profile?.username || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>Full Name</dt>
                      <dd>{profile?.full_name || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{profile?.email || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>CNIC</dt>
                      <dd>{profile?.cnic || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>Created At</dt>
                      <dd>{formatDateTimeUS(profile?.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Updated At</dt>
                      <dd>{formatDateTimeUS(profile?.updated_at)}</dd>
                    </div>
                    <div>
                      <dt>Last Active</dt>
                      <dd>{formatDateTimeUS(profile?.last_active)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {isEditing && (
                <form className="profile-form" onSubmit={handleEditSave}>
                  <label>
                    Full Name
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleEditChange}
                      placeholder="Enter your full name"
                    />
                  </label>
                  <label>
                    Username
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleEditChange}
                      placeholder="Enter your username"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="Enter your email"
                    />
                  </label>
                  <label>
                    CNIC (13 digits)
                    <input
                      type="text"
                      name="cnic"
                      value={editForm.cnic}
                      onChange={handleEditChange}
                      placeholder="13-digit CNIC number"
                      maxLength="13"
                    />
                  </label>
                  <label>
                    New Password
                    <input
                      type="password"
                      name="password"
                      value={editForm.password}
                      onChange={handleEditChange}
                      placeholder="Minimum 8 characters"
                    />
                  </label>
                  <label>
                    Confirm Password
                    <input
                      type="password"
                      name="confirm_password"
                      value={editForm.confirm_password}
                      onChange={handleEditChange}
                      placeholder="Re-enter new password"
                    />
                  </label>

                  {editError ? <p className="state error">{editError}</p> : null}
                  {editSuccess ? <p className="state success">{editSuccess}</p> : null}

                  <div className="profile-form-actions">
                    <button type="button" className="btn btn-ghost" onClick={handleEditCancel} disabled={savingEdit}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default AdminProfilePage;
