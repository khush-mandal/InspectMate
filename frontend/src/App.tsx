import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { ScreenNavigator } from './components/common/ScreenNavigator';

// 19 Screens
import { LoginScreen } from './components/screens/LoginScreen';
import { InspectorDashboard } from './components/screens/InspectorDashboard';
import { NewInspectionForm } from './components/screens/NewInspectionForm';
import { IdentifyProductScreen } from './components/screens/IdentifyProductScreen';
import { CaptureEvidenceScreen } from './components/screens/CaptureEvidenceScreen';
import { ImageQualityCheckScreen } from './components/screens/ImageQualityCheckScreen';
import { VideoFallbackScreen } from './components/screens/VideoFallbackScreen';
import { OcrExtractionResultsScreen } from './components/screens/OcrExtractionResultsScreen';
import { OcrVerificationScreen } from './components/screens/OcrVerificationScreen';
import { BarcodeDataLookupScreen } from './components/screens/BarcodeDataLookupScreen';
import { CrossSourceVerificationScreen } from './components/screens/CrossSourceVerificationScreen';
import { ComplianceChecklistScreen } from './components/screens/ComplianceChecklistScreen';
import { EvidenceFindingCardScreen } from './components/screens/EvidenceFindingCardScreen';
import { ResultClassificationBadgesScreen } from './components/screens/ResultClassificationBadgesScreen';
import { InspectorReviewScreen } from './components/screens/InspectorReviewScreen';
import { NoticeGenerationScreen } from './components/screens/NoticeGenerationScreen';
import { InspectionHistoryScreen } from './components/screens/InspectionHistoryScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { EdgeCaseSandboxScreen } from './components/screens/EdgeCaseSandboxScreen';

import { SAMPLE_PRODUCTS } from './data/mockData';
import { ProductSample, InspectionRecord, UserRole, ProductIdentificationMode } from './types';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { EvidenceCaptureProvider } from './context/EvidenceCaptureContext';

function AppContent() {
  const { user, role, isLoading, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductSample>(SAMPLE_PRODUCTS[0]);
  const [inspectionId, setInspectionId] = useState<string>('PRM-2026-0842');
  const [inputMode, setInputMode] = useState<ProductIdentificationMode>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Auto-navigate if logged in and on login screen
  React.useEffect(() => {
    if (user && currentScreen === 1) {
      if (role === 'regulator') setCurrentScreen(18);
      else setCurrentScreen(2);
    } else if (!user && !isLoading) {
      setCurrentScreen(1);
    }
  }, [user, role, currentScreen, isLoading]);

  // Navigation handler
  const handleNavigate = (screenNum: number) => {
    if (screenNum >= 1 && screenNum <= 19) {
      setCurrentScreen(screenNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen(1);
  };

  const handleRoleChange = (newRole: UserRole) => {
    // Only used for UI mocking if needed, but actual role comes from AuthContext
    // Ideally we shouldn't allow changing role client-side anymore unless it's just a demo toggle.
    // For now we'll keep the prop but it doesn't do anything because role is from JWT.
  };

  const handleSelectRecord = (record: InspectionRecord) => {
    // Find matching product sample or adapt
    const match = SAMPLE_PRODUCTS.find(p => p.gtin === record.gtin) || SAMPLE_PRODUCTS[0];
    setSelectedProduct(match);
    setInspectionId(record.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 flex flex-col relative selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden">
      {/* Floating ambient glass blobs for light glassmorphism depth */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[30%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-teal-200/40 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-violet-200/35 blur-[140px]" />
      </div>

      {/* Screen Navigator Toolbar across the top for quick review */}
      <div className="no-print">
        <ScreenNavigator
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
        />
      </div>

      {/* Persistent App Header */}
      {user && (
        <div className="no-print">
          <Header
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            isOnline={isOnline}
            role={role as UserRole}
            onRoleChange={handleRoleChange}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* Main Body Container with Responsive Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6 relative z-10 pb-20 md:pb-6">
        {/* Desktop Sidebar (visible when logged in and not on full login view) */}
        {user && currentScreen !== 1 && (
          <aside className="hidden md:block w-64 shrink-0 no-print">
            <Sidebar currentScreen={currentScreen} onNavigate={handleNavigate} />
          </aside>
        )}

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 min-w-0">
          {/* Screen 1: Login */}
          {currentScreen === 1 && (
            <LoginScreen onLoginSuccess={() => {}} />
          )}

          {currentScreen !== 1 && (
            <ProtectedRoute>
              {/* Screen 2: Inspector Dashboard */}
              {currentScreen === 2 && (
                <InspectorDashboard
                  onStartNewInspection={(id) => {
                    setInspectionId(id);
                    handleNavigate(3);
                  }}
                  onSelectInspection={handleSelectRecord}
                  onNavigate={handleNavigate}
                />
              )}

          {/* Screen 3: New Inspection Form */}
          {currentScreen === 3 && (
            <NewInspectionForm
              inspectionId={inspectionId}
              onProceed={() => handleNavigate(4)}
              selectedProduct={selectedProduct}
              onSelectSampleProduct={(prod) => setSelectedProduct(prod)}
            />
          )}

          {/* Screen 4: Identify Product (Barcode, QR, Image, Video) */}
          {currentScreen === 4 && (
            <IdentifyProductScreen
              product={selectedProduct}
              inspectionId={inspectionId}
              onSelectMethod={(method) => setInputMode(method)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 5: Capture Evidence */}
          {currentScreen === 5 && (
            <CaptureEvidenceScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(6)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 6: Image Quality Check */}
          {currentScreen === 6 && (
            <ImageQualityCheckScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(8)}
              onRetake={() => handleNavigate(5)}
              onVideoFallback={() => handleNavigate(7)}
            />
          )}

          {/* Screen 7: Video Fallback */}
          {currentScreen === 7 && (
            <VideoFallbackScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(8)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 8: OCR/CV Extraction Results */}
          {currentScreen === 8 && (
            <OcrExtractionResultsScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(9)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 9: OCR Verification */}
          {currentScreen === 9 && (
            <OcrVerificationScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(10)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 10: Barcode Data Lookup */}
          {currentScreen === 10 && (
            <BarcodeDataLookupScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(11)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 11: Cross-Source Verification */}
          {currentScreen === 11 && (
            <CrossSourceVerificationScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(12)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 12: Statutory Compliance Checklist */}
          {currentScreen === 12 && (
            <ComplianceChecklistScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(13)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 13: Evidence-Backed Finding Card */}
          {currentScreen === 13 && (
            <EvidenceFindingCardScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(14)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 14: Result Classification Badges Reference */}
          {currentScreen === 14 && (
            <ResultClassificationBadgesScreen
              onProceed={() => handleNavigate(15)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 15: Inspector Review Adjudication */}
          {currentScreen === 15 && (
            <InspectorReviewScreen
              product={selectedProduct}
              onProceed={() => handleNavigate(16)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 16: Regulatory Notice Generation */}
          {currentScreen === 16 && (
            <NoticeGenerationScreen
              product={selectedProduct}
              inspectionId={inspectionId}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 17: Inspection History */}
          {currentScreen === 17 && (
            <InspectionHistoryScreen
              onSelectInspection={handleSelectRecord}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screen 18: Regulatory Analytics */}
          {currentScreen === 18 && (
            <AnalyticsScreen onNavigate={handleNavigate} />
          )}

          {/* Screen 19: Edge-Case & Failure Sandbox */}
          {currentScreen === 19 && (
            <EdgeCaseSandboxScreen onNavigate={handleNavigate} />
          )}
          </ProtectedRoute>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && currentScreen !== 1 && (
        <div className="no-print">
          <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EvidenceCaptureProvider>
        <AppContent />
      </EvidenceCaptureProvider>
    </AuthProvider>
  );
}
