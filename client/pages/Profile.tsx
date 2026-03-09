import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, User } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Profile: React.FC = () => {
  const { user: authUser, isAuthenticated, updateCurrentUser } = useAuth();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile data
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getCurrentUser();
        setUser(response);
        setFirstName(response.firstName || '');
        setLastName(response.lastName || '');
        setEmail(response.email || '');
      } catch (err) {
        // Fallback to auth context
        if (authUser) {
          setUser(authUser);
          setFirstName(authUser.firstName || '');
          setLastName(authUser.lastName || '');
          setEmail(authUser.email || '');
        } else {
          setProfileMessage({ type: 'error', text: 'Failed to load profile' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadUserProfile();
    }
  }, [isAuthenticated, authUser]);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileMessage({ type: 'error', text: 'First name and last name are required' });
      return;
    }

    try {
      setIsSaving(true);
      setProfileMessage(null);

      const updatedUser = {
        ...user!,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      await apiClient.updateCurrentUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      setUser(updatedUser);
      updateCurrentUser(updatedUser);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save profile';
      setProfileMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Current password is required' });
      return;
    }
    if (!newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation are required' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordMessage(null);

      await apiClient.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Profile</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your profile and security preferences</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{firstName} {lastName}</h2>
                    <p className="text-blue-100">{email}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        First Name
                      </label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Last Name
                      </label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        value={email}
                        disabled
                        className="w-full pl-10 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Message */}
                  {profileMessage && (
                    <div className={cn(
                      'mt-4 p-3 rounded-lg flex items-start gap-3',
                      profileMessage.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    )}>
                      {profileMessage.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm">{profileMessage.text}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6" />

                {/* Change Password Section - Only for local auth */}
                {user?.auth_provider === 'local' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      Change Password
                    </h3>

                    <div className="space-y-4">
                      {/* Current Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full pr-10 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full pr-10 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full pr-10 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Message */}
                      {passwordMessage && (
                        <div className={cn(
                          'p-3 rounded-lg flex items-start gap-3',
                          passwordMessage.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        )}>
                          {passwordMessage.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm">{passwordMessage.text}</p>
                        </div>
                      )}

                      {/* Update Button */}
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="mt-6 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg w-full flex items-center justify-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
