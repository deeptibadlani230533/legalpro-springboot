import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, User, Briefcase, LayoutDashboard, Search, FileText 
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Listen for Cmd+K (Mac) or Ctrl+K (Windows)
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search cases, personnel, or settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-slate-400" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/cases")}>
            <Briefcase className="mr-2 h-4 w-4 text-slate-400" />
            <span>Case Directory</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Firm Management">
          <CommandItem onSelect={() => runCommand("/reports")}>
            <FileText className="mr-2 h-4 w-4 text-slate-400" />
            <span>Reports & Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand("/settings")}>
            <Settings className="mr-2 h-4 w-4 text-slate-400" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}