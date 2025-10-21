"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Home } from "lucide-react";

interface HeaderProps {
  collapsed: boolean;
  onShowLanding?: () => void;
  user: any;
}

export function Header({ collapsed, onShowLanding, user }: HeaderProps) {
  const { signOut } = useAuth();

  const getInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 w-full">
      <div className="flex items-center gap-4">
        {onShowLanding && (
          <Button
            variant="ghost"
            onClick={onShowLanding}
            className="flex items-center gap-2 text-gray-600 hover:text-[#8b39ea] transition-colors duration-300 hover:bg-purple-50"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
        )}
        <h1 className="text-2xl font-bold select-none bg-gradient-to-r from-[#8b39ea] to-[#137fc8] bg-clip-text text-transparent">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full transition-transform duration-300 hover:scale-110 hover:shadow-lg"
              aria-label="User menu"
            >
              <Avatar className="h-10 w-10 border-2 border-blue-100">
                <AvatarFallback className="bg-gradient-to-br from-[#8b39ea] to-[#137fc8] text-white font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 transition-colors duration-200">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-red-600 hover:bg-red-100 transition-colors duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}