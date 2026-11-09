import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Key,
  Shield,
  Terminal,
  Copy,
  Trash2,
  CheckCircle,
  Save,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || user?.username || 'Security Analyst');
  const [email] = useState(user?.email || 'analyst@securescan.internal');
  const [timeout, setTimeoutVal] = useState(10);
  const [maxRedirects, setMaxRedirects] = useState(5);
  const [userAgent, setUserAgent] = useState('SecureScan/1.0 (Passive Security Assessment)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // API Tokens
  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key_live_9f81a7b',
      name: 'CI/CD Pipeline Integration',
      created: '2026-10-18',
      lastUsed: '12m ago',
    },
  ]);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleGenerateKey = () => {
    const randomHex = Math.random().toString(16).slice(2, 10);
    const newKey = {
      id: `key_sec_${randomHex}`,
      name: `Automation Token #${apiKeys.length + 1}`,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const handleRevokeKey = (id) => {
    if (window.confirm('Revoke this API Key immediately?')) {
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    }
  };

  const handleCopyKey = (keyId) => {
    navigator.clipboard?.writeText(keyId);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="font-sans font-bold text-xl text-slate-900 tracking-tight">
            Account & Scanner Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure scanner timeout policies, CI/CD API credentials, and platform options.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/customization"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>UI & Customization</span>
          </Link>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Settings Saved</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & Scanner Preferences (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* User Profile Card */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="font-sans font-bold text-sm text-slate-900">
                User Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Account Role:</span>
              <span className="text-indigo-700 font-semibold">Security Analyst (Full Scan & Export Access)</span>
            </div>
          </section>

          {/* Scanner Preferences */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h2 className="font-sans font-bold text-sm text-slate-900">
                Scanning Preferences
              </h2>
            </div>

            <form onSubmit={handleSavePreferences} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    HTTP Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={timeout}
                    onChange={(e) => setTimeoutVal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Max Redirect Hops
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxRedirects}
                    onChange={(e) => setMaxRedirects(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Scanner User-Agent Header
                </label>
                <input
                  type="text"
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: API Keys (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="api">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <h2 className="font-sans font-bold text-sm text-slate-900">
                  API Keys & Automation
                </h2>
              </div>
              <button
                type="button"
                onClick={handleGenerateKey}
                className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-colors"
              >
                + New Key
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Use API tokens to trigger automated scans from GitHub Actions or internal CI/CD pipelines.
            </p>

            <div className="flex flex-col gap-2.5">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      {k.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRevokeKey(k.id)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-medium"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs text-indigo-900 bg-white p-2 rounded-md border border-slate-200">
                    <span>{k.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(k.id)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-sans font-medium"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === k.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                    <span>Created: {k.created}</span>
                    <span>Last used: {k.lastUsed}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-900 block mb-1">Example curl request:</span>
              <code className="text-xs text-slate-800 block bg-white border border-slate-200 p-2.5 rounded-md font-mono mt-1">
                curl -X POST https://api.securescan.internal/api/scans \ <br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer key_live_...&quot; \ <br />
                &nbsp;&nbsp;-d &apos;&#123;&quot;target_url&quot;: &quot;https://example.com&quot;&#125;&apos;
              </code>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
