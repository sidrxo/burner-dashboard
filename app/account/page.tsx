"use client";

import RequireAuth from "@/components/require-auth";
import { useAccountData } from "@/hooks/useAccountData";
import {
  AccountHeader,
  LoadingState,
  AccountInfoCard,
  SecuritySettingsCard,
  SignOutCard
} from "@/components/account/AccountComponents";

function AccountPageContent() {
  const {
    user,
    authUser,
    passwordForm,
    loading,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordDialogOpen,
    setPasswordDialogOpen,
    handlePasswordUpdate,
    handleSignOut,
    resetPasswordForm,
    updatePasswordForm,
    formatDate,
    getRoleInfo,
    getPasswordStrength
  } = useAccountData();

  const roleInfo = getRoleInfo();

  if (!user) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AccountHeader />
      
      <div className="max-w-4xl space-y-6">
        <AccountInfoCard 
          user={user}
          authUser={authUser}
          roleInfo={roleInfo}
          formatDate={formatDate}
        />

        <SecuritySettingsCard 
          passwordDialogOpen={passwordDialogOpen}
          setPasswordDialogOpen={setPasswordDialogOpen}
          passwordForm={passwordForm}
          updatePasswordForm={updatePasswordForm}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          loading={loading}
          handlePasswordUpdate={handlePasswordUpdate}
          resetPasswordForm={resetPasswordForm}
          getPasswordStrength={getPasswordStrength}
        />

        <SignOutCard handleSignOut={handleSignOut} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountPageContent />
    </RequireAuth>
  );
}