import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Shield, 
  Clock, 
  Eye, 
  EyeOff, 
  Crown, 
  Settings2,
  Key,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { PasswordFormData, RoleInfo } from "@/hooks/useAccountData";

export function AccountHeader() {
  return <h1 className="text-3xl font-bold tracking-tight">Account</h1>;
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading account information...</p>
      </div>
    </div>
  );
}

export function AccountInfoCard({ 
  user, 
  authUser, 
  roleInfo, 
  formatDate 
}: { 
  user: any;
  authUser: any;
  roleInfo: RoleInfo;
  formatDate: (timestamp: string | null) => string;
}) {
  const getRoleIcon = () => {
    switch (authUser?.role) {
      case "siteAdmin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "venueAdmin":
        return <Shield className="h-4 w-4 text-blue-600" />;
      case "subAdmin":
        return <Settings2 className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </CardTitle>
        <CardDescription>
          Your account details and role information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
              <div className="flex items-center gap-3 mt-1 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.email}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
              <div className="flex items-center gap-3 mt-1 p-3 bg-muted/50 rounded-lg">
                {getRoleIcon()}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{roleInfo.title}</span>
                    <Badge variant={roleInfo.variant} className="text-xs">
                      {authUser?.role || "user"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                <code className="text-xs font-mono break-all text-muted-foreground">
                  {user.uid}
                </code>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
              <div className="flex items-center gap-3 mt-1 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(user.metadata.creationTime || null)}</span>
              </div>
            </div>

            {authUser?.venueId && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Assigned Venue</Label>
                <div className="flex items-center gap-3 mt-1 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">{authUser.venueId}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SecuritySettingsCard({ 
  passwordDialogOpen, 
  setPasswordDialogOpen, 
  passwordForm,
  updatePasswordForm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  handlePasswordUpdate,
  resetPasswordForm,
  getPasswordStrength
}: {
  passwordDialogOpen: boolean;
  setPasswordDialogOpen: (open: boolean) => void;
  passwordForm: PasswordFormData;
  updatePasswordForm: (field: keyof PasswordFormData, value: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  loading: boolean;
  handlePasswordUpdate: () => void;
  resetPasswordForm: () => void;
  getPasswordStrength: (password: string) => { strength: number; label: string; color: string };
}) {
  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Manage your account security and authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Key className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Password</div>
              <div className="text-sm text-muted-foreground">
                Last updated recently
              </div>
            </div>
          </div>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new secure password. 
                  Your new password should be at least 6 characters long.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={e => updatePasswordForm('currentPassword', e.target.value)}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={e => updatePasswordForm('newPassword', e.target.value)}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {passwordForm.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Password strength:</span>
                        <span className={passwordStrength.color}>{passwordStrength.label}</span>
                      </div>
                      <Progress value={passwordStrength.strength} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={e => updatePasswordForm('confirmPassword', e.target.value)}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {passwordForm.confirmPassword && (
                    <div className="flex items-center gap-2 text-sm">
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Security Tips */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Password Security Tips
                      </div>
                      <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                        <li>• Use at least 8 characters</li>
                        <li>• Include uppercase and lowercase letters</li>
                        <li>• Add numbers or special characters</li>
                        <li>• Avoid common words or personal information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    resetPasswordForm();
                    setPasswordDialogOpen(false);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePasswordUpdate} 
                  disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function SignOutCard({ handleSignOut }: { handleSignOut: () => void }) {
  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <LogOut className="h-5 w-5" />
          Sign Out
        </CardTitle>
        <CardDescription>
          End your current session and return to the login page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <div className="font-medium">End Session</div>
              <div className="text-sm text-muted-foreground">
                You'll need to sign in again to access the system
              </div>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-destructive" />
                  Confirm Sign Out
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out? You'll be redirected to the login page and will need to enter your credentials again to access the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleSignOut} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}