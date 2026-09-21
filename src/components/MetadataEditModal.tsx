import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { SurveyMetadata } from '@/types';

interface MetadataEditModalProps {
  metadata: SurveyMetadata;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SurveyMetadata) => void;
}

export default function MetadataEditModal({
  metadata,
  isOpen,
  onClose,
  onSave,
}: MetadataEditModalProps) {
  const [formData, setFormData] = useState<SurveyMetadata>(metadata);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, isDemo: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Edit Survey Parameters</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Survey ID
            </label>
            <input
              type="text"
              value={formData.surveyId}
              onChange={(e) => setFormData({ ...formData, surveyId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Corridor
            </label>
            <input
              type="text"
              value={formData.corridor}
              onChange={(e) => setFormData({ ...formData, corridor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Frames
              </label>
              <input
                type="number"
                min="1"
                value={formData.frames}
                onChange={(e) =>
                  setFormData({ ...formData, frames: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Swath
              </label>
              <input
                type="text"
                value={formData.swath}
                onChange={(e) => setFormData({ ...formData, swath: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Sensor
            </label>
            <input
              type="text"
              value={formData.sensor}
              onChange={(e) => setFormData({ ...formData, sensor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Origin Coordinates
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
              placeholder="e.g. 18.915°N, 72.87°E"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0066f5] hover:bg-[#0055d4] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check size={14} />
              Save Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
