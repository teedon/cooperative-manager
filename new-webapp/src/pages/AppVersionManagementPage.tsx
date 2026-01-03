import React, { useState, useEffect } from 'react';
import { downloadsApi } from '../api/downloadsApi';
import { useAppSelector } from '../hooks/useAuth';

const AppVersionManagementPage: React.FC = () => {
  const { token } = useAppSelector((state) => state.auth);
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'versions' | 'upload' | 'notify' | 'stats'>('versions');

  // Upload form state
  const [uploadPlatform, setUploadPlatform] = useState<'android' | 'ios'>('android');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Notification form state
  const [notifyPlatform, setNotifyPlatform] = useState<'android' | 'ios' | 'all'>('android');
  const [notifyVersion, setNotifyVersion] = useState('');
  const [notifyForceUpdate, setNotifyForceUpdate] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const [filesData, statsData] = await Promise.all([
        downloadsApi.listFiles(token),
        downloadsApi.getStats(),
      ]);
      
      setFiles(filesData.files || []);
      setStats(statsData);
      
      // Extract version info from stats or files
      // For now, we'll show file info
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !token) {
      alert('File and authentication required');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      await downloadsApi.uploadApp(uploadPlatform, uploadFile, token);

      alert(`Successfully uploaded ${uploadPlatform} app!`);
      setUploadFile(null);
      setUploadProgress(0);
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

    if (!token) {
      alert('Authentication required');
      return;
    }

    try {
      setSending(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/downloads/notify-update/${notifyPlatform}?version=${notifyVersion}&forceUpdate=${notifyForceUpdate}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">App Version Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage app versions, uploads, and push notifications
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'versions', label: 'Current Versions', icon: '📱' },
              { id: 'upload', label: 'Upload App', icon: '⬆️' },
              { id: 'notify', label: 'Send Notification', icon: '🔔' },
              { id: 'stats', label: 'Statistics', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'versions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Current Versions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {files.map((file) => (
                <div key={file.platform} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 capitalize flex items-center">
                        {file.platform === 'android' ? '🤖' : '🍎'} {file.platform}
                      </h3>
                      {file.exists ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Not Uploaded
                        </span>
                      )}
                    </div>
                    
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">File Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{file.fileName}</dd>
                      </div>
                      
                      {file.exists && (
                        <>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">File Size</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </dd>
                          </div>
                          
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(file.lastModified).toLocaleString()}
                            </dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New App Version</h2>
            
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={uploadPlatform}
                    onChange={(e) => setUploadPlatform(e.target.value as 'android' | 'ios')}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={uploading}
                  >
                    <option value="android">Android (.apk)</option>
                    <option value="ios">iOS (.ipa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App File
                  </label>
                  <input
                    type="file"
                    accept={uploadPlatform === 'android' ? '.apk' : '.ipa'}
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    disabled={uploading}
                  />
                  {uploadFile && (
                    <p className="mt-2 text-sm text-gray-500">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {uploading && uploadProgress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Before uploading:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Run <code className="bg-yellow-100 px-1 rounded">npm run bump-version</code> to update versions</li>
                          <li>Build the app with <code className="bg-yellow-100 px-1 rounded">npm run {uploadPlatform}:release</code></li>
                          <li>Ensure the file is signed properly</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload App'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'notify' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Push Notification</h2>
            
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={notifyPlatform}
                    onChange={(e) => setNotifyPlatform(e.target.value as any)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={sending}
                  >
                    <option value="android">Android Users</option>
                    <option value="ios">iOS Users</option>
                    <option value="all">All Users</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version Number
                  </label>
                  <input
                    type="text"
                    value={notifyVersion}
                    onChange={(e) => setNotifyVersion(e.target.value)}
                    placeholder="e.g., 1.1.0"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={sending}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="forceUpdate"
                    checked={notifyForceUpdate}
                    onChange={(e) => setNotifyForceUpdate(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={sending}
                  />
                  <label htmlFor="forceUpdate" className="ml-2 block text-sm text-gray-900">
                    This is a critical/force update
                  </label>
                </div>

                {notifyForceUpdate && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Force Update Warning</h3>
                        <p className="mt-1 text-sm text-red-700">
                          Users will be required to update immediately and cannot use the app until they do.
                          Only use this for critical security or bug fixes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Notification Preview</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p className="font-semibold">
                          {notifyForceUpdate ? '🚨 Critical Update Required' : '🎉 New Update Available'}
                        </p>
                        <p className="mt-1">
                          {notifyForceUpdate
                            ? `Version ${notifyVersion || 'X.X.X'} is now available. Update required to continue using the app.`
                            : `Version ${notifyVersion || 'X.X.X'} is now available with new features and improvements!`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!notifyVersion || sending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Push Notification'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Download Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Downloads</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalDownloads}</dd>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Android Downloads</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">
                    {stats.byPlatform?.find((p: any) => p.platform === 'android')?.count || 0}
                  </dd>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">iOS Downloads</dt>
                  <dd className="mt-1 text-3xl font-semibold text-blue-600">
                    {stats.byPlatform?.find((p: any) => p.platform === 'ios')?.count || 0}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Downloads</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentDownloads?.slice(0, 10).map((download: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {download.platform}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {download.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(download.downloadedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {download.ipAddress || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppVersionManagementPage;
