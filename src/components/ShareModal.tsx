import { useState } from 'react';
import { generateShareLink, disableSharing } from '../lib/projectManager';
import { showToast } from './ToastContainer';
import './ShareModal.css';

interface ShareModalProps {
  projectId: string;
  projectName: string;
  initialShareToken?: string | null;
  onClose: () => void;
}

function ShareModal({ projectId, projectName, initialShareToken, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState(
    initialShareToken ? `${window.location.origin}/shared/${initialShareToken}` : ''
  );
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(!!initialShareToken);

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const url = await generateShareLink(projectId);
      setShareUrl(url);
      setIsPublic(true);
      showToast('Share link generated successfully', 'success');
    } catch (error) {
      showToast('Failed to generate share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSharing = async () => {
    try {
      setLoading(true);
      await disableSharing(projectId);
      setShareUrl('');
      setIsPublic(false);
      showToast('Sharing disabled', 'success');
    } catch (error) {
      showToast('Failed to disable sharing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleShareSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`Check out my stone replacement design: ${projectName}`);

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'pinterest':
        url = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(projectName)}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <div className="share-header">
          <h2>Share Your Design</h2>
          <p>{projectName}</p>
        </div>

        <div className="share-content">
          {!isPublic ? (
            <div className="share-generate">
              <p>Generate a public link to share your design with others</p>
              <button
                className="btn btn-primary"
                onClick={handleGenerateLink}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </button>
            </div>
          ) : (
            <>
              <div className="share-link-section">
                <label>Share Link</label>
                <div className="share-link-input">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button className="btn btn-secondary" onClick={handleCopyLink}>
                    Copy
                  </button>
                </div>
                <button
                  className="btn-text-danger"
                  onClick={handleDisableSharing}
                  disabled={loading}
                >
                  Disable Sharing
                </button>
              </div>

              <div className="share-social-section">
                <label>Share on Social Media</label>
                <div className="social-buttons">
                  <button
                    className="social-btn twitter"
                    onClick={() => handleShareSocial('twitter')}
                    title="Share on Twitter"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                    </svg>
                    Twitter
                  </button>

                  <button
                    className="social-btn facebook"
                    onClick={() => handleShareSocial('facebook')}
                    title="Share on Facebook"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                    Facebook
                  </button>

                  <button
                    className="social-btn linkedin"
                    onClick={() => handleShareSocial('linkedin')}
                    title="Share on LinkedIn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    LinkedIn
                  </button>

                  <button
                    className="social-btn pinterest"
                    onClick={() => handleShareSocial('pinterest')}
                    title="Share on Pinterest"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.63 7.85 6.35 9.35-.09-.79-.17-2 .03-2.86.19-.78 1.23-5.22 1.23-5.22s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.47 0 .9-.57 2.24-.87 3.48-.25 1.04.52 1.89 1.55 1.89 1.86 0 3.29-1.96 3.29-4.79 0-2.5-1.8-4.25-4.37-4.25-2.98 0-4.73 2.23-4.73 4.54 0 .9.35 1.86.78 2.38.09.1.1.19.07.3l-.28 1.17c-.04.18-.15.21-.35.13-1.31-.61-2.13-2.52-2.13-4.06 0-3.3 2.4-6.33 6.92-6.33 3.63 0 6.46 2.59 6.46 6.04 0 3.6-2.27 6.5-5.42 6.5-1.06 0-2.05-.55-2.39-1.2l-.65 2.47c-.24.91-.89 2.06-1.33 2.76.99.31 2.05.47 3.16.47 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                    </svg>
                    Pinterest
                  </button>

                  <button
                    className="social-btn email"
                    onClick={() => handleShareSocial('email')}
                    title="Share via Email"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" stroke="white" strokeWidth="2" fill="none" />
                    </svg>
                    Email
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
