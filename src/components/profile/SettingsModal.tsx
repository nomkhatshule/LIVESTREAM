
'use client';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditProfileClick: () => void;
  onAccountClick: () => void;
}

export default function SettingsModal({ open, onOpenChange, onEditProfileClick, onAccountClick }: SettingsModalProps) {
  const auth = useAuth();
  const router = useRouter();
  
  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/landing');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, account, and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 flex flex-col gap-1">
           <Button variant="ghost" className="w-full justify-start text-base py-6" onClick={onEditProfileClick}>
             <User className="mr-3 h-5 w-5" />
             Edit Profile
           </Button>
           <Button variant="ghost" className="w-full justify-start text-base py-6" onClick={onAccountClick}>
             <Mail className="mr-3 h-5 w-5" />
             Account
           </Button>
        </div>
        <Separator />
        <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full justify-center text-base py-6"
        >
            <LogOut className="mr-3 h-5 w-5" />
            Log Out
        </Button>
      </DialogContent>
    </Dialog>
  );
}
