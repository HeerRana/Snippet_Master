"use client";
import { useUserContext } from "@/context/userContext";
import Image from "next/image";
import React from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";

function page() {
  const { user, updateUser, changePassword, userState, handlerUserInput } =
    useUserContext();

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string>("");

  const handlePasswordChange = async (e: any) => {
    if (e.target.name === "oldPassword") {
      setOldPassword(e.target.value);
    } else {
      setNewPassword(e.target.value);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateUserWithImage = async (formData: FormData) => {
    try {
      const response = await fetch("https://snippet-master-harsh810.onrender.com/api/v1/user", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update profile`);
      }

      const updatedUser = await response.json();
      
      // Update the user context
      updateUser(null, updatedUser);
      
      // Clear the selected image
      setSelectedImage(null);
      setPreviewImage("");
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Update your profile information and preferences</p>
        </div>
        
        <form
          action=""
          className="bg-2 p-8 rounded-xl border border-rgba-3 shadow-xl"
          onSubmit={async (e) => {
            e.preventDefault();
            
            // Create FormData to handle file upload
            const formData = new FormData();
            
            // Add form fields
            const form = e.target as HTMLFormElement;
            const nameInput = form.querySelector('#name') as HTMLInputElement;
            const emailInput = form.querySelector('#email') as HTMLInputElement;
            const bioInput = form.querySelector('#bio') as HTMLTextAreaElement;
            const githubInput = form.querySelector('#github') as HTMLInputElement;
            const linkedinInput = form.querySelector('#linkedin') as HTMLInputElement;
            const publicEmailInput = form.querySelector('#publicEmail') as HTMLInputElement;
            
            formData.append('name', nameInput?.value || user?.name || '');
            formData.append('email', emailInput?.value || user?.email || '');
            formData.append('bio', bioInput?.value || user?.bio || '');
            formData.append('github', githubInput?.value || user?.github || '');
            formData.append('linkedin', linkedinInput?.value || user?.linkedin || '');
            formData.append('publicEmail', publicEmailInput?.value || user?.publicEmail || '');
            
            // Add image file if selected
            if (selectedImage) {
              formData.append('photo', selectedImage);
            }
            // Don't append photo if no new image is selected - let the backend handle it
            
            // Call updateUser with FormData
            await updateUserWithImage(formData);
          }}
        >
        <div className="flex flex-col gap-3 mb-8">
          <label htmlFor="file-upload" className="text-white font-semibold text-lg">
            Profile Picture
          </label>
          <div className="flex items-center gap-6">
            <label
              htmlFor="file-upload"
              className="relative group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-rgba-3 group-hover:border-[#7263F3] transition-all duration-300">
                <Image
                  width={96}
                  height={96}
                  src={previewImage || user?.photo || "/image--user.png"}
                  alt="profile picture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-sm font-medium">Change</span>
              </div>
            </label>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Click on the image to upload a new profile picture</p>
              <p className="text-gray-500 text-xs mt-1">Supports JPG, PNG, GIF up to 5MB</p>
            </div>
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="hidden" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <label className="text-white font-semibold text-lg">
            Social Links
          </label>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative w-full">
              <label
                htmlFor="github"
                className="absolute top-[50%] left-[1rem] translate-y-[-50%] text-gray-400 text-xl"
              >
                <FaGithub />
              </label>

              <input
                id="github"
                name="github"
                type="text"
                defaultValue={user?.github}
                onChange={(e) => handlerUserInput("github")(e)}
                placeholder="https://github.com/username"
                className="w-full py-3 pl-12 pr-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
              />
            </div>

            <div className="relative w-full">
              <label
                htmlFor="linkedin"
                className="absolute top-[50%] left-[1rem] translate-y-[-50%] text-gray-400 text-xl"
              >
                <FaLinkedin />
              </label>

              <input
                id="linkedin"
                name="linkedin"
                type="text"
                defaultValue={user?.linkedin}
                onChange={(e) => handlerUserInput("linkedin")(e)}
                placeholder="https://linkedin.com/in/username"
                className="w-full py-3 pl-12 pr-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
              />
            </div>
            <div className="relative w-full">
              <label
                htmlFor="publicEmail"
                className="absolute top-[50%] left-[1rem] translate-y-[-50%] text-gray-400 text-xl"
              >
                <FaEnvelope />
              </label>

              <input
                id="publicEmail"
                name="publicEmail"
                type="email"
                defaultValue={user?.publicEmail}
                onChange={(e) => handlerUserInput("publicEmail")(e)}
                placeholder="your.email@example.com"
                className="w-full py-3 pl-12 pr-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 mb-8">
          <label className="text-white font-semibold text-lg">
            Personal Information
          </label>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-gray-300 font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={user?.name}
                className="w-full py-3 px-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-gray-300 font-medium">
                Private Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={user?.email}
                className="w-full py-3 px-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label htmlFor="bio" className="text-gray-300 font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={user?.bio}
                onChange={(e) => handlerUserInput("bio")(e)}
                placeholder="Tell us about yourself..."
                className="w-full py-3 px-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300 resize-none"
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-white font-semibold text-lg">
                Change Password
              </label>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="oldPassword" className="text-gray-300 font-medium">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="oldPassword"
                    value={oldPassword}
                    onChange={handlePasswordChange}
                    name="oldPassword"
                    placeholder="Enter current password"
                    className="w-full py-3 px-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="newPassword" className="text-gray-300 font-medium">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    name="newPassword"
                    placeholder="Enter new password"
                    className="w-full py-3 px-4 text-white bg-1 border-2 border-rgba-3 rounded-lg outline-none focus:border-[#7263F3] focus:bg-2 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-end">
          <button
            type="button"
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 ease-in-out"
            onClick={() => changePassword(oldPassword, newPassword)}
          >
            Update Password
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#7263F3] to-[#6BBE92] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#7263F3]/25 hover:scale-105 transition-all duration-300 ease-in-out"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  </main>
  );
}

export default page;
