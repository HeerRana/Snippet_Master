"use client";
import HelpSidebar from "@/components/HelpSidebar";
import React from "react";
import { motion } from "framer-motion";
import { animateY } from "@/utils/Animations";

function page() {
  const privacyPolicy = [
    {
      heading: "Introduction",
      text: "This privacy policy explains how our fictional snippet application ('the App') collects, uses, and protects your personal information when you use our services. The App is intended for users aged 13 and older.",
    },
    {
      heading: "Information We Collect",
      text: "We collect various types of information to provide and improve our App, including:",
      list: [
        "User Account Information: Such as your username, email address, and password.",
        "Snippet Data: Details related to the snippets you create, like, or manage, including public and private settings.",
        "Usage Data: Information about your interactions with the App, including IP address, device type, and browser information.",
      ],
    },
    {
      heading: "How We Use Your Information",
      text: "Your information may be used for the following purposes:",
      list: [
        "To provide and maintain the App’s functionalities, including snippet creation, liking, reading, deleting, and updating.",
        "To notify you about changes to our App.",
        "To allow you to participate in interactive features, such as the leaderboard and snippet search.",
        "To provide customer support and respond to inquiries.",
        "To analyze usage patterns to improve the App's functionality and user experience.",
        "To send you newsletters, marketing, or promotional materials if you opted to receive them.",
      ],
    },
    {
      heading: "Data Sharing and Disclosure",
      text: "We do not share your personal information with third parties except in the following circumstances:",
      list: [
        "With your consent.",
        "To comply with legal obligations.",
        "To protect and defend our rights and property.",
        "To prevent or investigate possible wrongdoing in connection with the App.",
      ],
    },
    {
      heading: "Data Security",
      text: "We take the security of your personal information seriously and implement appropriate measures to protect it from unauthorized access, disclosure, alteration, and destruction.",
    },
    {
      heading: "Your Rights",
      text: "As a user, you have the following rights regarding your personal information:",
      list: [
        "The right to access your personal data.",
        "The right to request correction of inaccurate data.",
        "The right to request deletion of your personal information.",
        "The right to object to or restrict the processing of your personal data.",
      ],
    },
    {
      heading: "Children's Privacy",
      text: "Our App is intended for users aged 13 and older. We do not knowingly collect personal information from children under the age of 13. If we become aware that we have collected such data, we will take steps to delete it.",
    },
    {
      heading: "Changes to This Privacy Policy",
      text: "We may update our privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.",
    },
    {
      heading: "Contact Us",
      text: "If you have any questions about this privacy policy, please contact us at support@fictionalsnippetapp.com.",
    },
  ];

  return (
    <div>
      <div className="py-[5rem] flex flex-col gap-1 items-center">
        <h1 className="font-bold text-xl text-gray-200">Privacy and Policy</h1>
        <p>We do not share your information with any third-party.</p>
      </div>
      <div className="flex">
        <HelpSidebar />
        <div className="px-8 py-10 flex-1 flex flex-col gap-4 bg-2 rounded-tr-md rounded-br-md">
          {privacyPolicy.map((section, index) => (
            <motion.div
              key={index}
              className={`py-4 px-6 border-rgba-3 ${
                privacyPolicy.length - 1 === index
                  ? "border-b-none"
                  : "border-b-[1px]"
              }`}
              variants={animateY}
              initial="hidden"
              animate="visible"
            >
              <h2 className="font-bold text-lg text-gray-200">
                {section.heading}
              </h2>

              <p className="mt-2">{section.text}</p>

              {section.list && (
                <ul className="mt-2 ml-8 list-disc text-gray-300 ">
                  {section.list.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default page;
