"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is Campus Compass?",
    answer:
      "Campus Compass is a centralized platform that helps students access academic resources, club activities, announcements, Moodle, CodeTantra, and other college services from one place.",
  },
  {
    question: "How do I access Moodle?",
    answer:
      "Navigate to the Moodle section from the dashboard or watch the Moodle Demo video available on the homepage.",
  },
  {
    question: "How do I access CodeTantra?",
    answer:
      "Students can access CodeTantra through the provided portal link and refer to the CodeTantra Demo video for guidance.",
  },
  {
    question: "Can I join college clubs through Campus Compass?",
    answer:
      "Yes. Students can explore clubs, view upcoming events, and connect with club coordinators directly through the platform.",
  },
  {
    question: "Where can I find announcements?",
    answer:
      "Announcements from faculty, CRs, and club coordinators are available in the announcements section.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-teal-800">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 mt-3">
            Find answers to common questions about Campus Compass.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-teal-200 rounded-xl overflow-hidden shadow-sm"
            >
              <button
                className="w-full px-6 py-4 text-left bg-teal-50 hover:bg-teal-100 flex justify-between items-center"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span className="font-semibold text-teal-900">
                  {faq.question}
                </span>
                <span className="text-xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 bg-white text-gray-700">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}