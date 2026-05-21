import React from "react";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ role, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 py-20">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Briefcase className="w-6 h-6 text-slate-400" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800">
          No cases yet
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Start managing your legal matters by creating your first case.
        </p>
      </div>

      {role === "client" && (
        <Button
          onClick={onCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Case
        </Button>
      )}
    </div>
  );
}