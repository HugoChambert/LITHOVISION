import { useState, useEffect } from 'react';
import { type StoneMaterial } from './lib/supabase';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import * as api from './lib/api';
import * as sessionManager from './lib/sessionManager';
import { showToast } from './components/ToastContainer';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import StoneCatalog from './components/StoneCatalog';
import PreviewPanel from './components/PreviewPanel';
import AdminPanel from './components/AdminPanel';
import AdminAuth from './components/AdminAuth';
import UserAuth from './components/UserAuth';
import ProjectGallery from './components/ProjectGallery';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import './App.css';

type Step = 'upload' | 'choose-stone' | 'preview';

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
  const [selectedStones, setSelectedStones] = useState<StoneMaterial[]>([]);
  const [previewImages, setPreviewImages] = useState<Array<{ stone: StoneMaterial; imageUrl: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<Array<{ stone: StoneMaterial; status: 'pending' | 'processing' | 'completed' | 'failed' }>>([]);

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
  }, [currentStep, uploadedImage, imageId, maskData, maskId, selectedStones, previewImages]);

  const loadSession = () => {
    if (sessionManager.hasStoredSession()) {
      const session = sessionManager.loadSessionLocal();
      const step = session.currentStep === 'select' ? 'choose-stone' : session.currentStep;
      setCurrentStep(step as Step);
      setUploadedImage(session.uploadedImage);
      setImageId(session.imageId);
      setMaskData(session.maskData);
      setMaskId(session.maskId);
      setSelectedStones(session.selectedStones || []);
      setPreviewImages(session.previewImages || []);
    }
  };

  const saveSession = () => {
    sessionManager.syncSession({
      currentStep,
      uploadedImage,
      imageId,
      maskData,
      maskId,
      selectedStones,
      previewImages,
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

      showToast('Generating surface mask...', 'info');
      const maskResponse = await api.generateAutoMask(response.image_id);
      setMaskId(maskResponse.mask_id);
      setMaskData(maskResponse.mask_url);

      setCurrentStep('choose-stone');
      showToast('Image uploaded and surface detected successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      showToast(errorMessage, 'error');
      setUploadedImage(null);
    }
  };

  const handleStonesSelected = async (stones: StoneMaterial[]) => {
    if (!imageId || !maskId) {
      showToast('Missing image or mask data', 'error');
      return;
    }

    setSelectedStones(stones);
    setCurrentStep('preview');
    setIsProcessing(true);
    setPreviewImages([]);
    setProcessingProgress(stones.map(stone => ({ stone, status: 'pending' })));

    try {
      const results: Array<{ stone: StoneMaterial; imageUrl: string }> = [];

      for (let i = 0; i < stones.length; i++) {
        const stone = stones[i];

        setProcessingProgress(prev =>
          prev.map(p => p.stone.id === stone.id ? { ...p, status: 'processing' } : p)
        );

        try {
          const { task_id } = await api.generateStoneReplacement(
            imageId,
            maskId,
            stone
          );

          let completed = false;
          const maxAttempts = 150;
          let attempts = 0;

          while (!completed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;

            try {
              const status = await api.getTaskStatus(task_id);

              if (status.status === 'completed' && status.result_url) {
                const imageUrl = api.getImageUrl(status.result_url);
                results.push({ stone, imageUrl });
                setPreviewImages([...results]);

                setProcessingProgress(prev =>
                  prev.map(p => p.stone.id === stone.id ? { ...p, status: 'completed' } : p)
                );

                completed = true;
              } else if (status.status === 'failed') {
                throw new Error(status.error || 'Processing failed');
              }
            } catch (error) {
              setProcessingProgress(prev =>
                prev.map(p => p.stone.id === stone.id ? { ...p, status: 'failed' } : p)
              );
              completed = true;
            }
          }

          if (attempts >= maxAttempts) {
            setProcessingProgress(prev =>
              prev.map(p => p.stone.id === stone.id ? { ...p, status: 'failed' } : p)
            );
          }
        } catch (error) {
          setProcessingProgress(prev =>
            prev.map(p => p.stone.id === stone.id ? { ...p, status: 'failed' } : p)
          );
        }
      }

      setIsProcessing(false);

      if (results.length > 0) {
        showToast(`Generated ${results.length} preview${results.length > 1 ? 's' : ''} successfully`, 'success');
      } else {
        showToast('Failed to generate any previews', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start processing';
      showToast(errorMessage, 'error');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setImageId(null);
    setMaskData(null);
    setMaskId(null);
    setSelectedStones([]);
    setPreviewImages([]);
    setIsProcessing(false);
    setProcessingProgress([]);
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
            <div className={`step ${currentStep === 'choose-stone' ? 'active' : ''} ${selectedStones.length > 0 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Choose Stone</div>
            </div>
            <div className={`step ${currentStep === 'preview' ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Preview</div>
            </div>
          </div>

          <div className="workflow-content">
            {currentStep === 'upload' && (
              <ImageUpload onImageUpload={handleImageUpload} />
            )}

            {currentStep === 'choose-stone' && (
              <StoneCatalog
                onStonesSelected={handleStonesSelected}
                onBack={() => setCurrentStep('upload')}
              />
            )}

            {currentStep === 'preview' && (
              <PreviewPanel
                originalImage={uploadedImage}
                previewImages={previewImages}
                selectedStones={selectedStones}
                isProcessing={isProcessing}
                processingProgress={processingProgress}
                onReset={handleReset}
                imageId={imageId}
                maskId={maskId}
              />
            )}
          </div>
        </main>
      )}

      {!showAdmin && <KeyboardShortcuts />}
    </div>
  );
}

export default App;
