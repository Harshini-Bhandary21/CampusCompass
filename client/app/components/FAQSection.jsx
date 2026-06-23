'use client'

import { useState } from 'react'
import faqs from '../../data/faq.json'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [question, setQuestion] = useState('')

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-white border-t border-teal-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-teal-800 mb-4">
            Frequently Asked Questions
          </h2>

          <p className="text-gray-600 text-lg">
            Find answers to common questions about the platform.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-teal-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-5 text-left hover:bg-teal-50 transition"
              >
                <span className="font-semibold text-gray-800">
                  {faq.question}
                </span>

                <span className="text-2xl text-teal-700 font-bold">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-5 pb-5 border-t border-teal-100">
                  <p className="pt-4 text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ask Question Section */}
        {/* Ask Question Section */}
<div className="mt-12 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 p-8">
  <h3 className="text-2xl font-bold text-teal-800 mb-3 text-center">
    Didn't find your answer?
  </h3>

  <p className="text-gray-600 mb-6 text-center">
    Ask your question and we'll add it to our FAQ in future updates.
  </p>

 <form
  onSubmit={(e) => {
    e.preventDefault()

    alert(
      `Thank you ${name}!\n\nQuestion submission feature will be available soon.`
    )

    setName('')
    setEmail('')
    setQuestion('')
  }}
  className="space-y-4"
>
    <input
  type="text"
  placeholder="Your Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
  required
/>

   <input
  type="email"
  placeholder="Your Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
  required
/>
   <textarea
  rows="4"
  placeholder="Type your question here..."
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
  required
/>

    <button
      type="submit"
      className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition"
    >
      Submit Question
    </button>
  </form>
</div>

      </div>
    </section>
  )
}