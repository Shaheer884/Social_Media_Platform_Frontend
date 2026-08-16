import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Spinner from '../Loader/Spinner';
import postService from '../../services/postService';
import { getUploadUrl } from '../../utils/mediaHelper';
import MentionSuggestions from '../MentionSuggestions/MentionSuggestions';
import LocationSelector from '../Location/LocationSelector';
import { uploadDirectToCloudinary, validateFile, cleanupCloudinaryAsset } from '../../utils/cloudinaryUploader';

const EditPostModal = ({ isOpen, onClose, post, onUpdateSuccess }) => {
  const [postText, setPostText] = useState('');
  const [location, setLocation] = useState(null);
  const [existingMedia, setExistingMedia] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (post) {
      setPostText(post.content || '');
      setLocation(post.location || null);
      // Handle legacy or structure format
      if (post.media && post.media.length > 0) {
        setExistingMedia([...post.media]);
      } else if (post.mediaUrl || post.imageUrl) {
        setExistingMedia([
          {
            url: post.mediaUrl || post.imageUrl,
            publicId: post.cloudinaryPublicId || 'legacy_id',
            resourceType: post.mediaType || 'image'
          }
        ]);
      } else {
        setExistingMedia([]);
      }
      setNewFiles([]);
      setNewPreviews([]);
      setErrorMsg('');
    }
  }, [post, isOpen]);

  // Clean up blob URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      newPreviews.forEach((p) => {
        if (p.url && p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [newPreviews]);

  if (!isOpen || !post) return null;

  const handleRemoveExisting = (publicId) => {
    setExistingMedia((prev) => prev.filter((m) => m.publicId !== publicId));
  };

  const handleFileChange = async (e) => {
    setErrorMsg('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (existingMedia.length + newFiles.length + files.length > 10) {
      setErrorMsg('You can upload a maximum of 10 media files.');
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      const val = await validateFile(file, 'post');
      if (!val.valid) {
        setErrorMsg(val.error);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      validFiles.push(file);
      validPreviews.push({
        name: file.name,
        type: isVideo ? 'video' : 'image',
        url: URL.createObjectURL(file)
      });
    }

    setNewFiles((prev) => [...prev, ...validFiles]);
    setNewPreviews((prev) => [...prev, ...validPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNew = (index) => {
    const previewToRemove = newPreviews[index];
    if (previewToRemove && previewToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove.url);
    }
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() && existingMedia.length === 0 && newFiles.length === 0) {
      setErrorMsg('Post must contain text content or media.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const newUploadedList = [];

    try {
      // 1. Upload new files directly to Cloudinary
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const isVideo = file.type.startsWith('video/');
          const resourceType = isVideo ? 'video' : 'image';
          const folder = isVideo ? 'connecthub/posts/videos' : 'connecthub/posts/images';

          const uploadResult = await uploadDirectToCloudinary({
            file,
            folder,
            resourceType
          });

          newUploadedList.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type || resourceType,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            duration: uploadResult.duration || 0,
            size: uploadResult.bytes
          });
        }
      }

      // 2. Submit changes to backend
      const res = await postService.updatePost(post._id, {
        content: postText.trim(),
        existingMedia,
        newMedia: newUploadedList,
        location: location || undefined
      });

      if (res.success) {
        if (onUpdateSuccess) {
          onUpdateSuccess(res.data);
        }
        onClose();
      } else {
        throw new Error(res.error || 'Failed to update post.');
      }
    } catch (err) {
      console.error(err);
      
      // Automatic cleanup of completed uploads if save fails
      if (newUploadedList.length > 0) {
        for (const m of newUploadedList) {
          if (m.publicId) {
            await cleanupCloudinaryAsset(m.publicId, m.resourceType).catch(() => {});
          }
        }
      }

      setErrorMsg(err.message || 'Error updating post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Post">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '320px', maxWidth: '500px', width: '100%', padding: '8px 20px 20px 20px' }}>
        {errorMsg && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', backgroundColor: 'var(--accent-light)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Post Content</label>
          <textarea
            ref={textareaRef}
            className="creator-textarea"
            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', resize: 'vertical' }}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            maxLength={280}
            placeholder="Edit your post..."
          />
          <MentionSuggestions text={postText} setText={setPostText} targetInputRef={textareaRef} />
          <LocationSelector location={location} setLocation={setLocation} />
          <div style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {postText.length}/280
          </div>
        </div>

        {/* Media Manager Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Media Manager</label>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
            {/* Existing Media previews */}
            {existingMedia.map((m) => (
              <div key={m.publicId} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(m.publicId)}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', zIndex: 2 }}
                >
                  &times;
                </button>
                {m.resourceType === 'video' ? (
                  <video
                    src={getUploadUrl(m.url)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={getUploadUrl(m.url)}
                    alt="existing preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            ))}

            {/* New Media Previews */}
            {newPreviews.map((p, idx) => (
              <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--purple)' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveNew(idx)}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', zIndex: 2 }}
                >
                  &times;
                </button>
                {p.type === 'video' ? (
                  <video
                    src={p.url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={p.url}
                    alt="new preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            ))}

            {/* Select Media trigger button */}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', border: '2px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'pointer', gap: '4px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span style={{ fontSize: '0.65rem' }}>Add Media</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            className="btn"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {saving ? (
              <>
                <Spinner size="14px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPostModal;
