import { useState, useEffect } from 'react';
import { Upload, RefreshCw, Trash2, Bell, Smartphone, AlertTriangle, Info } from 'lucide-react';
import { downloadsApi } from '../lib/downloadsApi';
import styles from './AppManagementPage.module.css';

interface AppFile {
  platform: string;
  fileName: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

interface DownloadStats {
  total: number;
  byPlatform: {
    android?: number;
    ios?: number;
  };
  last30Days: number;
  dailyDownloads: Array<{
    date: string;
    count: number;
  }>;
  totalDownloads?: number;
  recentDownloads?: Array<{
    platform: string;
    version: string;
    downloadedAt: string;
    ipAddress?: string;
  }>;
}

export function AppManagementPage() {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'versions' | 'upload' | 'notify' | 'stats'>('versions');

  // Upload form state
  const [uploadPlatform, setUploadPlatform] = useState<'android' | 'ios'>('android');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Notification form state
  const [notifyPlatform, setNotifyPlatform] = useState<'android' | 'ios' | 'all'>('android');
  const [notifyVersion, setNotifyVersion] = useState('');
  const [notifyForceUpdate, setNotifyForceUpdate] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesData, statsData] = await Promise.all([
        downloadsApi.listFiles(),
        downloadsApi.getStats(),
      ]);
      
      setFiles(filesData.files || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      await downloadsApi.uploadApp(uploadPlatform, uploadFile);
      alert(`Successfully uploaded ${uploadPlatform} app!`);
      setUploadFile(null);
      loadData();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyVersion) {
      alert('Please enter a version number');
      return;
    }

    try {
      setSending(true);
      const result = await downloadsApi.sendUpdateNotification(notifyPlatform, notifyVersion, notifyForceUpdate);
      
      if (result.success) {
        alert(`Notification sent successfully!\n\nSent: ${result.details?.sentCount || 0}\nFailed: ${result.details?.failedCount || 0}`);
        setNotifyVersion('');
      } else {
        alert(`Failed to send notification: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Notification error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteApp = async (platform: 'android' | 'ios') => {
    if (!confirm(`Are you sure you want to delete the ${platform} app?`)) {
      return;
    }

    try {
      await downloadsApi.deleteApp(platform);
      alert(`${platform} app deleted successfully`);
      loadData();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>App Version Management</h1>
          <p className={styles.subtitle}>Manage app versions, uploads, and push notifications</p>
        </div>
        <button onClick={loadData} className={styles.refreshButton}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('versions')}
          className={`${styles.tab} ${activeTab === 'versions' ? styles.tabActive : ''}`}
        >
          <Smartphone size={18} />
          Current Versions
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`${styles.tab} ${activeTab === 'upload' ? styles.tabActive : ''}`}
        >
          <Upload size={18} />
          Upload App
        </button>
        <button
          onClick={() => setActiveTab('notify')}
          className={`${styles.tab} ${activeTab === 'notify' ? styles.tabActive : ''}`}
        >
          <Bell size={18} />
          Send Notification
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`${styles.tab} ${activeTab === 'stats' ? styles.tabActive : ''}`}
        >
          📊 Statistics
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'versions' && (
          <div className={styles.versionsTab}>
            <h2 className={styles.sectionTitle}>Current Versions</h2>
            <div className={styles.filesGrid}>
              {files.map((file) => (
                <div key={file.platform} className={styles.fileCard}>
                  <div className={styles.fileCardHeader}>
                    <h3 className={styles.fileCardTitle}>
                      {file.platform === 'android' ? '🤖' : '🍎'} {file.platform}
                    </h3>
                    {file.exists ? (
                      <span className={styles.badge + ' ' + styles.badgeSuccess}>Available</span>
                    ) : (
                      <span className={styles.badge + ' ' + styles.badgeDanger}>Not Uploaded</span>
                    )}
                  </div>
                  
                  <div className={styles.fileCardBody}>
                    <div className={styles.fileInfo}>
                      <label>File Name</label>
                      <span>{file.fileName}</span>
                    </div>
                    
                    {file.exists && (
                      <>
                        <div className={styles.fileInfo}>
                          <label>File Size</label>
                          <span>{((file.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        
                        <div className={styles.fileInfo}>
                          <label>Last Modified</label>
                          <span>{new Date(file.lastModified!).toLocaleString()}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteApp(file.platform as 'android' | 'ios')}
                          className={styles.deleteButton}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className={styles.uploadTab}>
            <h2 className={styles.sectionTitle}>Upload New App Version</h2>
            
            <div className={styles.formCard}>
              <form onSubmit={handleFileUpload} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Platform</label>
                  <select
                    value={uploadPlatform}
                    onChange={(e) => setUploadPlatform(e.target.value as 'android' | 'ios')}
                    disabled={uploading}
                    className={styles.select}
                  >
                    <option value="android">Android (.apk)</option>
                    <option value="ios">iOS (.ipa)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>App File</label>
                  <input
                    type="file"
                    accept={uploadPlatform === 'android' ? '.apk' : '.ipa'}
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className={styles.fileInput}
                  />
                  {uploadFile && (
                    <p className={styles.fileInfo}>
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className={styles.alert + ' ' + styles.alertWarning}>
                  <AlertTriangle size={20} />
                  <div>
                    <h3>Important</h3>
                    <p>Before uploading:</p>
                    <ul>
                      <li>Update version numbers in app config</li>
                      <li>Build the app with production settings</li>
                      <li>Ensure the file is signed properly</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className={styles.submitButton}
                >
                  {uploading ? 'Uploading...' : 'Upload App'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'notify' && (
          <div className={styles.notifyTab}>
            <h2 className={styles.sectionTitle}>Send Push Notification</h2>
            
            <div className={styles.formCard}>
              <form onSubmit={handleSendNotification} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Platform</label>
                  <select
                    value={notifyPlatform}
                    onChange={(e) => setNotifyPlatform(e.target.value as any)}
                    disabled={sending}
                    className={styles.select}
                  >
                    <option value="android">Android Users</option>
                    <option value="ios">iOS Users</option>
                    <option value="all">All Users</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Version Number</label>
                  <input
                    type="text"
                    value={notifyVersion}
                    onChange={(e) => setNotifyVersion(e.target.value)}
                    placeholder="e.g., 1.1.0"
                    disabled={sending}
                    className={styles.input}
                  />
                </div>

                <div className={styles.checkbox}>
                  <input
                    type="checkbox"
                    id="forceUpdate"
                    checked={notifyForceUpdate}
                    onChange={(e) => setNotifyForceUpdate(e.target.checked)}
                    disabled={sending}
                  />
                  <label htmlFor="forceUpdate">This is a critical/force update</label>
                </div>

                {notifyForceUpdate && (
                  <div className={styles.alert + ' ' + styles.alertDanger}>
                    <AlertTriangle size={20} />
                    <div>
                      <h3>Force Update Warning</h3>
                      <p>
                        Users will be required to update immediately and cannot use the app until they do.
                        Only use this for critical security or bug fixes.
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.alert + ' ' + styles.alertInfo}>
                  <Info size={20} />
                  <div>
                    <h3>Notification Preview</h3>
                    <p className={styles.previewTitle}>
                      {notifyForceUpdate ? '🚨 Critical Update Required' : '🎉 New Update Available'}
                    </p>
                    <p className={styles.previewMessage}>
                      {notifyForceUpdate
                        ? `Version ${notifyVersion || 'X.X.X'} is now available. Update required to continue using the app.`
                        : `Version ${notifyVersion || 'X.X.X'} is now available with new features and improvements!`}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!notifyVersion || sending}
                  className={styles.submitButton}
                >
                  {sending ? 'Sending...' : 'Send Push Notification'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className={styles.statsTab}>
            <h2 className={styles.sectionTitle}>Download Statistics</h2>
            
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <label>Total Downloads</label>
                <span className={styles.statValue}>{stats.totalDownloads || stats.total}</span>
              </div>

              <div className={styles.statCard}>
                <label>Android Downloads</label>
                <span className={styles.statValue + ' ' + styles.statValueGreen}>
                  {stats.byPlatform?.android || 0}
                </span>
              </div>

              <div className={styles.statCard}>
                <label>iOS Downloads</label>
                <span className={styles.statValue + ' ' + styles.statValueBlue}>
                  {stats.byPlatform?.ios || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
