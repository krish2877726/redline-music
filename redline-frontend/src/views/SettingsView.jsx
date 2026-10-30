import React, { useState } from 'react';
import { Icon } from '../components/SvgIcons.jsx';
import { art } from '../data/catalog.js';
import { useSettings, EQ_PRESETS } from '../context/SettingsContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import {
  SpotifyTopBar,
  SpotifySectionHeader,
  SpotifySettingToggleRow,
  SpotifySettingActionRow,
  SpotifyRadioDialog,
} from './settings/components/SpotifySettingsComponents.jsx';

export function SettingsView({ onShowToast, onNavigate, onOpenOnboarding }) {
  const {
    settings,
    updateSetting,
    setEqualizerPreset,
    setEqualizerBand,
    exportBackup,
    importBackup,
    resetSettings,
  } = useSettings();

  const {
    likedTracks,
    savedPlaylists,
  } = usePlayer();

  const [subScreen, setSubScreen] = useState('main'); // 'main', 'profile', 'content', 'media', 'data', 'backup', 'about'
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog States
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [showImageQualityDialog, setShowImageQualityDialog] = useState(false);
  const [showEqualizerDialog, setShowEqualizerDialog] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [cacheSize, setCacheSize] = useState('24.8 MB');

  const qualityOptions = [
    { key: 'auto', label: 'Automatic (Recommended)', sub: 'Adapts to your current connection speed' },
    { key: 'low', label: 'Low (48-64 kbps)', sub: 'Data Saver • Minimal bandwidth' },
    { key: 'normal', label: 'Normal (128 kbps)', sub: 'Standard fidelity' },
    { key: 'high', label: 'High (160 kbps Opus)', sub: 'Crisp high-definition acoustics' },
    { key: 'very_high', label: 'Very high (256-320 kbps AAC)', sub: 'Maximum streaming fidelity' },
  ];

  const imageQualityOptions = [
    { key: 'low', label: 'Low (120x120)', sub: 'Data Saver • Fast loading' },
    { key: 'normal', label: 'Normal (300x300)', sub: 'Standard balance' },
    { key: 'high', label: 'High (544x544 HD)', sub: 'Crystal-clear album art' },
  ];

  const qualityLabelMap = {
    auto: 'Automatic',
    low: 'Low (48-64k)',
    normal: 'Normal (128k)',
    high: 'High (160k Opus)',
    very_high: 'Very high (256-320k)',
  };

  const imageQualityLabelMap = {
    low: 'Low (120px)',
    normal: 'Normal (300px)',
    high: 'High (544px HD)',
  };

  const allCategories = [
    {
      id: 'profile',
      title: 'Profile and account',
      subtitle: `${settings.username} • Account preferences`,
      icon: 'user',
    },
    {
      id: 'content',
      title: 'Content and display',
      subtitle: 'Lyrics • Explicit content • Vinyl spin • Visuals',
      icon: 'mic',
    },
    {
      id: 'media',
      title: 'Media quality',
      subtitle: `Autoplay • Volume normalization • Equalizer • ${qualityLabelMap[settings.audioQuality] || 'High'}`,
      icon: 'sliders',
    },
    {
      id: 'data',
      title: 'Data-saving and offline',
      subtitle: `Data Saver: ${settings.dataSaver ? 'On' : 'Off'} • Storage & Cache`,
      icon: 'database',
    },
    {
      id: 'backup',
      title: 'Backup and restore',
      subtitle: 'Export app data • Import external backup',
      icon: 'download',
    },
    {
      id: 'about',
      title: 'About and support',
      subtitle: 'Version 2.0.0 • Snitify UX Architecture • Open Source',
      icon: 'info',
    },
  ];

  const displayedCategories = searchQuery.trim()
    ? allCategories.filter(
        c =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allCategories;

  const handleClearCache = () => {
    setShowClearCacheModal(false);
    setCacheSize('0.0 MB');
    onShowToast('Streaming cache cleared successfully');
  };

  const handleExport = () => {
    const libraryState = {
      likedTracks: [...likedTracks],
      savedPlaylists: [...savedPlaylists],
    };
    exportBackup(libraryState);
    onShowToast('Backup exported successfully');
  };

  const handleImportFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result;
        importBackup(text);
        onShowToast('Backup restored successfully');
      } catch (err) {
        onShowToast('Failed to import backup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-page" style={{ maxWidth: '780px', margin: '0 auto', padding: '8px 16px 120px' }}>
      <div className="hdr-glow" />

      {/* ─── 0. MAIN SETTINGS SCREEN (Snitify SettingsMainStep) ─── */}
      {subScreen === 'main' && (
        <>
          <SpotifyTopBar
            title="Settings"
            onBack={() => onNavigate && onNavigate('home')}
            onSearchClick={() => setIsSearchActive(true)}
            searchActive={isSearchActive}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClose={() => {
              setIsSearchActive(false);
              setSearchQuery('');
            }}
          />

          {!isSearchActive && (
            <>
              {/* Centered Profile Header */}
              <div className="snitify-profile-header" onClick={() => setSubScreen('profile')}>
                <div className="snitify-profile-avatar">
                  {settings.username ? settings.username.trim().charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="snitify-profile-name">{settings.username}</div>
                <div className="snitify-profile-bio">{settings.profileBio}</div>
                <div className="snitify-profile-badge">View profile</div>
              </div>

              {/* Two Quick Action Cards (Data Saver & Audio Quality) */}
              <div className="snitify-quick-cards">
                <div
                  className="snitify-quick-card"
                  onClick={() => {
                    const next = !settings.dataSaver;
                    updateSetting('dataSaver', next);
                    onShowToast(next ? 'Data Saver mode: On' : 'Data Saver mode: Off');
                  }}
                >
                  <Icon name="database" className="i-24 qc-icon" style={{ color: settings.dataSaver ? '#1DB954' : '#fff' }} />
                  <span className="qc-title">Data Saver mode</span>
                  <span className="qc-status">{settings.dataSaver ? 'On' : 'Always off'}</span>
                </div>

                <div
                  className="snitify-quick-card"
                  onClick={() => setShowQualityDialog(true)}
                >
                  <Icon name="sliders" className="i-24 qc-icon" />
                  <span className="qc-title">Streaming quality</span>
                  <span className="qc-status">{qualityLabelMap[settings.audioQuality] || 'High'}</span>
                </div>
              </div>
            </>
          )}

          {/* Categories List */}
          <div className="snitify-category-list">
            {displayedCategories.map(cat => (
              <div
                key={cat.id}
                className="snitify-category-item"
                onClick={() => setSubScreen(cat.id)}
              >
                <div className="snitify-cat-badge">
                  <Icon name={cat.icon} className="i-20" />
                </div>
                <div className="snitify-cat-text">
                  <div className="snitify-cat-title">{cat.title}</div>
                  <div className="snitify-cat-sub">{cat.subtitle}</div>
                </div>
                <Icon name="chev-right" className="i-16 snitify-cat-arrow" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── 1. PROFILE AND ACCOUNT SCREEN ─── */}
      {subScreen === 'profile' && (
        <div>
          <SpotifyTopBar title="Profile & Account" onBack={() => setSubScreen('main')} />

          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px 20px', border: '1px solid rgba(255,255,255,.06)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div className="snitify-profile-avatar" style={{ margin: 0, width: '76px', height: '76px', fontSize: '28px' }}>
                {settings.username ? settings.username.trim().charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{settings.username}</h2>
                <div style={{ fontSize: '13px', color: '#a7a7a7', marginTop: '4px' }}>
                  {likedTracks.size} liked songs • {savedPlaylists.size} custom playlists
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#a7a7a7', display: 'block', marginBottom: '6px' }}>Display Name</label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={e => updateSetting('username', e.target.value)}
                  className="settings-select"
                  style={{ width: '100%', padding: '10px 14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#a7a7a7', display: 'block', marginBottom: '6px' }}>Bio</label>
                <input
                  type="text"
                  value={settings.profileBio}
                  onChange={e => updateSetting('profileBio', e.target.value)}
                  className="settings-select"
                  style={{ width: '100%', padding: '10px 14px' }}
                />
              </div>

              {onOpenOnboarding && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                    onClick={onOpenOnboarding}
                  >
                    Manage Preferred Languages & Artists
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. CONTENT AND DISPLAY SCREEN ─── */}
      {subScreen === 'content' && (
        <div>
          <SpotifyTopBar title="Content and display" onBack={() => setSubScreen('main')} />

          <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
            <SpotifySectionHeader title="Lyrics" />
            <SpotifySettingToggleRow
              title="Live synchronized lyrics"
              subtitle="Highlight lines in real time with music playback powered by LRCLIB."
              checked={settings.syncedLyrics}
              onChange={v => updateSetting('syncedLyrics', v)}
            />

            <SpotifySectionHeader title="Display" />
            <SpotifySettingToggleRow
              title="Show explicit content badge"
              subtitle="Display the 'E' tag on tracks with explicit lyrics."
              checked={settings.showExplicit}
              onChange={v => updateSetting('showExplicit', v)}
            />
            <SpotifySettingToggleRow
              title="Rotating vinyl disc animation"
              subtitle="Display spinning vinyl record alongside album artwork during playback."
              checked={settings.vinylSpin}
              onChange={v => updateSetting('vinylSpin', v)}
            />
            <SpotifySettingToggleRow
              title="Dynamic ambient glow backdrop"
              subtitle="Subtly illuminate header and player based on track mood and artwork."
              checked={settings.dynamicThemeGlow}
              onChange={v => updateSetting('dynamicThemeGlow', v)}
            />
          </div>
        </div>
      )}

      {/* ─── 3. MEDIA QUALITY SCREEN (Snitify MediaQualityScreen) ─── */}
      {subScreen === 'media' && (
        <div>
          <SpotifyTopBar title="Media quality" onBack={() => setSubScreen('main')} />

          <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
            <SpotifySectionHeader title="Listening controls" />
            <SpotifySettingToggleRow
              title="Autoplay"
              subtitle="Similar content will play when what you’re listening to ends."
              checked={settings.autoplay}
              onChange={v => {
                updateSetting('autoplay', v);
                onShowToast(v ? 'Autoplay enabled' : 'Autoplay disabled');
              }}
            />
            <SpotifySettingToggleRow
              title="Normalize volume"
              subtitle="Set the same volume level for all tracks via Web Audio compression."
              checked={settings.normalizeVolume}
              onChange={v => {
                updateSetting('normalizeVolume', v);
                onShowToast(v ? 'Volume normalization enabled' : 'Volume normalization disabled');
              }}
            />
            <SpotifySettingActionRow
              title="Equalizer"
              subtitle="Adjust different frequencies to shape your acoustics."
              trailingText={settings.equalizerEnabled ? `Preset: ${settings.equalizerPreset}` : 'Bypassed'}
              onClick={() => setShowEqualizerDialog(true)}
            />

            <SpotifySectionHeader title="Streaming quality" />
            <SpotifySettingActionRow
              title="Streaming audio quality"
              subtitle="Adjust audio bitrate based on connection speed and data limits."
              trailingText={qualityLabelMap[settings.audioQuality] || settings.audioQuality}
              onClick={() => setShowQualityDialog(true)}
            />
            <SpotifySettingActionRow
              title="Preferred audio format"
              subtitle="Opus provides superior fidelity at equivalent bitrates."
              trailingText={settings.preferredAudioFormat?.toUpperCase() || 'OPUS'}
              onClick={() => {
                const nextFmt = settings.preferredAudioFormat === 'opus' ? 'aac' : 'opus';
                updateSetting('preferredAudioFormat', nextFmt);
                onShowToast(`Preferred format set to ${nextFmt.toUpperCase()}`);
              }}
            />
          </div>
        </div>
      )}

      {/* ─── 4. DATA-SAVING AND OFFLINE SCREEN ─── */}
      {subScreen === 'data' && (
        <div>
          <SpotifyTopBar title="Data-saving and offline" onBack={() => setSubScreen('main')} />

          <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
            <SpotifySectionHeader title="Data saving" />
            <SpotifySettingToggleRow
              title="Data Saver mode"
              subtitle="Forces lower audio bitrate (48-64 kbps) and compact 120x120 thumbnails to conserve cellular bandwidth."
              checked={settings.dataSaver}
              onChange={v => {
                updateSetting('dataSaver', v);
                onShowToast(v ? 'Data Saver mode active' : 'Data Saver disabled');
              }}
            />
            <SpotifySettingActionRow
              title="Thumbnail & cover image quality"
              subtitle="Client-constructed resolution for album art and track thumbnails."
              trailingText={imageQualityLabelMap[settings.imageQuality] || settings.imageQuality}
              onClick={() => setShowImageQualityDialog(true)}
            />

            <SpotifySectionHeader title="Storage & Cache" />
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Audio stream cache</div>
              <div style={{ fontSize: '13px', color: '#a7a7a7', marginTop: '4px' }}>
                Estimated temporary streaming storage: <b style={{ color: '#fff' }}>{cacheSize}</b>
              </div>
            </div>
            <SpotifySettingActionRow
              title="Clear streaming cache"
              subtitle="Free up temporary browser audio chunk cache without affecting your library."
              trailingText="Clear"
              onClick={() => setShowClearCacheModal(true)}
            />
          </div>
        </div>
      )}

      {/* ─── 5. BACKUP AND RESTORE SCREEN ─── */}
      {subScreen === 'backup' && (
        <div>
          <SpotifyTopBar title="Backup and restore" onBack={() => setSubScreen('main')} />

          <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
            <SpotifySectionHeader title="Library & Settings Backup" />
            <SpotifySettingActionRow
              title="Export app data"
              subtitle="Download your liked songs, custom playlists, and preferences as JSON."
              trailingText="Export"
              onClick={handleExport}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Import external backup</div>
                <div style={{ fontSize: '13px', color: '#a7a7a7', marginTop: '3px' }}>
                  Restore your playlists and settings from a previously saved JSON file.
                </div>
              </div>
              <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}>
                Import
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
              </label>
            </div>

            <SpotifySectionHeader title="Factory Reset" />
            <SpotifySettingActionRow
              title="Reset all settings"
              subtitle="Restore audio bitrate, display preferences, and equalizer to default factory state."
              trailingText="Reset"
              onClick={() => {
                resetSettings();
                onShowToast('Settings reset to defaults');
              }}
            />
          </div>
        </div>
      )}

      {/* ─── 6. ABOUT AND SUPPORT SCREEN ─── */}
      {subScreen === 'about' && (
        <div>
          <SpotifyTopBar title="About and support" onBack={() => setSubScreen('main')} />

          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px 20px', border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="music" className="i-24" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Redline Music</h2>
                <div style={{ fontSize: '13px', color: '#a7a7a7' }}>Version 2.0.0 (Snitify Edition)</div>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: '20px' }}>
              Redline Music delivers high-performance YouTube Music streaming.
              Its architecture and UX are ported from <b>Snitify</b>, incorporating the clean Encore design tokens,
              Circular typography, debounced suggestions, and client-adaptive quality controls.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#a7a7a7' }}>
              <div>• <b>Streaming Engine:</b> Direct extraction with Opus 160kbps & AAC</div>
              <div>• <b>Typography:</b> Bundled Circular SP font family</div>
              <div>• <b>Lyrics Engine:</b> Synchronized real-time lyrics via LRCLIB</div>
              <div>• <b>Audio Processing:</b> Web Audio 5-band Equalizer & Compressor</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STREAMING QUALITY DIALOG ─── */}
      {showQualityDialog && (
        <SpotifyRadioDialog
          title="Streaming Quality"
          options={qualityOptions}
          selectedKey={settings.audioQuality}
          onSelect={key => {
            updateSetting('audioQuality', key);
            setShowQualityDialog(false);
            onShowToast(`Audio quality set to ${qualityLabelMap[key] || key}`);
          }}
          onClose={() => setShowQualityDialog(false)}
        />
      )}

      {/* ─── THUMBNAIL QUALITY DIALOG ─── */}
      {showImageQualityDialog && (
        <SpotifyRadioDialog
          title="Thumbnail & Cover Quality"
          options={imageQualityOptions}
          selectedKey={settings.imageQuality}
          onSelect={key => {
            updateSetting('imageQuality', key);
            setShowImageQualityDialog(false);
            onShowToast(`Thumbnail quality set to ${imageQualityLabelMap[key] || key}`);
          }}
          onClose={() => setShowImageQualityDialog(false)}
        />
      )}

      {/* ─── EQUALIZER DIALOG ─── */}
      {showEqualizerDialog && (
        <div className="modal-overlay" onClick={() => setShowEqualizerDialog(false)}>
          <div className="modal-box spotify-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Equalizer</h3>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.equalizerEnabled}
                  onChange={e => updateSetting('equalizerEnabled', e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div style={{ margin: '18px 0' }}>
              <div className="eq-presets" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {Object.keys(EQ_PRESETS).map(presetKey => (
                  <button
                    key={presetKey}
                    className={`eq-preset-btn ${settings.equalizerPreset === presetKey ? 'active' : ''}`}
                    onClick={() => setEqualizerPreset(presetKey)}
                  >
                    {presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}
                  </button>
                ))}
              </div>

              <div className="eq-sliders" style={{ opacity: settings.equalizerEnabled ? 1 : 0.4 }}>
                {['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'].map((freqLabel, i) => (
                  <div key={freqLabel} className="eq-band">
                    <span className="eq-val">
                      {settings.equalizerBands[i] > 0 ? `+${settings.equalizerBands[i]}` : settings.equalizerBands[i]} dB
                    </span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      disabled={!settings.equalizerEnabled}
                      value={settings.equalizerBands[i] || 0}
                      onChange={e => setEqualizerBand(i, Number(e.target.value))}
                    />
                    <span className="eq-freq">{freqLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-accent" onClick={() => setShowEqualizerDialog(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAR CACHE MODAL ─── */}
      {showClearCacheModal && (
        <div className="modal-overlay" onClick={() => setShowClearCacheModal(false)}>
          <div className="modal-box spotify-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Clear audio cache?</h3>
            <p className="modal-sub">
              This will clear {cacheSize} of cached audio chunks and search data. Your playlists and liked songs will remain intact.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowClearCacheModal(false)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleClearCache}>
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
