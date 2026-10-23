"use client";
import HelpSidebar from "@/components/HelpSidebar";
import React from "react";
import { motion } from "framer-motion";
import { animateY } from "@/utils/Animations";

function page() {
  const terms = [
    {
      heading: "Introduction",
      text: "These terms and conditions govern your use of our fictional snippet application ('the App'). By using the App, you agree to these terms.",
    },
    {
      heading: "Eligibility",
      text: "You must be at least 13 years old to use this App. By using the App, you represent that you meet this age requirement.",
    },
    {
      heading: "Account Registration",
      text: "To access certain features of the App, you may need to create an account. When creating an account, you agree to:",
      list: [
        "Provide accurate and complete information.",
        "Keep your account credentials confidential.",
        "Notify us immediately of any unauthorized use of your account.",
      ],
    },
    {
      heading: "User Content",
      text: "You are responsible for the snippets you create and manage within the App. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display your content.",
      list: [
        "You retain ownership of your snippets.",
        "You must not submit content that infringes on any third-party rights.",
        "We reserve the right to remove any content that violates these terms.",
      ],
    },
    {
      heading: "Prohibited Activities",
      text: "You agree not to engage in any of the following prohibited activities:",
      list: [
        "Using the App for any illegal or unauthorized purpose.",
        "Interfering with or disrupting the security or performance of the App.",
        "Attempting to gain unauthorized access to any part of the App.",
        "Posting spam or unsolicited advertisements.",
      ],
    },
    {
      heading: "Termination",
      text: "We reserve the right to suspend or terminate your account and access to the App at our discretion, without prior notice, for any violation of these terms.",
    },
    {
      heading: "Disclaimer of Warranties",
      text: "The App is provided on an 'as is' and 'as available' basis. We do not warrant that the App will be uninterrupted or error-free.",
    },
    {
      heading: "Limitation of Liability",
      text: "In no event shall we be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the App.",
    },
    {
      heading: "Changes to These Terms",
      text: "We may update these terms from time to time. We will notify you of any changes by posting the new terms on this page.",
    },
    {
      heading: "Governing Law",
      text: "These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is registered.",
    },
    {
      heading: "Contact Us",
      text: "If you have any questions about these terms and conditions, please contact us at support@fictionalsnippetapp.com.",
    },
  ];

  return (
    <div>
      <div className="py-[5rem] flex flex-col gap-1 items-center">
        <h1 className="font-bold text-xl text-gray-200">
          Terms and Conditions
        </h1>
        <p>Please read these terms and conditions before using the App.</p>
      </div>

      <div className="flex">
        <HelpSidebar />
        <div className="px-8 py-10 flex-1 flex flex-col gap-4 bg-2">
          {terms.map((section, index) => (
            <motion.div
              key={index}
              className={`py-4 px-6 border-rgba-3 ${
                terms.length - 1 === index ? "border-b-mone" : "border-b-[1px]"
              }`}
              variants={animateY}
              initial="hidden"
              animate="visible"
            >
              <h2 className="font-bold text-lg text-gray-200">
                {section.heading}
              </h2>
              <p className="text-gray-300 mt-2">{section.text}</p>
              {section.list && (
                <ul className={`mt-2 ml-8 list-disc text-gray-300`}>
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
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
