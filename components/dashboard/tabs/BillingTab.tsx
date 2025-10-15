"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, X } from "lucide-react";
import { toast } from "sonner";

interface BillingTabProps {
  user?: any; // Add your user type here if available
}

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "per month",
    credits: "1,000 credits",
    features: [
      "1,000 lead credits per month",
      "Apollo Scraper access",
      "Email Verification",
      "Basic support",
      "Export to CSV",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    credits: "5,000 credits",
    features: [
      "5,000 lead credits per month",
      "All Starter features",
      "Web Scraping",
      "Sales Navigator integration",
      "Priority support",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "per month",
    credits: "Unlimited",
    features: [
      "Unlimited lead credits",
      "All Professional features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label option",
    ],
    popular: false,
  },
];

export function BillingTab({ user }: BillingTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const openModal = (planName: string) => {
    setSelectedPlan(planName);
    setModalOpen(true);
    setFormData({ name: "", cardNumber: "", expiry: "", cvv: "" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
    setLoading(false);
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (modalOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Here you could send payment info + user ID (user?.id) to your backend
    // to process subscription and payment for the selected plan.

    // Mock payment processing delay
    setTimeout(() => {
      setLoading(false);
      toast.success(`Payment success for ${selectedPlan} plan!`);
      closeModal();
    }, 2000);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
            Billing & Subscriptions
          </h2>

          <p className="text-slate-600">
            Choose the perfect plan for your lead generation needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card
              key={plan.name}
              className={`shadow-md transition-transform duration-300 hover:shadow-xl hover:scale-[1.03] cursor-pointer relative ${
                plan.popular
                  ? "border-2 border-blue-500"
                  : "border border-slate-200"
              }`}
              onClick={() => openModal(plan.name)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.credits}</CardDescription>
                <div className="mt-4 flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-600">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-slate-700"
                    >
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openModal(plan.name)}
                  className={`w-full font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <CreditCard className="mr-2 h-4 w-4 inline-block" />
                  Subscribe to {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Usage Card */}
        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Track your credit consumption this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Credits Used</span>
                <span className="text-sm text-slate-900 font-bold">342 / 1,000</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-full rounded-full transition-all duration-500"
                  style={{ width: "34.2%" }}
                />
              </div>
              <p className="text-xs text-slate-500">658 credits remaining this billing period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Close payment modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <h3 className="text-xl font-semibold mb-4 text-slate-900">
              Payment for {selectedPlan} Plan
            </h3>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name on Card
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  autoComplete="cc-name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cardNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  id="cardNumber"
                  required
                  maxLength={19}
                  placeholder="1234 1234 1234 1234"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="expiry"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiry"
                    id="expiry"
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    value={formData.expiry}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="cvv"
                    className="block text-sm font-medium text-gray-700"
                  >
                    CVV
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    id="cvv"
                    required
                    maxLength={4}
                    value={formData.cvv}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-4 focus:ring-blue-300"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                ) : (
                  <>Pay ${plans.find(p => p.name === selectedPlan)?.price.slice(1)}</>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
