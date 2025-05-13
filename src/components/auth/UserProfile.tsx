import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export function UserProfile() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  if (!user) return null;

  return (
    <div className="border-t pt-4 mt-auto">
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.displayName || 'User'}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="p-2 rounded-md hover:bg-destructive/10 transition-colors duration-200"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4 text-destructive" />
        </button>
      </div>
    </div>
  );
} 