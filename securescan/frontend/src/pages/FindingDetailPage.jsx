import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';

export default function FindingDetailPage() {
  const { scanId, findingId } = useParams();
  const navigate = useNavigate();

  const [finding, setFinding] = useState(null);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedTab, setCopiedTab] = useState(false);
  const [activeTab, setActiveTab] = useState('nginx');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scanRes, findingsRes] = await Promise.all([
          api.get(`/api/scans/${scanId}`),
          api.get(`/api/scans/${scanId}/findings`),
        ]);
        setScan(scanRes.data);
        const match = findingsRes.data.findings.find(
          (f) => f.id === findingId || f.check_id === findingId
        );
        setFinding(match || findingsRes.data.findings[0] || null);
      } catch (err) {
        console.error('Failed to load finding details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [scanId, findingId]);

  const remediationSnippets = {
    nginx: `# Nginx Web Server Configuration
# Add inside your server {} or location / {} block:

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
server_tokens off;`,

    apache: `# Apache HTTP Server Configuration (.htaccess / httpd.conf)
# Requires mod_headers.c enabled:

<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
ServerSignature Off
ServerTokens Prod`,

    fastapi: `# Python FastAPI / Starlette Security Middleware
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self';"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)`,

    cloudflare: `# Cloudflare Transform Rules (HTTP Response Header Modification)
# Rule action: Set static response headers

Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin`,

    express: `// Node.js Express with Helmet Security Middleware
const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(
  helmet({
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);`,

    caddy: `# Caddyfile HTTP Server Configuration
example.com {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
    reverse_proxy localhost:8080
}`,
  };

  const handleCopySnippet = (snippet) => {
    navigator.clipboard?.writeText(snippet);
    setCopiedTab(true);
    setTimeout(() => setCopiedTab(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-slate-500 font-medium">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading finding details...</span>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <p className="text-xs text-slate-500 font-medium">Finding not found.</p>
        <button
          type="button"
          onClick={() => navigate(`/scans/${scanId}`)}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          Return to Scan Results
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Top Header & Navigation */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate(`/scans/${scanId}`)}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
          title="Back to scan results"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Check:</span>
            <span className="font-mono text-xs text-indigo-700 font-bold">{finding.check_id}</span>
          </div>
          <h1 className="font-sans font-bold text-lg text-slate-900">
            {finding.title}
          </h1>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Finding Meta & Details (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Finding Core Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <SeverityBadge severity={finding.severity} size="md" />
                <span className="text-xs text-slate-500 font-medium">
                  Category: <span className="text-slate-900 font-semibold">{finding.category?.toUpperCase()}</span>
                </span>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Points: <span className="text-indigo-600 font-bold">{finding.points_earned}</span> / {finding.points_possible}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-900 block mb-1.5">
                Description & Vulnerability Analysis
              </span>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {finding.description}
              </p>
            </div>

            {finding.details && (
              <div>
                <span className="text-xs font-semibold text-slate-900 block mb-1.5">
                  Observed Evidence & Headers
                </span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-indigo-950 break-all">
                  {finding.details}
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <span className="text-xs font-bold text-indigo-900 block mb-1">
                Remediation Recommendation
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {finding.recommendation || 'Apply the recommended configuration directives below.'}
              </p>
            </div>
          </div>

          {/* Actionable Code Remediation Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="font-sans font-bold text-sm text-slate-900">
                  Ready-to-Use Code Snippets
                </span>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {['nginx', 'apache', 'fastapi', 'express', 'caddy', 'cloudflare'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => handleCopySnippet(remediationSnippets[activeTab])}
                className="absolute right-3 top-3 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 z-10 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedTab ? 'Copied' : 'Copy'}</span>
              </button>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto shadow-xs">
                {remediationSnippets[activeTab]}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: References & Compliance Mapping (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="font-sans font-bold text-sm text-slate-900">
                Standards Alignment
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">OWASP Top 10</span>
                <span className="text-slate-900 font-medium">A05:2021 Security Misconfiguration</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">CWE Mapping</span>
                <span className="text-slate-900 font-medium">CWE-693: Protection Mechanism Failure</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">NIST SP 800-53</span>
                <span className="text-slate-900 font-medium">SC-8 Transmission Confidentiality</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">OWASP ASVS</span>
                <span className="text-slate-900 font-medium">V14.4 HTTP Security Headers</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">
              Verification Notice:
            </span>
            After deploying these configuration changes on your web server, run a quick re-evaluation scan to verify the updated security grade.
          </div>
        </div>
      </div>
    </div>
  );
}
