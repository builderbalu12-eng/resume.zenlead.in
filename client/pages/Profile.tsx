import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, PencilLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, User } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProfileTab = 'account';

export const Profile: React.FC = () => {
  const { user: authUser, isAuthenticated, updateCurrentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = useMemo<ProfileTab>(() => {
    const tab = searchParams.get('tab');
    return 'account';
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [personalMessage, setPersonalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Personal Info - initialize with authUser if available
  const [user, setUser] = useState<User | null>(authUser || null);
  const [firstName, setFirstName] = useState(authUser?.firstName || '');
  const [lastName, setLastName] = useState(authUser?.lastName || '');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Telegram
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramExpanded, setTelegramExpanded] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pollingTelegram, setPollingTelegram] = useState(false);

  // Load user profile on component mount (one time only)
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        setPersonalMessage(null);
        const response = await apiClient.getCurrentUser();
        setUser(response);
        setFirstName(response.firstName || '');
        setLastName(response.lastName || '');
      } catch (err) {
        console.error('Failed to load user profile from API:', err);
        // Fallback to auth context user data if available
        if (authUser) {
          setUser(authUser);
          setFirstName(authUser.firstName || '');
          setLastName(authUser.lastName || '');
          setPersonalMessage(null);
        } else {
          setPersonalMessage({ type: 'error', text: 'Failed to load profile. Please refresh the page.' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && !user) {
      loadUserProfile();
    }
  }, [isAuthenticated]);

  // Load telegram status when account tab is active
  useEffect(() => {
    const loadTelegramStatus = async () => {
      if (activeTab === 'account') {
        try {
          setTelegramLoading(true);
          const status = await apiClient.getTelegramStatus();
          setTelegramLinked(status.linked);
        } catch (err) {
          console.log('Failed to load telegram status');
        } finally {
          setTelegramLoading(false);
        }
      }
    };

    loadTelegramStatus();
  }, [activeTab]);

  // Cleanup blob URL when component unmounts or expanded state changes
  useEffect(() => {
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [qrImageUrl]);

  // Polling for telegram connection
  useEffect(() => {
    if (!pollingTelegram || !telegramExpanded) return;

    const interval = setInterval(async () => {
      try {
        const status = await apiClient.getTelegramStatus();
        if (status.linked) {
          setTelegramLinked(true);
          setPollingTelegram(false);
          setTelegramExpanded(false);
          setTelegramMessage({ type: 'success', text: 'Telegram connected successfully!' });
          setTimeout(() => setTelegramMessage(null), 3000);
        }
      } catch (err) {
        // Keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pollingTelegram, telegramExpanded]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // no-op: profile no longer loads billing/payment data
      } catch (err) {
        // ignore
      } finally {
        // ignore
      }
    };

    loadData();
  }, [activeTab, isAuthenticated]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setPersonalMessage(null);

      const response = await apiClient.updateCurrentUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      const updatedUser = {
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      setUser(updatedUser);
      updateCurrentUser(updatedUser);

      setPersonalMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setPersonalMessage(null), 3000);
    } catch (err) {
      setPersonalMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordMessage(null);

      await apiClient.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update password';
      if (errorMsg.includes('401') || errorMsg.includes('Current password')) {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
      } else {
        setPasswordMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleConnectTelegram = async () => {
    try {
      setTelegramLoading(true);
      setTelegramMessage(null);

      // Fetch QR code
      const blob = await apiClient.getTelegramQR();
      const url = URL.createObjectURL(blob);
      setQrImageUrl(url);

      // Fetch link
      const linkResponse = await apiClient.getTelegramLink();
      setTelegramLink(linkResponse.link);

      setTelegramExpanded(true);
      setPollingTelegram(true);
    } catch (err) {
      setTelegramMessage({ type: 'error', text: 'Failed to load Telegram connection' });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect Telegram?\nYou will stop receiving notifications.'
    );

    if (!confirmed) return;

    try {
      setTelegramLoading(true);
      await apiClient.disconnectTelegram();
      setTelegramLinked(false);
      setTelegramMessage({ type: 'success', text: 'Telegram disconnected successfully' });
      setTimeout(() => setTelegramMessage(null), 3000);
    } catch (err) {
      setTelegramMessage({ type: 'error', text: 'Failed to disconnect Telegram' });
    } finally {
      setTelegramLoading(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', icon: PencilLine },
  ];

  // Get user initials for avatar
  const getInitials = (first: string, last: string) => {
    const f = first?.charAt(0)?.toUpperCase() || '';
    const l = last?.charAt(0)?.toUpperCase() || '';
    return `${f}${l}`;
  };

  if (!isAuthenticated || !authUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Profile</h1>
        <p className="text-slate-600 dark:text-slate-400">Please sign in to view your profile and billing details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Profile</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your workspace, personal details, security, and Telegram notifications.
          </p>
        </div>

        {isLoading && !user ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-500" />
          </div>
        ) : (
          user && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Card 1 — Workspace Settings */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                  🏢 Workspace Settings
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white">
                    {getInitials(authUser.firstName, authUser.lastName) || "?"}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {authUser.firstName} {authUser.lastName}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{authUser.email}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Credits available: {authUser.credits}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 — Personal Information */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  👤 Personal Information
                </p>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Update your basic details
                </h2>
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">First name</p>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-[8px] px-[14px] py-[10px]"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Last name</p>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-[8px] px-[14px] py-[10px]"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Email</p>
                  <Input
                    value={user.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-[8px] px-[14px] py-[10px] bg-slate-100 text-slate-600 opacity-60 dark:bg-slate-800 dark:text-slate-400"
                  />
                </div>

                {personalMessage && (
                  <div
                    className={cn(
                      "mb-4 rounded-[8px] border p-[10px] text-sm font-medium",
                      personalMessage.type === "success"
                        ? "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]"
                        : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
                    )}
                  >
                    {personalMessage.text}
                  </div>
                )}

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="rounded-[8px] bg-[#7c3aed] px-[20px] py-[10px] text-white hover:bg-[#6d28d9]"
                >
                  {isSaving ? "Saving..." : "Save profile"}
                </Button>
              </div>

              {/* Card 3 — Change Password (hidden for Google auth) */}
              {user.auth_provider !== "google" && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    🔒 Change Password
                  </p>
                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                    Keep your account secure
                  </h2>

                  <div className="mb-4 space-y-4">
                    {/* Current Password */}
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</p>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-[8px] px-[14px] py-[10px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">New Password</p>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-[8px] px-[14px] py-[10px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</p>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-[8px] px-[14px] py-[10px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passwordMessage && (
                    <div
                      className={cn(
                        "mb-4 rounded-[8px] border p-[10px] text-sm font-medium",
                        passwordMessage.type === "success"
                          ? "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]"
                          : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
                      )}
                    >
                      {passwordMessage.text}
                    </div>
                  )}

                  <Button
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword}
                    variant="outline"
                    className="rounded-[8px] border-[1.5px] border-current bg-transparent px-[20px] py-[10px] text-[#7c3aed]"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              )}

              {/* Card 4 — Telegram Connection */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  📱 Telegram Connection
                </p>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Get job and resume alerts on Telegram
                </h2>

                {telegramLinked ? (
                  <>
                    <div className="mb-4 rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] p-4">
                      <p className="font-medium text-[#16a34a]">✅ Telegram Connected</p>
                      <p className="mt-1 text-sm text-[#16a34a] opacity-80">
                        You will receive job alerts and resume files here.
                      </p>
                    </div>
                    <Button
                      onClick={handleDisconnectTelegram}
                      disabled={telegramLoading}
                      variant="outline"
                      className="rounded-[8px] border-[1.5px] border-red-600 bg-transparent px-[20px] py-[10px] text-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      {telegramLoading ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 rounded-[8px] bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <p className="mb-2 font-medium">Connect Telegram to receive:</p>
                      <p>🎯 Job match alerts instantly</p>
                      <p>📄 Tailored resume PDF files</p>
                      <p>🔔 Application update notifications</p>
                    </div>

                    {!telegramExpanded ? (
                      <Button
                        onClick={handleConnectTelegram}
                        disabled={telegramLoading}
                        className="rounded-[8px] bg-blue-600 px-[20px] py-[10px] text-white hover:bg-blue-700"
                      >
                        {telegramLoading ? "Loading..." : "Connect Telegram"}
                      </Button>
                    ) : (
                      <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                        <h4 className="mb-4 text-center font-semibold text-slate-900 dark:text-white">
                          Scan QR or click the link
                        </h4>

                        {qrImageUrl && (
                          <div className="mb-6 flex flex-col items-center">
                            <img
                              src={qrImageUrl}
                              alt="Telegram QR Code"
                              width="180"
                              height="180"
                              className="rounded-[12px] border-2 border-slate-300 dark:border-slate-600"
                            />
                          </div>
                        )}

                        <div className="my-4 flex items-center gap-3">
                          <div className="flex-1 border-t border-slate-300 dark:border-slate-600" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">OR</span>
                          <div className="flex-1 border-t border-slate-300 dark:border-slate-600" />
                        </div>

                        {telegramLink && (
                          <div className="mb-4 flex justify-center">
                            <Button
                              onClick={() => window.open(telegramLink, "_blank")}
                              variant="outline"
                              className="rounded-[8px] border-[1.5px] border-blue-600 bg-transparent px-[20px] py-[10px] text-blue-600"
                            >
                              Open Telegram →
                            </Button>
                          </div>
                        )}

                        <div className="mx-auto max-w-[250px] text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                          <p>1. Scan QR or tap Open Telegram</p>
                          <p>2. Press START in the Telegram bot</p>
                          <p>3. This page will update automatically</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {telegramMessage && (
                  <div
                    className={cn(
                      "mt-4 rounded-[8px] border p-[10px] text-sm font-medium",
                      telegramMessage.type === "success"
                        ? "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]"
                        : "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
                    )}
                  >
                    {telegramMessage.text}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
