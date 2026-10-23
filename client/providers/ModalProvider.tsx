"use client";
import AddSnippetModal from "@/components/Modals/AddSnippetModal";
import ProfileModal from "@/components/Modals/ProfileModal";
import { useGlobalContext } from "@/context/globalContext";
import React from "react";

function ModalProvider() {
  const { modalMode, isEditing } = useGlobalContext();
  return (
    <>
      {isEditing && <AddSnippetModal />}
      {modalMode === "profile" && <ProfileModal />}
    </>
  );
}

export default ModalProvider;
