"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUserContext } from "./userContext";
import toast from "react-hot-toast";

const RealTimeContext = createContext();

export const RealTimeProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUserContext();

  useEffect(() => {
    // Initialize socket connection with better error handling
    const newSocket = io("https://snippet-master-harsh810.onrender.com", {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      timeout: 10000, // 10 second timeout
      reconnection: true, // Enable reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
      
      // Join public room for all users
      newSocket.emit("join-public-room");
      
      // Join user's personal room if logged in
      if (user?._id) {
        newSocket.emit("join-user-room", user._id);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.log("❌ Connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Join user room when user changes
  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("join-user-room", user._id);
    }
  }, [socket, user?._id]);

  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    // New snippet created
    socket.on("new-snippet", (snippet) => {
      toast.success(`New snippet: ${snippet.title}`, {
        duration: 3000,
        position: "top-right",
      });
      // Emit custom event to update the UI
      window.dispatchEvent(new CustomEvent("new-snippet", { detail: snippet }));
    });

    // Snippet updated
    socket.on("snippet-updated", (snippet) => {
      toast.success(`Snippet updated: ${snippet.title}`, {
        duration: 3000,
        position: "top-right",
      });
      // Emit custom event to update the UI
      window.dispatchEvent(new CustomEvent("snippet-updated", { detail: snippet }));
    });

    // Snippet deleted
    socket.on("snippet-deleted", (snippetId) => {
      toast.success("Snippet deleted", {
        duration: 3000,
        position: "top-right",
      });
      // Emit custom event to update the UI
      window.dispatchEvent(new CustomEvent("snippet-deleted", { detail: snippetId }));
    });

    return () => {
      socket.off("new-snippet");
      socket.off("snippet-updated");
      socket.off("snippet-deleted");
    };
  }, [socket]);

  const emitSnippetCreated = (snippet) => {
    if (socket) {
      socket.emit("snippet-created", snippet);
    }
  };

  return (
    <RealTimeContext.Provider
      value={{
        socket,
        isConnected,
        emitSnippetCreated,
      }}
    >
      {children}
      {/* Connection status indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999,
            backgroundColor: isConnected ? '#4CAF50' : '#f44336',
            color: 'white'
          }}
        >
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      )}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    // Return default values when context is not available (during SSR)
    return {
      socket: null,
      isConnected: false,
      emitSnippetCreated: () => {},
    };
  }
  return context;
}; 