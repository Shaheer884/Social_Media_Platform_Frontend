import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';
import { uploadDirectToCloudinary, validateFile, cleanupCloudinaryAsset } from '../../../utils/cloudinaryUploader';

const AdminProfile = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Image states
  const [avatarPreview, setAvatarPreview] = useState('/uploads/default-avatar.png');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const savedAdmin = sessionStorage.getItem('adminUser');
    if (savedAdmin) {
      const admin = JSON.parse(savedAdmin);
      setFullName(admin.fullName || '');
      setUsername(admin.username || '');
      setEmail(admin.email || '');
      if (admin.profilePicture) {
        setAvatarPreview(getUploadUrl(admin.profilePicture));
      }
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    let uploadResult = null;

    try {
      // 1. Validate & upload avatar file directly to Cloudinary if provided
      if (avatarFile) {
        const val = await validateFile(avatarFile, 'post');
        if (!val.valid) {
          setError(val.error);
          setLoading(false);
          return;
        }

        uploadResult = await uploadDirectToCloudinary({
          file: avatarFile,
          folder: 'connecthub/profiles/avatars',
          resourceType: 'image'
        });
      }

      // 2. Submit credentials & image metadata to backend
      const payload = {
        fullName,
        username,
        email,
        password: password || undefined,
        profilePicture: uploadResult ? uploadResult.secure_url : undefined,
        profilePicturePublicId: uploadResult ? uploadResult.public_id : undefined,
        profilePictureSize: avatarFile ? uploadResult?.bytes : undefined,
        profilePictureFormat: avatarFile ? uploadResult?.format : undefined
      };

      const res = await adminService.updateProfile(payload);
      if (res.success) {
        setSuccess('Admin profile updated successfully!');
        sessionStorage.setItem('adminUser', JSON.stringify(res.data));
        setPassword('');
        setConfirmPassword('');
        setAvatarFile(null); // Clear selected file
        window.dispatchEvent(new Event('adminProfileUpdated'));
      }
    } catch (err) {
      // Cleanup completed upload on failure to prevent orphans
      if (uploadResult?.public_id) {
        await cleanupCloudinaryAsset(uploadResult.public_id, 'image').catch(() => {});
      }
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Profile Settings</h1>
          <p className="admin-page-desc">Update your login credentials, name, email, and avatar</p>
        </div>
      </div>

      <div className="admin-profile-card">
        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderLeft: '4px solid var(--admin-success)',
            color: 'var(--admin-success)',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid var(--admin-danger)',
            color: 'var(--admin-danger)',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar Edit Section */}
          <div className="admin-profile-avatar-row">
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--admin-primary)'
                }}
              />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Profile Picture</h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--admin-primary)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-block',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Upload Photo
              </label>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                Recommended: Square image, max 5MB.
              </p>
            </div>
          </div>

          {/* Text Fields */}
          <div className="admin-profile-fields-grid">
            <div className="admin-form-group">
              <label className="admin-form-label">Full Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Username</label>
              <input
                type="text"
                className="admin-form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Email Address</label>
              <input
                type="email"
                className="admin-form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">New Password (optional)</label>
              <input
                type="password"
                className="admin-form-input"
                placeholder="Leave blank to keep same"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Confirm New Password</label>
              <input
                type="password"
                className="admin-form-input"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--admin-success)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.9'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
