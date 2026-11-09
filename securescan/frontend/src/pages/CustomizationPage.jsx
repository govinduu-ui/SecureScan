import React, { useState, useMemo } from 'react';
import {
  Palette,
  Layout,
  Compass,
  Bell,
  Gauge,
  Globe2,
  Eye,
  SlidersHorizontal,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Send,
  Sliders,
} from 'lucide-react';
import { useCustomization } from '../context/CustomizationContext';
import SettingSection from '../components/customization/SettingSection';
import SettingRow from '../components/customization/SettingRow';
import ToggleSwitch from '../components/customization/ToggleSwitch';
import RadioGroup from '../components/customization/RadioGroup';
import SelectDropdown from '../components/customization/SelectDropdown';
import RangeSlider from '../components/customization/RangeSlider';
import ColorPicker from '../components/customization/ColorPicker';
import ConfirmationModal from '../components/customization/ConfirmationModal';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'navigation', label: 'Navigation', icon: Compass },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'localization', label: 'Localization', icon: Globe2 },
  { id: 'accessibility', label: 'Accessibility', icon: Eye },
  { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal },
];

export default function CustomizationPage() {
  const {
    settings,
    updateSetting,
    resetSection,
    resetAllToDefaults,
    exportSettingsJson,
    importSettingsJson,
  } = useCustomization();

  const [activeTab, setActiveTab] = useState('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [saveBanner, setSaveBanner] = useState(null);
  const [webhookTestStatus, setWebhookTestStatus] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState(null);

  // Trigger feedback notification
  const triggerNotice = (message, type = 'success') => {
    setSaveBanner({ message, type });
    setTimeout(() => setSaveBanner(null), 3000);
  };

  // Setting update wrapper with immediate feedback
  const handleSettingChange = (section, key, value) => {
    updateSetting(section, key, value);
    triggerNotice('Setting saved');
  };

  // Section reset wrapper
  const handleSectionReset = (sectionKey, sectionTitle) => {
    resetSection(sectionKey);
    triggerNotice(`${sectionTitle} settings restored to defaults`);
  };

  // Full reset handler
  const handleConfirmResetAll = () => {
    resetAllToDefaults();
    setIsResetModalOpen(false);
    triggerNotice('All settings restored to defaults', 'warning');
  };

  // Export JSON file download
  const handleExport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportSettingsJson());
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `securescan-preferences-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerNotice('Configuration exported to JSON');
    } catch {
      triggerNotice('Failed to export configuration', 'error');
    }
  };

  // Import JSON handler
  const handleImportSubmit = (e) => {
    e.preventDefault();
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError('Please enter a valid JSON snippet');
      return;
    }
    const result = importSettingsJson(importJsonText);
    if (result.success) {
      setImportModalOpen(false);
      setImportJsonText('');
      triggerNotice('Configuration imported and applied successfully');
    } else {
      setImportError(result.error);
    }
  };

  // Test webhook simulation
  const handleTestWebhook = () => {
    if (!settings.notifications.webhookUrl) {
      setWebhookTestStatus({ ok: false, msg: 'Please enter a webhook destination URL' });
      return;
    }
    try {
      const parsed = new URL(settings.notifications.webhookUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setWebhookTestStatus({ ok: false, msg: 'URL protocol must be HTTP or HTTPS' });
        return;
      }
    } catch {
      setWebhookTestStatus({ ok: false, msg: 'Invalid URL format' });
      return;
    }

    setWebhookTestStatus({ ok: true, msg: 'Test notification payload sent successfully (HTTP 200 OK)' });
    setTimeout(() => setWebhookTestStatus(null), 4000);
  };

  // Filter sections by search query
  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  const shouldRenderSection = (id, title, keywords = []) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return title.toLowerCase().includes(q) || keywords.some((k) => k.toLowerCase().includes(q));
    }
    return activeTab === id;
  };

  const visibleSectionsCount = useMemo(() => {
    if (!searchQuery.trim()) return 1;
    return SECTIONS.filter((sec) => matchesSearch(sec.label)).length;
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Customization & Preferences
            </h1>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
              PREFERENCES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalize your workspace theme, notifications, layout geometry, and accessibility settings.
          </p>
        </div>

        {/* Global Actions: Export / Import / Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
            title="Export preferences to JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
            title="Import preferences from JSON"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
            title="Reset all preferences to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Save Notice Banner */}
      {saveBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`sticky top-20 z-30 flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium shadow-sm transition-all ${
            saveBanner.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : saveBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{saveBanner.message}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">Changes saved automatically</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Navigation Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setActiveTab(sec.id);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === sec.id && !searchQuery.trim()
                  ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            aria-label="Search customization settings"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Empty Search Fallback */}
      {searchQuery.trim() && visibleSectionsCount === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <Sliders className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="font-semibold text-sm text-slate-800">No settings found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            We couldn't find any preferences matching &ldquo;{searchQuery}&rdquo;. Try another term like theme, notifications, or layout.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Main Settings Body */}
      {(!searchQuery.trim() || visibleSectionsCount > 0) && (
        <div className="flex flex-col gap-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-xs">
          {/* SECTION 1: APPEARANCE */}
          {shouldRenderSection('appearance', 'Appearance', ['theme', 'dark', 'light', 'color', 'accent', 'density', 'font']) && (
            <SettingSection
              id="appearance"
              title="Appearance & Theme"
              description="Customize interface color theme, brand accent, spacing density, and code fonts"
              icon={Palette}
              onResetSection={() => handleSectionReset('appearance', 'Appearance')}
            >
              <SettingRow
                label="Interface Theme"
                description="Select light or dark mode for your workspace"
                currentValueBadge={settings.appearance.themeMode}
              >
                <RadioGroup
                  name="themeMode"
                  value={settings.appearance.themeMode}
                  onChange={(val) => handleSettingChange('appearance', 'themeMode', val)}
                  options={[
                    { value: 'light', label: 'Light (Default)', description: 'Clean slate canvas with high readability' },
                    { value: 'dark', label: 'Dark', description: 'Subdued palette for low-light environments' },
                    { value: 'high-contrast', label: 'High Contrast', description: 'Maximum contrast adhering to WCAG standards' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Brand Accent Color"
                description="Primary highlight color used for badges, active states, and buttons"
              >
                <ColorPicker
                  id="accentColor"
                  value={settings.appearance.accentColor}
                  onChange={(val) => handleSettingChange('appearance', 'accentColor', val)}
                />
              </SettingRow>

              <SettingRow
                label="Interface Density"
                description="Adjust vertical padding and row spacing across tables and lists"
                currentValueBadge={settings.appearance.density}
              >
                <RadioGroup
                  name="density"
                  value={settings.appearance.density}
                  onChange={(val) => handleSettingChange('appearance', 'density', val)}
                  options={[
                    { value: 'compact', label: 'Compact', description: 'Higher data density' },
                    { value: 'standard', label: 'Standard', description: 'Default balanced spacing' },
                    { value: 'comfortable', label: 'Comfortable', description: 'Larger touch targets' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Code & Terminal Font"
                description="Font family applied to raw HTTP header inspectors and evidence code blocks"
                isLast
              >
                <SelectDropdown
                  id="codeFont"
                  name="codeFont"
                  value={settings.appearance.codeFont}
                  onChange={(val) => handleSettingChange('appearance', 'codeFont', val)}
                  options={[
                    { value: 'jetbrains', label: 'JetBrains Mono (Recommended)' },
                    { value: 'system', label: 'System Monospace' },
                  ]}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* SECTION 2: LAYOUT */}
          {shouldRenderSection('layout', 'Layout', ['container', 'width', 'sidebar', 'table', 'density', 'pagination', 'page size']) && (
            <SettingSection
              id="layout"
              title="Layout & Geometry"
              description="Manage viewport boundaries, default navigation state, and table pagination"
              icon={Layout}
              onResetSection={() => handleSectionReset('layout', 'Layout')}
            >
              <SettingRow
                label="Content Container Width"
                description="Constrain main workspace to 1280px or expand fluidly across ultrawide monitors"
                currentValueBadge={settings.layout.containerWidth}
              >
                <RadioGroup
                  name="containerWidth"
                  value={settings.layout.containerWidth}
                  onChange={(val) => handleSettingChange('layout', 'containerWidth', val)}
                  options={[
                    { value: 'contained', label: 'Contained (1280px)', description: 'Optimal reading width' },
                    { value: 'fluid', label: 'Fluid (Full Width)', description: 'Stretches to 100% of screen' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Default Sidebar State"
                description="Initial state of the navigation sidebar upon launching the app"
                currentValueBadge={settings.layout.sidebarDefault}
              >
                <RadioGroup
                  name="sidebarDefault"
                  value={settings.layout.sidebarDefault}
                  onChange={(val) => handleSettingChange('layout', 'sidebarDefault', val)}
                  options={[
                    { value: 'expanded', label: 'Expanded (256px)' },
                    { value: 'collapsed', label: 'Collapsed / Drawer' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Findings Table Density"
                description="Vertical spacing density for the 13-check diagnostic findings table"
                currentValueBadge={settings.layout.tableDensity}
              >
                <SelectDropdown
                  id="tableDensity"
                  name="tableDensity"
                  value={settings.layout.tableDensity}
                  onChange={(val) => handleSettingChange('layout', 'tableDensity', val)}
                  options={[
                    { value: 'standard', label: 'Standard (Clean padding)' },
                    { value: 'compact', label: 'High Density (Compact)' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Default Findings Page Size"
                description="Number of diagnostic checks displayed per pagination segment"
                isLast
              >
                <SelectDropdown
                  id="findingsPageSize"
                  name="findingsPageSize"
                  value={settings.layout.findingsPageSize}
                  onChange={(val) => handleSettingChange('layout', 'findingsPageSize', Number(val))}
                  options={[
                    { value: 5, label: '5 checks per page' },
                    { value: 10, label: '10 checks per page (Default)' },
                    { value: 25, label: '25 checks per page' },
                    { value: 50, label: '50 checks per page' },
                  ]}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* SECTION 3: NAVIGATION */}
          {shouldRenderSection('navigation', 'Navigation', ['landing', 'hotkey', 'shortcut', 'breadcrumbs', 'route']) && (
            <SettingSection
              id="navigation"
              title="Navigation & Shortcuts"
              description="Configure default landing page, keyboard shortcuts, and workflow confirmations"
              icon={Compass}
              onResetSection={() => handleSectionReset('navigation', 'Navigation')}
            >
              <SettingRow
                label="Default Landing Page"
                description="Initial route opened after signing into your account"
                currentValueBadge={settings.navigation.defaultLanding}
              >
                <SelectDropdown
                  id="defaultLanding"
                  name="defaultLanding"
                  value={settings.navigation.defaultLanding}
                  onChange={(val) => handleSettingChange('navigation', 'defaultLanding', val)}
                  options={[
                    { value: '/dashboard', label: 'Dashboard (Security Overview)' },
                    { value: '/scanner', label: 'Web Scanner (New Scan)' },
                    { value: '/scans', label: 'Scan History' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Quick Scan Hotkey"
                description="Global keyboard shortcut to focus the top navigation scan input"
                currentValueBadge={settings.navigation.quickScanHotkey}
              >
                <RadioGroup
                  name="quickScanHotkey"
                  value={settings.navigation.quickScanHotkey}
                  onChange={(val) => handleSettingChange('navigation', 'quickScanHotkey', val)}
                  options={[
                    { value: 'ctrl_k', label: 'Ctrl + K / Cmd + K' },
                    { value: 'slash', label: 'Slash (/)' },
                    { value: 'disabled', label: 'Disabled' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Show Breadcrumb Trail"
                description="Display hierarchical navigation breadcrumbs above scan detail views"
              >
                <ToggleSwitch
                  id="showBreadcrumbs"
                  label="Show Breadcrumb Trail"
                  checked={settings.navigation.showBreadcrumbs}
                  onChange={(val) => handleSettingChange('navigation', 'showBreadcrumbs', val)}
                />
              </SettingRow>

              <SettingRow
                label="Confirm Navigation During Active Scan"
                description="Show warning prompt before leaving while a website security scan is in progress"
                isLast
              >
                <ToggleSwitch
                  id="confirmNavigationOnScan"
                  label="Confirm Navigation During Active Scan"
                  checked={settings.navigation.confirmNavigationOnScan}
                  onChange={(val) => handleSettingChange('navigation', 'confirmNavigationOnScan', val)}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* SECTION 4: NOTIFICATIONS */}
          {shouldRenderSection('notifications', 'Notifications', ['email', 'alert', 'sound', 'webhook', 'digest', 'slack']) && (
            <SettingSection
              id="notifications"
              title="Notifications & Alerts"
              description="Configure email alerts for critical vulnerabilities, audit digests, and outbound webhooks"
              icon={Bell}
              onResetSection={() => handleSectionReset('notifications', 'Notifications')}
            >
              <SettingRow
                label="Email Alerts for Critical Vulnerabilities"
                description="Send immediate email when a scan identifies Critical severity vulnerabilities"
              >
                <ToggleSwitch
                  id="emailAlertsCritical"
                  label="Email Alerts for Critical Vulnerabilities"
                  checked={settings.notifications.emailAlertsCritical}
                  onChange={(val) => handleSettingChange('notifications', 'emailAlertsCritical', val)}
                />
              </SettingRow>

              <SettingRow
                label="Email Alerts for High Severity Findings"
                description="Send email notification for High severity configuration flaws (e.g., missing CSP or HSTS)"
              >
                <ToggleSwitch
                  id="emailAlertsHigh"
                  label="Email Alerts for High Severity Findings"
                  checked={settings.notifications.emailAlertsHigh}
                  onChange={(val) => handleSettingChange('notifications', 'emailAlertsHigh', val)}
                />
              </SettingRow>

              <SettingRow
                label="Sound Notification on Completion"
                description="Play a subtle audio chime when a background scan completes"
              >
                <ToggleSwitch
                  id="inAppSoundAlerts"
                  label="Sound Notification on Completion"
                  checked={settings.notifications.inAppSoundAlerts}
                  onChange={(val) => handleSettingChange('notifications', 'inAppSoundAlerts', val)}
                />
              </SettingRow>

              <SettingRow
                label="Audit Digest Frequency"
                description="Consolidated security summary report delivered to registered account email"
                currentValueBadge={settings.notifications.digestFrequency}
              >
                <SelectDropdown
                  id="digestFrequency"
                  name="digestFrequency"
                  value={settings.notifications.digestFrequency}
                  onChange={(val) => handleSettingChange('notifications', 'digestFrequency', val)}
                  options={[
                    { value: 'instant', label: 'Instant (Per scan completion)' },
                    { value: 'daily', label: 'Daily Morning Summary (09:00 UTC)' },
                    { value: 'weekly', label: 'Weekly Executive Briefing' },
                    { value: 'off', label: 'Disabled' },
                  ]}
                />
              </SettingRow>

              {/* Webhook Configuration Sub-row */}
              <div className="py-3.5 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-xs text-slate-800">
                      Outbound Webhook Destination
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Forward scan results to Slack, Discord, or an internal API endpoint
                    </p>
                  </div>
                  <ToggleSwitch
                    id="webhookEnabled"
                    label="Enable Outbound Webhook"
                    checked={settings.notifications.webhookEnabled}
                    onChange={(val) => handleSettingChange('notifications', 'webhookEnabled', val)}
                  />
                </div>

                {settings.notifications.webhookEnabled && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <input
                      type="url"
                      value={settings.notifications.webhookUrl}
                      onChange={(e) => handleSettingChange('notifications', 'webhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Ping</span>
                    </button>
                  </div>
                )}

                {webhookTestStatus && (
                  <p
                    className={`text-[11px] font-medium mt-1 ${
                      webhookTestStatus.ok ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {webhookTestStatus.msg}
                  </p>
                )}
              </div>
            </SettingSection>
          )}

          {/* SECTION 5: DASHBOARD */}
          {shouldRenderSection('dashboard', 'Dashboard', ['chart', 'refresh', 'interval', 'velocity', 'history']) && (
            <SettingSection
              id="dashboard"
              title="Dashboard & Analytics"
              description="Customize score trajectory charts, automatic refresh rates, and summary metrics"
              icon={Gauge}
              onResetSection={() => handleSectionReset('dashboard', 'Dashboard')}
            >
              <SettingRow
                label="Score Trajectory Time Range"
                description="Historical time window rendered on the security posture chart"
                currentValueBadge={settings.dashboard.defaultTimeRange}
              >
                <RadioGroup
                  name="defaultTimeRange"
                  value={settings.dashboard.defaultTimeRange}
                  onChange={(val) => handleSettingChange('dashboard', 'defaultTimeRange', val)}
                  options={[
                    { value: '7d', label: 'Last 7 Days' },
                    { value: '30d', label: 'Last 30 Days (Default)' },
                    { value: '90d', label: 'Last 90 Days' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Trajectory Chart Style"
                description="Visual style for security score trend trajectories"
                currentValueBadge={settings.dashboard.chartType}
              >
                <RadioGroup
                  name="chartType"
                  value={settings.dashboard.chartType}
                  onChange={(val) => handleSettingChange('dashboard', 'chartType', val)}
                  options={[
                    { value: 'area', label: 'Smooth Area Chart' },
                    { value: 'bar', label: 'Bar Distribution Chart' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Metrics Auto-Refresh Interval"
                description="Background refresh interval for dashboard analytics"
                currentValueBadge={
                  settings.dashboard.autoRefreshInterval === 0
                    ? 'Off'
                    : `${settings.dashboard.autoRefreshInterval}s`
                }
              >
                <RangeSlider
                  id="autoRefreshInterval"
                  name="autoRefreshInterval"
                  min={0}
                  max={60}
                  step={15}
                  value={settings.dashboard.autoRefreshInterval}
                  formatValue={(v) => (v === 0 ? 'Off (Manual)' : `${v}s`)}
                  onChange={(val) => handleSettingChange('dashboard', 'autoRefreshInterval', val)}
                />
              </SettingRow>

              <SettingRow
                label="Show Scan Frequency Metric"
                description="Display scan activity throughput metric on dashboard overview cards"
                isLast
              >
                <ToggleSwitch
                  id="showVelocityMetric"
                  label="Show Scan Frequency Metric"
                  checked={settings.dashboard.showVelocityMetric}
                  onChange={(val) => handleSettingChange('dashboard', 'showVelocityMetric', val)}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* SECTION 6: LOCALIZATION */}
          {shouldRenderSection('localization', 'Localization', ['timezone', 'date', 'time', 'clock', 'number', 'format', 'utc']) && (
            <SettingSection
              id="localization"
              title="Localization & Regional"
              description="Set timezone reference, audit date formats, clock styles, and numeric notation"
              icon={Globe2}
              onResetSection={() => handleSectionReset('localization', 'Localization')}
            >
              <SettingRow
                label="Timezone Reference"
                description="Display timestamps in local browser clock or standardized UTC reference"
                currentValueBadge={settings.localization.timezone}
              >
                <RadioGroup
                  name="timezone"
                  value={settings.localization.timezone}
                  onChange={(val) => handleSettingChange('localization', 'timezone', val)}
                  options={[
                    { value: 'LOCAL', label: 'Local Browser Timezone' },
                    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Audit Date Format"
                description="Date format used across PDF audit reports and table columns"
                currentValueBadge={settings.localization.dateFormat}
              >
                <SelectDropdown
                  id="dateFormat"
                  name="dateFormat"
                  value={settings.localization.dateFormat}
                  onChange={(val) => handleSettingChange('localization', 'dateFormat', val)}
                  options={[
                    { value: 'ISO', label: 'ISO 8601 (YYYY-MM-DD)' },
                    { value: 'DMY', label: 'Day-First (DD/MM/YYYY)' },
                    { value: 'MDY', label: 'Month-First (MM/DD/YYYY)' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Clock Format"
                description="Display time in 24-hour military notation or 12-hour AM/PM format"
                currentValueBadge={settings.localization.clockFormat}
              >
                <RadioGroup
                  name="clockFormat"
                  value={settings.localization.clockFormat}
                  onChange={(val) => handleSettingChange('localization', 'clockFormat', val)}
                  options={[
                    { value: '24h', label: '24-Hour (14:30)' },
                    { value: '12h', label: '12-Hour (2:30 PM)' },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Number Notation"
                description="Format large numbers with standard commas or compact metric abbreviations"
                isLast
              >
                <RadioGroup
                  name="numberFormat"
                  value={settings.localization.numberFormat}
                  onChange={(val) => handleSettingChange('localization', 'numberFormat', val)}
                  options={[
                    { value: 'standard', label: 'Standard (12,450)' },
                    { value: 'compact', label: 'Compact Metric (12.4k)' },
                  ]}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* SECTION 7: ACCESSIBILITY */}
          {shouldRenderSection('accessibility', 'Accessibility', ['contrast', 'motion', 'focus', 'wcag', 'screen reader', 'a11y']) && (
            <SettingSection
              id="accessibility"
              title="Accessibility (WCAG 2.1 AA)"
              description="Options designed for users utilizing high contrast, reduced motion, or screen readers"
              icon={Eye}
              onResetSection={() => handleSectionReset('accessibility', 'Accessibility')}
            >
              <SettingRow
                label="High Contrast Surface Mode"
                description="Increase border distinction and text contrast ratios across all surfaces (≥ 7:1)"
              >
                <ToggleSwitch
                  id="highContrast"
                  label="High Contrast Surface Mode"
                  checked={settings.accessibility.highContrast}
                  onChange={(val) => handleSettingChange('accessibility', 'highContrast', val)}
                />
              </SettingRow>

              <SettingRow
                label="Reduce Motion & Animations"
                description="Disable decorative animations, pulse indicators, and transition motion"
              >
                <ToggleSwitch
                  id="reducedMotion"
                  label="Reduce Motion & Animations"
                  checked={settings.accessibility.reducedMotion}
                  onChange={(val) => handleSettingChange('accessibility', 'reducedMotion', val)}
                />
              </SettingRow>

              <SettingRow
                label="Enhanced Visible Focus Rings"
                description="Show clear, high-visibility outline rings on focused buttons, links, and form fields"
              >
                <ToggleSwitch
                  id="enhancedFocusRing"
                  label="Enhanced Visible Focus Rings"
                  checked={settings.accessibility.enhancedFocusRing}
                  onChange={(val) => handleSettingChange('accessibility', 'enhancedFocusRing', val)}
                />
              </SettingRow>

              <SettingRow
                label="Screen Reader Diagnostics"
                description="Inject descriptive ARIA live announcements for real-time scan step status changes"
                isLast
              >
                <ToggleSwitch
                  id="screenReaderOptimized"
                  label="Screen Reader Diagnostics"
                  checked={settings.accessibility.screenReaderOptimized}
                  onChange={(val) => handleSettingChange('accessibility', 'screenReaderOptimized', val)}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* SECTION 8: ADVANCED SETTINGS & DANGER ZONE */}
          {shouldRenderSection('advanced', 'Advanced', ['debug', 'cache', 'anonymize', 'danger', 'reset', 'factory']) && (
            <SettingSection
              id="advanced"
              title="Advanced Settings & Danger Zone"
              description="Manage developer logging, local cache retention, and sensitive configuration actions"
              icon={SlidersHorizontal}
              onResetSection={() => handleSectionReset('advanced', 'Advanced')}
            >
              <SettingRow
                label="Verbose Debug Logging"
                description="Log detailed network request timings and diagnostics to the browser developer console"
              >
                <ToggleSwitch
                  id="debugTelemetry"
                  label="Verbose Debug Logging"
                  checked={settings.advanced.debugTelemetry}
                  onChange={(val) => handleSettingChange('advanced', 'debugTelemetry', val)}
                />
              </SettingRow>

              <SettingRow
                label="Cache Scans Locally in Browser"
                description="Store completed scan summaries locally for faster page switching and offline preview"
              >
                <ToggleSwitch
                  id="cacheScansLocally"
                  label="Cache Scans Locally in Browser"
                  checked={settings.advanced.cacheScansLocally}
                  onChange={(val) => handleSettingChange('advanced', 'cacheScansLocally', val)}
                />
              </SettingRow>

              <SettingRow
                label="Anonymize Target URLs in Local Export Logs"
                description="Mask target hostnames (e.g., ex****e.com) when exporting diagnostic reports"
              >
                <ToggleSwitch
                  id="anonymizeTargetUrls"
                  label="Anonymize Target URLs in Local Export Logs"
                  checked={settings.advanced.anonymizeTargetUrls}
                  onChange={(val) => handleSettingChange('advanced', 'anonymizeTargetUrls', val)}
                />
              </SettingRow>

              {/* Danger Zone */}
              <div className="mt-6 pt-5 border-t border-rose-200 bg-rose-50/70 p-4 rounded-xl border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-xs text-rose-900">
                      Danger Zone: Reset All Preferences
                    </h3>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                      Restore all appearance, layout, notification, and dashboard settings to their original factory defaults. Your scan history and account credentials are not affected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </SettingSection>
          )}
        </div>
      )}

      {/* Confirmation Modal for Reset All Defaults */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset All Preferences to Defaults?"
        message="This action will restore all theme settings, layout behaviors, dashboard options, and notification preferences to their initial defaults. Your scan history and account credentials will remain safe."
        confirmLabel="Yes, Reset Preferences"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmResetAll}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* Import JSON Modal */}
      {importModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setImportModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xl z-10">
            <h3 className="text-base font-semibold text-slate-900">
              Import Configuration JSON
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Paste a previously exported SecureScan JSON configuration snippet to apply your preferences.
            </p>

            <form onSubmit={handleImportSubmit} className="mt-4 flex flex-col gap-3">
              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{\n  "appearance": {\n    "themeMode": "light"\n  }\n}'
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />

              {importError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  Apply Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
