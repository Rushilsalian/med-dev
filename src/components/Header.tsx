import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, Stethoscope, LogOut, User, MessageCircle, Menu, Download, Users, Trophy, Search } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import AvatarSelector from '@/components/AvatarSelector';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const { user, signOut } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '👨⚕️');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAvatarSelect = (avatar: string) => {
    setUserAvatar(avatar);
    localStorage.setItem('userAvatar', avatar);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Doc Hangout
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/communities" className="text-foreground/80 hover:text-foreground transition-colors">
                Communities
              </Link>
              <Link to="/collaborate" className="text-foreground/80 hover:text-foreground transition-colors">
                Collaborate
              </Link>
              <Link to="/messages" className="text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                Messages
              </Link>
              <Link to="/leaderboard" className="text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link to="/search" className="text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1">
                <Search className="h-4 w-4" />
                Search
              </Link>
            </>
          ) : (
            <>
              <Link to="/about" className="text-foreground/80 hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/safety" className="text-foreground/80 hover:text-foreground transition-colors">
                Safety
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <Button variant="outline" size="sm" onClick={installApp} className="hidden sm:flex">
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
          )}
          
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">{userAvatar}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-32">
                    {user.user_metadata?.display_name || user.email}
                  </span>
                  <AvatarSelector currentAvatar={userAvatar} onSelect={handleAvatarSelect} />
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              
              {/* Mobile Avatar */}
              <Avatar className="h-8 w-8 sm:hidden">
                <AvatarFallback className="text-sm">{userAvatar}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Join Hangout</span>
                </Button>
              </Link>
            </>
          )}
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                {user && (
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{userAvatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.user_metadata?.display_name || user.email}
                      </span>
                      <AvatarSelector currentAvatar={userAvatar} onSelect={handleAvatarSelect} />
                    </div>
                  </div>
                )}
                
                {user ? (
                  <>
                    <Link to="/communities" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Users className="h-5 w-5" />
                      Communities
                    </Link>
                    <Link to="/collaborate" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <MessageCircle className="h-5 w-5" />
                      Collaborate
                    </Link>
                    <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <MessageCircle className="h-5 w-5" />
                      Messages
                    </Link>
                    <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Trophy className="h-5 w-5" />
                      Leaderboard
                    </Link>
                    <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <Search className="h-5 w-5" />
                      Search
                    </Link>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <User className="h-5 w-5" />
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                      <User className="h-5 w-5" />
                      About
                    </Link>
                  </>
                )}
                <Link to="/safety" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                  <Stethoscope className="h-5 w-5" />
                  Safety
                </Link>
                <Link to="/safety" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 rounded hover:bg-secondary">
                  <Stethoscope className="h-5 w-5" />
                  Safety
                </Link>
                
                {isInstallable && (
                  <Button onClick={installApp} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </Button>
                )}
                
                {user ? (
                  <Button variant="outline" onClick={signOut} className="mt-4">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="mt-4 w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;