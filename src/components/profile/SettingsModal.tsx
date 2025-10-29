'use client';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Mail } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/landing');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account and session details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">
                Email
              </span>
              <span className="text-base font-semibold">{user?.email}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
