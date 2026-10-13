import React, { useState } from 'react';
import { CommonWordmark } from '../common/CommonWordmark';
import { CommonSymbol } from '../common/CommonSymbol';
import { ConversationConstellation } from '../three/ConversationConstellation';
import { ArrowLeft, ArrowRight, ShieldAlert, Wifi, Server, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { chatServiceManager } from '../../services/chatService';
import { getSavedServerConfig, saveServerConfig } from '../../utils/apiConfig';

interface JoinScreenProps {
  onJoinSuccess: (displayName: string) => void;
  onNavigateHome: () => void;
}

type AuthMode = 'login' | 'register';

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onJoinSuccess,
  onNavigateHome,
}) => {
  const initialConfig = getSavedServerConfig();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [host, setHost] = useState(initialConfig.host || 'localhost');
  const [port, setPort] = useState(String(initialConfig.port || 8080));

  const [errors, setErrors] = useState<{
    general?: string;
    username?: string;
    displayName?: string;
    password?: string;
    confirmPassword?: string;
    port?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      newErrors.username = 'Only letters, numbers, hyphens, and underscores are allowed.';
    }

    if (authMode === 'register') {
      if (!displayName.trim()) {
        newErrors.displayName = 'Display name is required.';
      } else if (displayName.trim().length < 2) {
        newErrors.displayName = 'Display name must be at least 2 characters.';
      }

      if (!password) {
        newErrors.password = 'Password is required.';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    } else {
      if (!password) {
        newErrors.password = 'Password is required.';
      }
    }

    const portNum = Number(port);
    if (!port || isNaN(portNum) || !Number.isInteger(portNum)) {
      newErrors.port = 'Port must be a valid integer.';
    } else if (portNum < 1 || portNum > 65535) {
      newErrors.port = 'Port must be between 1 and 65535.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const portNum = Number(port);
    const targetHost = host.trim() || 'localhost';
    saveServerConfig({ host: targetHost, port: portNum });

    try {
      chatServiceManager.setDemoMode(false);
      const javaService = chatServiceManager.getJavaService();

      if (authMode === 'register') {
        await javaService.register(
          targetHost,
          portNum,
          username.trim(),
          displayName.trim(),
          password,
          confirmPassword
        );
        onJoinSuccess(displayName.trim());
      } else {
        await javaService.login(
          targetHost,
          portNum,
          username.trim(),
          password
        );
        const me = javaService.getCurrentUser();
        onJoinSuccess(me ? me.name : username.trim());
      }
    } catch (err: any) {
      const msg = err.message || 'Connection failed. Please verify the Java server is running on ' + targetHost + ':' + portNum;
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchDemo = async () => {
    setIsSubmitting(true);
    chatServiceManager.setDemoMode(true);
    const mockService = chatServiceManager.getMockService();
    const demoName = displayName.trim() || username.trim() || 'Alex Rivera';
    await mockService.connect({
      host: host.trim() || 'localhost',
      port: Number(port) || 8080,
      displayName: demoName,
    });
    onJoinSuccess(demoName);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] flex flex-col justify-between p-6 md:p-12">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#202522]/10">
        <CommonWordmark onClick={onNavigateHome} symbolSize={22} />
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#777D76] hover:text-[#202522] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to overview</span>
        </button>
      </div>

      {/* Main Split Content */}
      <div className="max-w-6xl mx-auto w-full py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Visual Sculpture & Technical Orientation */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D36C43]" />
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#777D76]">
              LAN Authentication · Step 1
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#202522] tracking-tight leading-tight mb-4">
            {authMode === 'login' ? 'Sign in to your station.' : 'Create your station identity.'}
          </h1>

          <p className="text-sm sm:text-base text-[#202522]/80 leading-relaxed mb-6 max-w-md">
            Connect directly to the central Java server across your subnet. Messages and channels persist in the local database.
          </p>

          {/* Compact Sculpture Visual */}
          <div className="w-full max-w-[340px] aspect-square rounded-2xl bg-[#E5E0D7]/40 border border-[#202522]/10 p-2 relative shadow-xs hidden sm:block">
            <ConversationConstellation />
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-[#777D76]">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-[#294E43]" />
              <span>LAN Subnet</span>
            </span>
            <span className="text-[#202522]/20">/</span>
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#294E43]" />
              <span>Java 21 · Spring Boot</span>
            </span>
          </div>
        </div>

        {/* Right Column: Connection & Account Setup Form */}
        <div className="lg:col-span-6">
          <div className="bg-[#F4F1EB] border border-[#202522]/15 rounded-2xl p-7 sm:p-9 shadow-[0_12px_36px_rgba(32,37,34,0.06)] relative">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-[#202522]/10 mb-6">
              <div className="flex items-center gap-2 p-1 bg-[#E5E0D7]/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrors({});
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#F4F1EB] text-[#202522] shadow-xs'
                      : 'text-[#777D76] hover:text-[#202522]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrors({});
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#F4F1EB] text-[#202522] shadow-xs'
                      : 'text-[#777D76] hover:text-[#202522]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Create Account
                  </span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#294E43] bg-[#E5E0D7] px-2 py-0.5 rounded">
                Real Server Mode
              </span>
            </div>

            {/* General Server Error Banner */}
            {errors.general && (
              <div className="mb-4 p-3 bg-[#D36C43]/10 border border-[#D36C43]/30 rounded-xl text-xs text-[#D36C43] flex items-start gap-2 animate-in fade-in duration-200">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errors.general}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1"
                >
                  Username <span className="text-[#D36C43]">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  placeholder="e.g. alex_rivera"
                  autoFocus
                  className={`w-full bg-[#E5E0D7]/40 border rounded-xl px-4 py-2.5 text-sm text-[#202522] placeholder:text-[#777D76]/70 focus:outline-none transition-colors ${
                    errors.username
                      ? 'border-[#D36C43] bg-[#D36C43]/5'
                      : 'border-[#202522]/20 focus:border-[#294E43]'
                  }`}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-[#D36C43]">{errors.username}</p>
                )}
              </div>

              {/* Display Name Field (Register Mode only) */}
              {authMode === 'register' && (
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1"
                  >
                    Display Name <span className="text-[#D36C43]">*</span>
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: undefined }));
                    }}
                    placeholder="e.g. Alex Rivera (Systems Lab)"
                    className={`w-full bg-[#E5E0D7]/40 border rounded-xl px-4 py-2.5 text-sm text-[#202522] placeholder:text-[#777D76]/70 focus:outline-none transition-colors ${
                      errors.displayName
                        ? 'border-[#D36C43] bg-[#D36C43]/5'
                        : 'border-[#202522]/20 focus:border-[#294E43]'
                    }`}
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-xs text-[#D36C43]">{errors.displayName}</p>
                  )}
                </div>
              )}

              {/* Password Fields */}
              <div className={authMode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1"
                  >
                    Password <span className="text-[#D36C43]">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-[#E5E0D7]/40 border rounded-xl px-4 py-2.5 text-sm text-[#202522] focus:outline-none transition-colors ${
                      errors.password
                        ? 'border-[#D36C43] bg-[#D36C43]/5'
                        : 'border-[#202522]/20 focus:border-[#294E43]'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-[#D36C43]">{errors.password}</p>
                  )}
                </div>

                {authMode === 'register' && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1"
                    >
                      Confirm Password <span className="text-[#D36C43]">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="••••••••"
                      className={`w-full bg-[#E5E0D7]/40 border rounded-xl px-4 py-2.5 text-sm text-[#202522] focus:outline-none transition-colors ${
                        errors.confirmPassword
                          ? 'border-[#D36C43] bg-[#D36C43]/5'
                          : 'border-[#202522]/20 focus:border-[#294E43]'
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-[11px] text-[#D36C43]">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Server Host and Port Split */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="serverHost"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1"
                  >
                    Server Address
                  </label>
                  <input
                    id="serverHost"
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost or 192.168.1.100"
                    className="w-full bg-[#E5E0D7]/40 border border-[#202522]/20 rounded-xl px-4 py-2 text-xs font-mono text-[#202522] focus:outline-none focus:border-[#294E43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="serverPort"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#202522] mb-1"
                  >
                    Port
                  </label>
                  <input
                    id="serverPort"
                    type="text"
                    value={port}
                    onChange={(e) => {
                      setPort(e.target.value);
                      if (errors.port) setErrors((prev) => ({ ...prev, port: undefined }));
                    }}
                    placeholder="8080"
                    className={`w-full bg-[#E5E0D7]/40 border rounded-xl px-4 py-2 text-xs font-mono text-[#202522] focus:outline-none transition-colors ${
                      errors.port
                        ? 'border-[#D36C43] bg-[#D36C43]/5'
                        : 'border-[#202522]/20 focus:border-[#294E43]'
                    }`}
                  />
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 text-sm font-semibold tracking-wide uppercase text-[#F4F1EB] bg-[#294E43] hover:bg-[#1F3C34] active:scale-[0.99] rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{authMode === 'login' ? 'Sign In & Connect' : 'Register & Connect'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Explicit Demo Mode Option (Preserved per Section 1) */}
              <div className="pt-2 border-t border-[#202522]/10 flex items-center justify-between">
                <span className="text-xs text-[#777D76]">Testing without a Java server?</span>
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#294E43] hover:bg-[#E5E0D7] border border-[#294E43]/30 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try Demo Mode</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Information Bar */}
      <div className="max-w-7xl mx-auto w-full pt-6 border-t border-[#202522]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#777D76] gap-2">
        <span>COMMON Communication Studio · LAN Chat Application</span>
        <span>Spring Boot 3.3 · RFC 6455 Native WebSocket</span>
      </div>
    </div>
  );
};
