import React, { useState } from 'react';
import { X, FileText, User, Calendar, Clock, Package, Briefcase, Download } from 'lucide-react';
import { type TechnicianReport } from '../../types';
import { generateDetailedReport } from '../../utils/pdfGenerator';

interface ReportDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: TechnicianReport | null;
}

export const ReportDetailDialog: React.FC<ReportDetailDialogProps> = ({
  isOpen,
  onClose,
  report
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !report) return null;

  const handleExportPDF = async () => {
    setIsGenerating(true);
    await generateDetailedReport(report);
    setIsGenerating(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getRoleColor = (role: string) => {
    return role === 'technician' 
      ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' }
      : { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' };
  };

  const roleColors = getRoleColor(report.roleType);

  return (
    <>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-5 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Report Details</h2>
                <p className="text-sm text-gray-600">ID: {report.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={isGenerating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Export PDF'}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Report Type Badge */}
            <div className={`${roleColors.bg} ${roleColors.border} border rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className={`w-5 h-5 ${roleColors.text}`} />
                  <span className={`text-lg font-semibold ${roleColors.text}`}>
                    {report.roleType === 'technician' ? 'Technician Report' : 'Quality Inspector Report'}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors.bg} ${roleColors.text} border ${roleColors.border}`}>
                  {report.roleType.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Job Order</div>
                    <div className="font-mono font-semibold text-gray-800">{report.jobOrderCode}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Device Serial</div>
                    <div className="font-mono font-semibold text-gray-800">{report.deviceSerial}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Operation</div>
                    <div className="font-semibold text-gray-800">{report.operationName}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Author</div>
                    <div className="font-semibold text-gray-800">{report.technicianName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Submitted</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(report.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-800">{formatDuration(report.actualTimeSeconds)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Timeline */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Work Timeline</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Start Time</div>
                  <div className="font-medium text-gray-800">{report.startTime}</div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-blue-200 rounded-full relative">
                    <div className="absolute inset-0 bg-blue-600 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">End Time</div>
                  <div className="font-medium text-gray-800">{report.endTime}</div>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Report Content</h3>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{report.content}</p>
              </div>
            </div>

            {/* Quantity Info */}
            {report.quantity > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Quantity Processed: {report.quantity} unit(s)</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};