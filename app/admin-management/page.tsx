"use client";

import RequireAuth from "@/components/require-auth";
import { useAdminManagement } from "@/hooks/useAdminManagement";
import {
  AdminManagementHeader,
  CreateAdminForm,
  AdminsTable,
  LoadingSkeleton,
  AccessDenied
} from "@/components/adminmanagement/AdminManagementComponents";

function AdminManagementPageContent() {
  const {
    user,
    authLoading,
    loading,
    admins,
    venues,
    createAdmin,
    deleteAdmin,
    updateAdmin
  } = useAdminManagement();

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied for users who are not siteAdmin
  if (!user || user.role !== "siteAdmin") {
    return <AccessDenied />;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminManagementHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CreateAdminForm 
            venues={venues}
            onCreateAdmin={createAdmin}
          />
        </div>
        
        <div className="lg:col-span-2">
          <AdminsTable 
            admins={admins}
            venues={venues}
            onDeleteAdmin={deleteAdmin}
            onUpdateAdmin={updateAdmin}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminManagementPage() {
  return (
    <RequireAuth>
      <AdminManagementPageContent />
    </RequireAuth>
  );
}