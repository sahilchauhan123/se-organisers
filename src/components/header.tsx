'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from './icons';
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Swords,
  User as UserIcon,
  Home,
  Menu,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from './ui/sheet';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home', icon: Home, auth: false },
  { href: '/tournaments', label: 'Tournaments', icon: Swords, auth: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
];

export function Header() {
  const { user } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) return null;

  const MobileNav = () => (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left">
        <div className="flex flex-col gap-4 py-6">
          <Link
            href="/"
            className="mb-4 flex items-center space-x-2"
            onClick={() => setIsSheetOpen(false)}
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold whitespace-nowrap">se-organizers</span>
          </Link>

          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              if (link.auth && !user) return null;
              if (isAdminPage) return null;
              return (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}

            {user?.isAdmin && (
              <SheetClose asChild>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              </SheetClose>
            )}

            {!user && (
              <>
                <DropdownMenuSeparator />
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                  >
                    <LogIn className="h-5 w-5" />
                    Login
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/signup"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-lg font-medium hover:bg-accent"
                  >
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </Link>
                </SheetClose>
              </>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center md:px-6">

        {/* LEFT SIDE */}
        <div className="flex flex-1 items-center min-w-0">
          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileNav />
          </div>

          {/* Logo + Text */}
          <Link
            href="/"
            className="ml-2 md:ml-0 flex items-center space-x-2 min-w-0"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold whitespace-nowrap text-base sm:text-lg">
              se-organizers
            </span>
          </Link>
        </div>

        {/* CENTER NAV (DESKTOP) */}
        <nav className="hidden md:flex items-center justify-center gap-6 text-sm">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Home
          </Link>
          <Link href="/tournaments" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Tournaments
          </Link>
          {user && (
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Dashboard
            </Link>
          )}
          {user?.isAdmin && (
            <Link href="/admin" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Admin
            </Link>
          )}
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.username || ''} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>

                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => firebaseAuth.signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>

              {/* Mobile */}
              <div className="sm:hidden">
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
