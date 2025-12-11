import { useState, useEffect } from 'react';
import { type StoneMaterial } from './lib/supabase';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import * as api from './lib/api';
import * as sessionManager from './lib/sessionManager';
import { showToast } from './components/ToastContainer';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import AreaSelector from './components/AreaSelector';
import StoneCatalog from './components/StoneCatalog';
import PreviewPanel from './components/PreviewPanel';
import AdminPanel from './components/AdminPanel';
import AdminAuth from './components/AdminAuth';
import UserAuth from './components/UserAuth';
import ProjectGallery from './components/ProjectGallery';
import './App.css';

type Step = 'upload' | 'select' | 'choose-stone' | 'preview';

function App() {
  const { user, signOut } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [maskId, setMaskId] = useState<string | null>(null);
  const [selectedStone, setSelectedStone] = useState<StoneMaterial | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSession();
    checkAuthentication();

    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        await handleAdminAccess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (currentStep !== 'upload' || uploadedImage) {
      saveSession();
    }
  }, [currentStep, uploadedImage, imageId, maskData, maskId, selectedStone, previewImage]);

  const loadSession = () => {
    if (sessionManager.hasStoredSession()) {
      const session = sessionManager.loadSessionLocal();
      setCurrentStep(session.currentStep);
      setUploadedImage(session.uploadedImage);
      setImageId(session.imageId);
      setMaskData(session.maskData);
      setMaskId(session.maskId);
      setSelectedStone(session.selectedStone);
      setPreviewImage(session.previewImage);
    }
  };

  const saveSession = () => {
    sessionManager.syncSession({
      currentStep,
      uploadedImage,
      imageId,
      maskData,
      maskId,
      selectedStone,
      previewImage,
    });
  };

  const handleBeforeUnload = () => {
    saveSession();
  };

  const handleImageUpload = async (imageUrl: string, file: File) => {
    setUploadedImage(imageUrl);

    try {
      const response = await api.uploadImage(file);
      setImageId(response.image_id);
      setCurrentStep('select');
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      showToast(errorMessage, 'error');
      setUploadedImage(null);
    }
  };

  const handleAreaSelected = async (mask: string, maskBlob: Blob) => {
    setMaskData(mask);

    try {
      const response = await api.uploadMask(maskBlob);
      setMaskId(response.image_id);
      setCurrentStep('choose-stone');
      showToast('Area selected successfully', 'success');
    } catch (error) {
      console.error('Error uploading mask:', error);
      showToast('Failed to upload mask', 'error');
    }
  };

  const handleStoneSelected = async (stone: StoneMaterial) => {
    if (!imageId || !maskId) {
      showToast('Missing image or mask data', 'error');
      return;
    }

    setSelectedStone(stone);
    setCurrentStep('preview');
    setIsProcessing(true);

    try {
      const { task_id } = await api.generateStoneReplacement(
        imageId,
        maskId,
        stone
      );

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getTaskStatus(task_id);

          if (status.status === 'completed' && status.result_url) {
            setPreviewImage(api.getImageUrl(status.result_url));
            setIsProcessing(false);
            clearInterval(pollInterval);
            showToast('Preview generated successfully', 'success');
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Processing failed');
          }
        } catch (error) {
          console.error('Error checking task status:', error);
          setIsProcessing(false);
          clearInterval(pollInterval);
          showToast('Failed to process image', 'error');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setIsProcessing(false);
          showToast('Processing timeout', 'error');
        }
      }, 300000);
    } catch (error) {
      console.error('Error processing image:', error);
      showToast('Failed to start processing', 'error');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setImageId(null);
    setMaskData(null);
    setMaskId(null);
    setSelectedStone(null);
    setPreviewImage(null);
    setIsProcessing(false);
    sessionManager.clearSessionLocal();
  };

  const checkAuthentication = async () => {
    const session = sessionStorage.getItem('admin_session');
    const userId = sessionStorage.getItem('admin_user_id');

    if (!session || !userId) {
      return false;
    }

    const sessionTime = parseInt(session);
    const currentTime = Date.now();
    const sessionDuration = 3600000;

    if (currentTime - sessionTime >= sessionDuration) {
      sessionStorage.removeItem('admin_session');
      sessionStorage.removeItem('admin_user_id');
      await supabase.auth.signOut();
      return false;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (adminData) {
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const handleAdminAccess = async () => {
    const isAuth = await checkAuthentication();
    if (isAuth) {
      setShowAdmin(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    setShowAdmin(true);
  };

  const handleAuthCancel = () => {
    setShowAuthModal(false);
  };

  const handleAdminExit = async () => {
    setShowAdmin(false);
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_user_id');
    await supabase.auth.signOut();
  };

  const handleUserSignOut = async () => {
    await signOut();
    showToast('Signed out successfully', 'success');
  };

  return (
    <div className="app">
      <Header />

      {!showAdmin && (
        <div className="user-actions">
          {user ? (
            <>
              <button className="user-btn" onClick={() => setShowGallery(true)}>
                My Projects
              </button>
              <button className="user-btn" onClick={handleUserSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <button className="user-btn primary" onClick={() => setShowUserAuth(true)}>
              Sign In
            </button>
          )}
        </div>
      )}

      {showAuthModal && (
        <AdminAuth onSuccess={handleAuthSuccess} onCancel={handleAuthCancel} />
      )}

      {showUserAuth && (
        <UserAuth onClose={() => setShowUserAuth(false)} />
      )}

      {showGallery && user && (
        <ProjectGallery onClose={() => setShowGallery(false)} />
      )}

      {showAdmin && isAuthenticated && (
        <button
          className="admin-exit-btn"
          onClick={handleAdminExit}
          title="Exit Admin Panel"
        >
          ← Exit Admin
        </button>
      )}

      {showAdmin && isAuthenticated ? (
        <main className="container main-content">
          <AdminPanel />
        </main>
      ) : (
        <main className="container main-content">
          <div className="workflow-steps">
            <div className={`step ${currentStep === 'upload' ? 'active' : ''} ${uploadedImage ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Upload Photo</div>
            </div>
            <div className={`step ${currentStep === 'select' ? 'active' : ''} ${maskData ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Select Area</div>
            </div>
            <div className={`step ${currentStep === 'choose-stone' ? 'active' : ''} ${selectedStone ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Choose Stone</div>
            </div>
            <div className={`step ${currentStep === 'preview' ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Preview</div>
            </div>
          </div>

          <div className="workflow-content">
            {currentStep === 'upload' && (
              <ImageUpload onImageUpload={handleImageUpload} />
            )}

            {currentStep === 'select' && uploadedImage && imageId && (
              <AreaSelector
                imageUrl={uploadedImage}
                imageId={imageId}
                onAreaSelected={handleAreaSelected}
                onBack={() => setCurrentStep('upload')}
              />
            )}

            {currentStep === 'choose-stone' && (
              <StoneCatalog
                onStoneSelected={handleStoneSelected}
                onBack={() => setCurrentStep('select')}
              />
            )}

            {currentStep === 'preview' && (
              <PreviewPanel
                originalImage={uploadedImage}
                previewImage={previewImage}
                selectedStone={selectedStone}
                isProcessing={isProcessing}
                onReset={handleReset}
                imageId={imageId}
                maskId={maskId}
              />
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
