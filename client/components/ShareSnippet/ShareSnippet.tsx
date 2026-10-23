"use client";
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { FaQrcode, FaLink, FaCopy, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

interface ShareSnippetProps {
  snippetId: string;
  snippetTitle: string;
}

const ShareSnippet: React.FC<ShareSnippetProps> = ({ snippetId, snippetTitle }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    // Generate the shareable URL
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/snippet/${snippetId}`;
    setShareUrl(url);
  }, [snippetId]);

  const generateQRCode = async () => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/snippet/${snippetId}`;
      
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#7263F3",
          light: "#FFFFFF"
        }
      });
      
      setQrCodeDataUrl(qrDataUrl);
      setShowQRModal(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: snippetTitle,
          text: `Check out this code snippet: ${snippetTitle}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to copy to clipboard
        await copyToClipboard();
      }
    } else {
      // Fallback to copy to clipboard
      await copyToClipboard();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={generateQRCode}
          className="flex items-center gap-2 px-4 py-2 bg-[#7263F3] text-white rounded-lg hover:bg-[#6FCF97] transition-colors"
        >
          <FaQrcode />
          <span>QR Code</span>
        </button>
        
        <button
          onClick={shareViaWebAPI}
          className="flex items-center gap-2 px-4 py-2 bg-[#6FCF97] text-white rounded-lg hover:bg-[#7263F3] transition-colors"
        >
          <FaLink />
          <span>Share</span>
        </button>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-2 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 mb-2">Scan this QR code to access the snippet</p>
                <p className="text-sm text-gray-400">{snippetTitle}</p>
              </div>
              
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-1 text-white rounded-lg border border-rgba-3"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-[#7263F3] text-white rounded-lg hover:bg-[#6FCF97] transition-colors"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareSnippet; 