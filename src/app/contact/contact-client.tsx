"use client";

import { useState } from "react";
import { Send, Phone, Mail, MapPin } from "lucide-react";

export function ContactClient() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      {/* Hero */}
      <section className="gradient-blue-ribbon py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70 mb-2">
            Contact Sales
          </p>
          <h1 className="font-heading text-[48px] font-light text-white leading-tight mb-4">
            Get a Custom Quote
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Our security experts will help you find the right solution for your organization.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-heading text-2xl mb-6">Reach Out</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0075DB]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#0075DB]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Sales</p>
                    <p className="text-gray-600 text-sm">1-888-557-6642</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0075DB]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#0075DB]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Email</p>
                    <p className="text-gray-600 text-sm">sales@sonicwall-store.com</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0075DB]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#0075DB]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Headquarters</p>
                    <p className="text-gray-600 text-sm">
                      1033 McCarthy Blvd<br />
                      Milpitas, CA 95035
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-[#F5F5F3] rounded-xl">
                <p className="font-heading text-lg mb-2">Need help choosing?</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our security consultants can assess your environment and recommend the right
                  SonicWall solution for your specific needs and budget.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="text-center py-20 bg-[#F5F5F3] rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-[#22C55E]" />
                  </div>
                  <h3 className="font-heading text-2xl mb-2">Request Received</h3>
                  <p className="text-gray-600">
                    We&apos;ll get back to you within 1 business day with a custom quote.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Business Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Company</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Product Interest</label>
                    <select className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB]">
                      <option>Next-Gen Firewalls</option>
                      <option>Managed Switches</option>
                      <option>Cloud Secure Edge</option>
                      <option>SonicSentry MDR</option>
                      <option>Capture Client</option>
                      <option>Network Security Manager</option>
                      <option>Full Security Stack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0075DB]/30 focus:border-[#0075DB] resize-none"
                      placeholder="Tell us about your security needs, network size, and any specific requirements..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#0075DB] text-white py-3.5 rounded-lg font-bold text-[15px] hover:bg-[#0066c0] transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Request Quote
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    By submitting, you agree to our privacy policy. We&apos;ll never share your information.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
