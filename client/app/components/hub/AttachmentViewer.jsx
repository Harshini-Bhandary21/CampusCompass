'use client';

import { useState } from 'react';
import { FileText, File, Download, X } from 'lucide-react';

export default function AttachmentViewer({ attachments }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  if (!attachments || attachments.length === 0) return null;

  const handleDownload = (att) => {
    const link = document.createElement('a');
    link.href = att.data;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attachments.map((att, idx) => (
          <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
            {att.type === 'image' ? (
              <img
                src={att.data}
                alt={att.name}
                className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxSrc(att.data)}
              />
            ) : (
              <button
                type="button"
                onClick={() => handleDownload(att)}
                className="w-full h-24 flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 transition-colors p-2"
              >
                <div className="text-gray-500">
                  {att.type === 'pdf' ? <FileText size={26} /> : <File size={26} />}
                </div>
                <span className="text-[11px] text-gray-700 truncate max-w-full">{att.name}</span>
                <Download size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-8"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
