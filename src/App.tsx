import { useState, useEffect } from 'react';
import { type StoneMaterial } from './lib/supabase';
import { supabase } from './lib/supabase';
import * as api from './lib/api';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import AreaSelector from './components/AreaSelector';
import StoneCatalog from './components/StoneCatalog';
import PreviewPanel from './components/PreviewPanel';
import AdminPanel from './components/AdminPanel';
import AdminAuth from './components/AdminAuth';
import './App.css';

type Step = 'upload' | 'select' | 'choose-stone' | 'preview';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [maskId, setMaskId] = useState<string | null>(null);
  const [selectedStone, setSelectedStone] = useState<StoneMaterial | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = async (imageUrl: string, file: File) => {
    setUploadedImage(imageUrl);

    try {
      const response = await api.uploadImage(file);
      setImageId(response.image_id);
      setCurrentStep('select');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleAreaSelected = async (mask: string, maskBlob: Blob) => {
    setMaskData(mask);

    try {
      const response = await api.uploadMask(maskBlob);
      setMaskId(response.image_id);
      setCurrentStep('choose-stone');
    } catch (error) {
      console.error('Error uploading mask:', error);
      alert('Failed to upload mask. Please try again.');
    }
  };

  const handleStoneSelected = async (stone: StoneMaterial, selectedScale: number, selectedOrientation: number) => {
    if (!imageId || !maskId) {
      alert('Missing image or mask data');
      return;
    }

    setSelectedStone(stone);
    setCurrentStep('preview');
    setIsProcessing(true);

    try {
      const { task_id } = await api.generateStoneReplacement(
        imageId,
        maskId,
        stone,
        selectedScale,
        selectedOrientation
      );

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getTaskStatus(task_id);

          if (status.status === 'completed' && status.result_url) {
            setPreviewImage(api.getImageUrl(status.result_url));
            setIsProcessing(false);
            clearInterval(pollInterval);
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Processing failed');
          }
        } catch (error) {
          console.error('Error checking task status:', error);
          setIsProcessing(false);
          clearInterval(pollInterval);
          alert('Failed to process image. Please try again.');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setIsProcessing(false);
          alert('Processing timeout. Please try again.');
        }
      }, 300000);

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to start processing. Please try again.');
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

  useEffect(() => {
    checkAuthentication();

    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        await handleAdminAccess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="app">
      <Header />

      {showAuthModal && (
        <AdminAuth onSuccess={handleAuthSuccess} onCancel={handleAuthCancel} />
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
            />
          )}
        </div>
      </main>
      )}
    </div>
  );
}

export default App;
