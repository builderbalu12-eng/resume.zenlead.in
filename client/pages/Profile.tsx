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


  // Job Preferences
  const [jobPrefs, setJobPrefs] = useState({
    desired_role: '',
    preferred_location: '',
    work_type: 'any',
    preferred_sites: ['indeed', 'linkedin', 'google'] as string[],
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        // Load job preferences
        try {
          const prefsRes = await apiClient.getJobPreferences();
          if (prefsRes?.job_preferences) setJobPrefs(prefsRes.job_preferences);
        } catch (_) {}
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

  const handleSavePreferences = async () => {
    try {
      setIsSavingPrefs(true);
      setPrefsMessage(null);
      await apiClient.updateJobPreferences(jobPrefs);
      setPrefsMessage({ type: 'success', text: 'Job preferences saved!' });
      setTimeout(() => setPrefsMessage(null), 3000);
    } catch (err) {
      setPrefsMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsSavingPrefs(false);
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">

              {/* LEFT — Profile + Change Password in one card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {/* Avatar strip */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-base font-bold text-white">
                    {getInitials(authUser.firstName, authUser.lastName) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{authUser.firstName} {authUser.lastName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{authUser.email}</p>
                  </div>
                </div>

                {/* Personal info form */}
                <div className="px-6 py-5 space-y-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personal Information</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">First name</p>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Last name</p>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Email</p>
                    <Input value={user.email} disabled className="cursor-not-allowed bg-slate-100 text-slate-500 opacity-70 dark:bg-slate-800 dark:text-slate-400" />
                  </div>
                  {personalMessage && (
                    <div className={cn("rounded-lg border px-4 py-2.5 text-sm font-medium",
                      personalMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )}>
                      {personalMessage.text}
                    </div>
                  )}
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white">
                    {isSaving ? "Saving..." : "Save profile"}
                  </Button>
                </div>

                {/* Change password — only for non-Google users */}
                {user.auth_provider !== "google" && (
                  <div className="px-6 py-5 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Change Password</p>
                    {[
                      { label: "Current Password", value: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
                      { label: "New Password", value: newPassword, setter: setNewPassword, show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                      { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
                    ].map(({ label, value, setter, show, toggle }) => (
                      <div key={label}>
                        <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                        <div className="relative">
                          <Input type={show ? "text" : "password"} value={value} onChange={(e) => setter(e.target.value)} />
                          <button type="button" onClick={toggle} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {passwordMessage && (
                      <div className={cn("rounded-lg border px-4 py-2.5 text-sm font-medium",
                        passwordMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {passwordMessage.text}
                      </div>
                    )}
                    <Button onClick={handleChangePassword} disabled={isUpdatingPassword} variant="outline" className="border-[#7c3aed] text-[#7c3aed] hover:bg-purple-50">
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                )}
              </div>

              {/* RIGHT — Telegram + Account Overview */}
              <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                  <p className="font-semibold text-slate-900 dark:text-white">Telegram Notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receive job and resume alerts on Telegram</p>
                </div>
                <div className="px-6 py-5">
                  {telegramLinked ? (
                    <>
                      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                        <p className="font-medium text-green-700 dark:text-green-400">✅ Telegram Connected</p>
                        <p className="mt-1 text-sm text-green-600 dark:text-green-500">You will receive job alerts and resume files here.</p>
                      </div>
                      <Button onClick={handleDisconnectTelegram} disabled={telegramLoading} variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50">
                        {telegramLoading ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 space-y-1">
                        <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Connect to receive:</p>
                        <p>🎯 Job match alerts instantly</p>
                        <p>📄 Tailored resume PDF files</p>
                        <p>🔔 Application update notifications</p>
                      </div>
                      {!telegramExpanded ? (
                        <Button onClick={handleConnectTelegram} disabled={telegramLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                          {telegramLoading ? "Loading..." : "Connect Telegram"}
                        </Button>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                          <h4 className="mb-4 text-center font-semibold text-slate-900 dark:text-white">Scan QR or click the link</h4>
                          {qrImageUrl && (
                            <div className="mb-4 flex justify-center">
                              <img src={qrImageUrl} alt="Telegram QR Code" width="160" height="160" className="rounded-xl border-2 border-slate-300 dark:border-slate-600" />
                            </div>
                          )}
                          <div className="my-3 flex items-center gap-3">
                            <div className="flex-1 border-t border-slate-300 dark:border-slate-600" />
                            <span className="text-xs text-slate-500">OR</span>
                            <div className="flex-1 border-t border-slate-300 dark:border-slate-600" />
                          </div>
                          {telegramLink && (
                            <div className="mb-3 flex justify-center">
                              <Button onClick={() => window.open(telegramLink, "_blank")} variant="outline" className="border-blue-600 text-blue-600">Open Telegram →</Button>
                            </div>
                          )}
                          <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                            <p>1. Scan QR or tap Open Telegram</p>
                            <p>2. Press START in the bot</p>
                            <p>3. Page updates automatically</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {telegramMessage && (
                    <div className={cn("mt-4 rounded-lg border px-4 py-2.5 text-sm font-medium",
                      telegramMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )}>
                      {telegramMessage.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Overview card */}
              <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                  <p className="font-semibold text-slate-900 dark:text-white">Account Overview</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your credits and plan at a glance</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Available Credits</span>
                    <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{authUser.credits ?? 0}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/billing'}>
                      💳 View Billing &amp; Payments
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/billing#credits'}>
                      📊 Credit Activity
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/pricing'}>
                      🚀 Upgrade Plan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Job Preferences card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                  <p className="font-semibold text-slate-900 dark:text-white">Job Preferences</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Used by the daily job feed to pre-fill relevant jobs for you</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Desired Role</p>
                      <Input
                        placeholder="e.g. Senior AI Engineer"
                        value={jobPrefs.desired_role}
                        onChange={(e) => setJobPrefs(p => ({ ...p, desired_role: e.target.value }))}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Location</p>
                      <Input
                        placeholder="e.g. Delhi, India"
                        value={jobPrefs.preferred_location}
                        onChange={(e) => setJobPrefs(p => ({ ...p, preferred_location: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Work Type</p>
                    <div className="flex gap-4">
                      {[
                        { label: 'Any', value: 'any' },
                        { label: 'Remote', value: 'remote' },
                        { label: 'On-site', value: 'on-site' },
                      ].map(({ label, value }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="job_work_type"
                            checked={jobPrefs.work_type === value}
                            onChange={() => setJobPrefs(p => ({ ...p, work_type: value }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Job Sites</p>
                    <div className="flex flex-wrap gap-3">
                      {['indeed', 'linkedin', 'google'].map(site => (
                        <label key={site} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={jobPrefs.preferred_sites.includes(site)}
                            onChange={() => setJobPrefs(p => ({
                              ...p,
                              preferred_sites: p.preferred_sites.includes(site)
                                ? p.preferred_sites.filter(s => s !== site)
                                : [...p.preferred_sites, site],
                            }))}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{site}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {prefsMessage && (
                    <div className={cn("rounded-lg border px-4 py-2.5 text-sm font-medium",
                      prefsMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )}>
                      {prefsMessage.text}
                    </div>
                  )}
                  <Button onClick={handleSavePreferences} disabled={isSavingPrefs} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white">
                    {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>

              </div>

            </div>
          )
        )}
      </div>
    </div>
  );
};
