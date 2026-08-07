import React, { useState } from 'react';
import { Header } from './components/Header';
import { ShowcaseView } from './components/showcase/ShowcaseView';
import { OproxCodeIDE } from './components/ide/OproxCodeIDE';
import { AiOperatingSystem } from './components/ai/AiOperatingSystem';
import { OproxCodeAiSuite } from './components/ai/OproxCodeAiSuite';
import { StudioAppSuite } from './components/studio/StudioAppSuite';
import { DatabaseStudio } from './components/database/DatabaseStudio';
import { CloudMonitors } from './components/cloud/CloudMonitors';
import { EnterpriseOS } from './components/memory/EnterpriseOS';
import { MediaStudio } from './components/verticals/MediaStudio';
import { PropTechStudio } from './components/verticals/PropTechStudio';
import { OproxRealEstateWorkspace } from './components/realestate/OproxRealEstateWorkspace';
import { OproxAcademyWorkspace } from './components/academy/OproxAcademyWorkspace';
import { SolutionsPlatform } from './components/solutions/SolutionsPlatform';
import { PlatformHub } from './components/platform/PlatformHub';
import { DesignSystemView } from './components/design/DesignSystemView';
import { DashboardView } from './components/dashboard/DashboardView';
import { useUIState } from './integration/UIStateContext';
import { NotificationToastContainer } from './integration/NotificationToast';

// Shared Modals & Error Boundary
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { NotificationCenterModal } from './components/common/NotificationCenterModal';
import { ProjectManagementModal } from './components/common/ProjectManagementModal';
import { UserSettingsModal } from './components/common/UserSettingsModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const {
    currentMode,
    setCurrentMode,
    serverOnline,
    activeProjectTitle,
    setActiveProjectTitle,
    activePrompt,
    launchIdeWithPrompt,
    theme,
    toggleTheme,
    notifications,
    dismissNotification
  } = useUIState();

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

  const handleLaunchIdeWithPrompt = (prompt: string, projectTitle: string) => {
    launchIdeWithPrompt(prompt, projectTitle);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        serverOnline={serverOnline}
        activeProjectTitle={activeProjectTitle}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenUserSettings={() => setIsUserSettingsOpen(true)}
        unreadNotificationsCount={notifications.length}
      />

      <main className="max-w-[1700px] mx-auto px-4 pt-4">
        <ErrorBoundary>
          {currentMode === 'dashboard' && (
            <DashboardView
              onNavigateMode={setCurrentMode}
              onLaunchIdeWithPrompt={handleLaunchIdeWithPrompt}
              theme={theme}
            />
          )}

          {currentMode === 'ai-os' && (
            <AiOperatingSystem
              initialPrompt={activePrompt}
              onLaunchIdeWithPrompt={handleLaunchIdeWithPrompt}
              theme={theme}
            />
          )}

          {currentMode === 'oprox-code-ai' && (
            <OproxCodeAiSuite
              theme={theme}
              activeProjectTitle={activeProjectTitle}
            />
          )}

          {currentMode === 'studio' && (
            <StudioAppSuite />
          )}

          {currentMode === 'solutions' && (
            <SolutionsPlatform theme={theme} />
          )}

          {currentMode === 'platform-suite' && (
            <PlatformHub theme={theme} />
          )}

          {currentMode === 'design-system' && (
            <DesignSystemView theme={theme} onToggleTheme={toggleTheme} />
          )}

          {currentMode === 'ide' && (
            <OproxCodeIDE
              initialPrompt={activePrompt}
              onProjectChange={setActiveProjectTitle}
            />
          )}

          {currentMode === 'showcase' && (
            <ShowcaseView
              onLaunchIdeWithPrompt={handleLaunchIdeWithPrompt}
              onNavigateMode={setCurrentMode}
              theme={theme}
            />
          )}

          {currentMode === 'database' && <DatabaseStudio />}

          {currentMode === 'cloud' && <CloudMonitors />}

          {currentMode === 'enterprise' && <EnterpriseOS />}

          {currentMode === 'media' && <MediaStudio />}

          {(currentMode === 'real-estate' || currentMode === 'proptech') && <OproxRealEstateWorkspace />}

          {currentMode === 'academy' && <OproxAcademyWorkspace />}
        </ErrorBoundary>
      </main>

      {/* Global Modals */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateMode={setCurrentMode}
        onToggleTheme={toggleTheme}
        onOpenNewProject={() => {
          setIsCommandPaletteOpen(false);
          setIsProjectManagerOpen(true);
        }}
        theme={theme}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onDismiss={dismissNotification}
        theme={theme}
      />

      <ProjectManagementModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        activeProjectTitle={activeProjectTitle}
        onSelectProject={setActiveProjectTitle}
        theme={theme}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Global Notification Toast Renderer */}
      <NotificationToastContainer />
    </div>
  );
}
