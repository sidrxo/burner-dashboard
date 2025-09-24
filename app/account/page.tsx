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
    <div className="w-full min-h-screen">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <AccountHeader />
          
          <div className="w-full max-w-4xl mx-auto space-y-6">
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