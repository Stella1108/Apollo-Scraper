"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, X, Sparkles, Crown, Rocket, Star, TrendingUp, Shield, Users, Target, Gem, Award, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email?: string;
  name?: string;
}

interface BillingTabProps {
  user?: User;
}

const plans = [
  {
    name: "Starter",
    price: "29",
    period: "month",
    credits: "1,000 credits",
    features: [
      "1,000 lead credits monthly",
      "Apollo Scraper access",
      "Email Verification",
      "Basic support",
      "CSV exports",
    ],
    popular: false,
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    bestFor: "Individual Marketers"
  },
  {
    name: "Professional",
    price: "99",
    period: "month",
    credits: "5,000 credits",
    features: [
      "5,000 lead credits monthly",
      "All Starter features",
      "Web Scraping tools",
      "Sales Navigator integration",
      "Priority support",
      "API access included",
    ],
    popular: true,
    icon: TrendingUp,
    color: "from-purple-500 to-blue-500",
    bestFor: "Growing Teams"
  },
  {
    name: "Enterprise",
    price: "299",
    period: "month",
    credits: "Unlimited",
    features: [
      "Unlimited lead credits",
      "All Professional features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label options",
    ],
    popular: false,
    icon: Users,
    color: "from-purple-600 to-blue-600",
    bestFor: "Large Organizations"
  },
];

const COLORS = {
  purple: "#8b39ea",
  lightBlue: "#137fc8", 
  darkBlue: "#1d4ed8",
  gradient: "linear-gradient(135deg, #8b39ea 0%, #137fc8 50%, #1d4ed8 100%)",
  lightGradient: "linear-gradient(135deg, #8b39ea10 0%, #137fc810 50%, #1d4ed810 100%)",
};

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
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const openModal = (planName: string) => {
    setSelectedPlan(planName);
    setTimeout(() => setModalOpen(true), 150);
    setFormData({ name: "", cardNumber: "", expiry: "", cvv: "" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedPlan(null);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (modalOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success(`🎉 Welcome to ${selectedPlan}! Your account has been upgraded.`, {
        style: {
          background: COLORS.lightGradient,
          border: `1px solid ${COLORS.purple}30`,
        }
      });
      closeModal();
    }, 2000);
  };

  const gradientTextClass = "bg-gradient-to-r from-[#8b39ea] via-[#137fc8] to-[#1d4ed8] bg-clip-text text-transparent";

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl border border-purple-100/50 mb-8 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#8b39ea] to-[#137fc8] rounded-full animate-pulse"></div>
                <Gem className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-bold text-[#1d4ed8]">14-Day Free Trial • No Credit Card Required</span>
              </div>
            </div>
            
<div className="space-y-4 mb-6 text-left">
  <h1 className="text-4xl md:text-5xl font-black mb-4">
    <span className={gradientTextClass}>Scale Your Lead Generation</span>
  </h1>
  <p className="text-xl text-gray-700 max-w-3xl leading-relaxed font-medium">
    Join <span className="font-bold text-[#8b39ea]">2,500+</span> marketers scaling their business with our powerful lead generation platform
  </p>
</div>
            {/* Social Proof Bar */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              {[
                { icon: CheckCircle, text: "98% Satisfaction" },
                { icon: Users, text: "2,500+ Users" },
                { icon: Award, text: "Award Winning" },
                { icon: Clock, text: "24/7 Support" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700 font-semibold">
                  <item.icon className="w-5 h-5 text-green-500" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <div
                  key={plan.name}
                  className="relative group"
                  onMouseEnter={() => setIsHovered(plan.name)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  {/* Enhanced Glow Effect */}
                  <div className={`absolute -inset-2 bg-gradient-to-r ${plan.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500 ${
                    plan.popular ? 'opacity-20' : ''
                  }`}></div>
                  
                  <Card className={`relative h-full transition-all duration-500 transform hover:scale-[1.02] cursor-pointer border-2 backdrop-blur-sm min-h-[520px] flex flex-col ${
                    plan.popular 
                      ? `border-purple-500 shadow-2xl scale-100 bg-gradient-to-b from-white to-purple-50/30` 
                      : 'border-gray-200/60 shadow-lg hover:border-blue-300/50 bg-white'
                  }`}>
                    {/* Enhanced Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-1.5 flex items-center gap-2 shadow-2xl border-0 font-bold text-xs tracking-wide">
                          <Crown className="w-3 h-3" />
                          RECOMMENDED
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-3 pt-6">
                      <div className="flex justify-center mb-3">
                        <div className={`p-2 bg-gradient-to-r ${plan.color} rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-blue-600 font-semibold text-sm">
                        {plan.credits}
                      </CardDescription>
                      <div className="mt-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {plan.bestFor}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="text-center space-y-4 flex-1 flex flex-col">
                      {/* Price - More Compact */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-black text-gray-900">${plan.price}</span>
                          <span className="text-gray-500 text-sm">/{plan.period}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Billed monthly • Cancel anytime</p>
                      </div>

                      {/* Features - More Compact */}
                      <ul className="space-y-2 text-left flex-1">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-gray-700 text-xs transition-all duration-200 hover:translate-x-1 group/item"
                          >
                            <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                              <Check className="w-2.5 h-2.5 text-green-600" />
                            </div>
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <div className="pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(plan.name);
                          }}
                          className={`w-full font-bold py-2.5 text-sm transition-all duration-300 shadow-lg relative overflow-hidden ${
                            plan.popular
                              ? `bg-gradient-to-r ${plan.color} hover:shadow-2xl text-white hover:scale-105`
                              : "bg-gray-900 hover:bg-gray-800 text-white border-0 hover:scale-105"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Get Started</span>
                            {isHovered === plan.name && (
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            )}
                          </div>
                          
                          {/* Button shine effect */}
                          <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-white/20"></div>
                        </Button>
                        
                        {/* Free trial text */}
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          ⚡ Start with 14-day free trial
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Enhanced Trust Section */}
          <div className="text-center mb-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/40">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Trusted by <span className={gradientTextClass}>Industry Leaders</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { icon: Shield, stat: "99.9%", label: "Uptime", color: "text-green-500" },
                  { icon: Zap, stat: "2.5M+", label: "Leads Generated", color: "text-blue-500" },
                  { icon: Users, stat: "2.5K+", label: "Happy Clients", color: "text-purple-500" },
                  { icon: Star, stat: "4.9/5", label: "Rating", color: "text-yellow-500" }
                ].map((item, index) => (
                  <div key={index} className="text-center p-4 transform hover:scale-105 transition-transform duration-300">
                    <div className={`w-12 h-12 ${item.color} bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-3`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{item.stat}</div>
                    <div className="text-sm text-gray-600 font-medium">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Current Usage */}
          <Card className="max-w-2xl mx-auto shadow-2xl border border-gray-200/60 backdrop-blur-sm bg-gradient-to-r from-white to-blue-50/30">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-black text-gray-900">Your Current Usage</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Track your credit consumption in real-time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">Credits Used This Month</span>
                <span className="font-black text-purple-600">342 / 1,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: "34.2%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>0</span>
                <span className="font-bold text-blue-600">34% Used</span>
                <span>1,000</span>
              </div>
              <div className="text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200/50">
                <p className="text-sm font-bold text-gray-700">
                  🎉 <span className="text-green-600">658 credits</span> remaining this period • 
                  <span className="text-blue-600 ml-1">Reset in 14 days</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
  
        </div>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 animate-in fade-in-0 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-500 animate-in zoom-in-95 border border-gray-200/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Modal Header */}
            <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl text-white">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black">
                    Upgrade to {selectedPlan}
                  </h3>
                  <p className="text-white/90 text-sm font-medium">
                    Start with 14-day free trial • No commitment
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Payment Form */}
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Card Information
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="1234 1234 1234 1234"
                    required
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-300 p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="expiry"
                    placeholder="MM/YY"
                    required
                    value={formData.expiry}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-300 p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200 font-medium"
                  />
                  <input
                    type="password"
                    name="cvv"
                    placeholder="CVV"
                    required
                    value={formData.cvv}
                    onChange={handleInputChange}
                    className="rounded-xl border border-gray-300 p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200 font-medium"
                  />
                </div>

                <input
                  type="text"
                  name="name"
                  placeholder="Name on card"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200 font-medium"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black py-3.5 text-base shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 relative overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold">Processing Your Upgrade...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-bold">
                      Start Free Trial - ${plans.find((p) => p.name === selectedPlan)?.price}/mo
                    </span>
                  </div>
                )}
                
                {/* Button shine effect */}
                <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-white/20"></div>
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  256-bit SSL Encryption • Your data is secure
                </p>
                <p className="text-xs text-gray-400">
                  No charges until after your 14-day free trial. Cancel anytime.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}