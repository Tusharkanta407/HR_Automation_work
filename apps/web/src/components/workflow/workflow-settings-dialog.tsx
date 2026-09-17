"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, X } from "lucide-react";

type WorkflowSettingsDialogProps = {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
};

export default function WorkflowSettingsDialog({
  open,
  currentName,
  onClose,
  onSave,
}: WorkflowSettingsDialogProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001d3d]/30 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[rgba(0,29,61,0.08)] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#f0fdfa] text-[#0d9488] flex items-center justify-center border border-[rgba(20,184,166,0.2)]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001d3d]">
                Workflow Details
              </h3>
              <p className="text-xs text-slate-500">Name and categorize your automation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Employee Onboarding Flow"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#001d3d] focus:ring-2 focus:ring-[#14b8a6] focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs rounded-xl shadow-xs"
            >
              Save Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
