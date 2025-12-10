import { useState } from 'react';
import { type StoneMaterial } from './lib/supabase';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import AreaSelector from './components/AreaSelector';
import StoneCatalog from './components/StoneCatalog';
import PreviewPanel from './components/PreviewPanel';
import AdminPanel from './components/AdminPanel';
import './App.css';

type Step = 'upload' | 'select' | 'choose-stone' | 'preview';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [selectedStone, setSelectedStone] = useState<StoneMaterial | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    setCurrentStep('select');
  };

  const handleAreaSelected = (mask: string) => {
    setMaskData(mask);
    setCurrentStep('choose-stone');
  };

  const handleStoneSelected = async (stone: StoneMaterial) => {
    setSelectedStone(stone);
    setCurrentStep('preview');
    setIsProcessing(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-stone-replacement`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: uploadedImage,
          mask_data: maskData,
          stone_material: stone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const result = await response.json();
      setPreviewImage(result.result_image_url);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setMaskData(null);
    setSelectedStone(null);
    setPreviewImage(null);
    setIsProcessing(false);
  };

  return (
    <div className="app">
      <Header />

      <button
        className="admin-toggle"
        onClick={() => setShowAdmin(!showAdmin)}
        title={showAdmin ? 'Back to Main App' : 'Admin Panel'}
      >
        {showAdmin ? '← Back to App' : '⚙ Admin'}
      </button>

      {showAdmin ? (
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

          {currentStep === 'select' && uploadedImage && (
            <AreaSelector
              imageUrl={uploadedImage}
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
