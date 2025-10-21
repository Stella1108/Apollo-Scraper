"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ListChecks, Loader2, Upload, Users, Target, Building, MapPin, Mail, Phone, User, FileText, Sparkles, Zap } from "lucide-react";

interface User {
  id: string;
  email?: string;
  name?: string;
}

interface CustomListTabProps {
  user?: User;
}

export function CustomListTab({ user }: CustomListTabProps) {
  const [listName, setListName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"search" | "contact" | "upload">("search");
  const [isHovered, setIsHovered] = useState(false);

  // Search criteria
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [titles, setTitles] = useState("");
  const [numContacts, setNumContacts] = useState("");
  const [location, setLocation] = useState("");

  // Contact form
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("🎉 Custom list uploaded successfully!", {
        style: {
          background: "linear-gradient(135deg, #8b39ea20 0%, #137fc820 50%, #1d4ed820 100%)",
          border: "1px solid #8b39ea30",
        }
      });

      // Reset all fields
      setListName("");
      setFile(null);
      setIndustry("");
      setTargetAudience("");
      setTitles("");
      setNumContacts("");
      setLocation("");
      setContactName("");
      setEmail("");
      setPhone("");
      setCompany("");
    } catch (error) {
      toast.error("Failed to upload list");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`📁 ${selectedFile.name} selected`, {
        duration: 2000,
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="relative max-w-6xl mx-auto px-4">
        {/* Header */}
<div className="text-left mb-12">
  <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
    Build Your Perfect <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Contact List</span>
  </h1>
  
  <p className="text-xl text-gray-600 max-w-4xl leading-relaxed">
    Create highly targeted lead lists with precise criteria or upload your existing contacts.
  </p>
</div>

        {/* Navigation Tabs */}
<div className="flex justify-start mb-10">
  <div className="bg-white/100 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 text-left ">
    <div className="flex gap-20">
      {[
        { id: "search", label: "Search Criteria", icon: Target },
        { id: "contact", label: "Add Contact", icon: Users },
        { id: "upload", label: "Upload List", icon: Upload },
      ].map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeSection === tab.id
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
</div>

        {/* Main Form Card */}
        <Card className="relative shadow-2xl border-2 border-purple-100/50 backdrop-blur-sm bg-white/70 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
<CardHeader className="text-center pb-6 relative z-10">
  <div className="flex items-center justify-center gap-4 mb-4">
    {/* Icon Container with Hover Effects */}
    <div className="group relative">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-xl group-hover:from-purple-500 group-hover:to-blue-500 group-hover:rotate-3">
        <ListChecks className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
      </div>
      
      {/* Optional: Ripple Effect on Hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 -z-10 group-hover:animate-pulse"></div>
    </div>
    
    {/* Text Content */}
    <div className="text-left">
      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Create Custom List
      </CardTitle>
      <CardDescription className="text-lg text-gray-600 font-medium">
        Build highly targeted lead lists with precision
      </CardDescription>
    </div>
  </div>
</CardHeader>

          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Search Criteria Section */}
              {(activeSection === "search" || activeSection === "upload") && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Search Criteria</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { icon: Building, label: "Industry", value: industry, setter: setIndustry, placeholder: "Technology, Healthcare..." },
                      { icon: Users, label: "Target Audience", value: targetAudience, setter: setTargetAudience, placeholder: "CTOs, Founders..." },
                      { icon: User, label: "Job Titles", value: titles, setter: setTitles, placeholder: "Manager, Director..." },
                      { icon: FileText, label: "Number of Contacts", value: numContacts, setter: setNumContacts, placeholder: "100", type: "number" },
                      { icon: MapPin, label: "Location", value: location, setter: setLocation, placeholder: "New York, Remote..." },
                    ].map((field, index) => {
                      const Icon = field.icon;
                      return (
                        <div key={field.label} className="space-y-3 group">
                          <Label htmlFor={field.label.toLowerCase()} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Icon className="w-4 h-4 text-purple-600" />
                            {field.label}
                          </Label>
                          <Input
                            id={field.label.toLowerCase()}
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            className="rounded-xl border-2 border-gray-200 p-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 group-hover:border-purple-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Add Contact Section */}
              {(activeSection === "contact" || activeSection === "upload") && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Add Contact</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: User, label: "Full Name", value: contactName, setter: setContactName, placeholder: "John Doe" },
                      { icon: Mail, label: "Email", value: email, setter: setEmail, placeholder: "john@example.com", type: "email" },
                      { icon: Phone, label: "Phone", value: phone, setter: setPhone, placeholder: "+1 555 1234 567", type: "tel" },
                      { icon: Building, label: "Company", value: company, setter: setCompany, placeholder: "Acme Corp" },
                    ].map((field, index) => {
                      const Icon = field.icon;
                      return (
                        <div key={field.label} className="space-y-3 group">
                          <Label htmlFor={field.label.toLowerCase()} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Icon className="w-4 h-4 text-blue-600" />
                            {field.label}
                          </Label>
                          <Input
                            id={field.label.toLowerCase()}
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            className="rounded-xl border-2 border-gray-200 p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 group-hover:border-blue-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Upload Section */}
              {(activeSection === "upload" || activeSection === "search") && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Upload className="w-5 h-5 text-cyan-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Upload List</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3 group">
                      <Label htmlFor="listName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FileText className="w-4 h-4 text-cyan-600" />
                        List Name
                      </Label>
                      <Input
                        id="listName"
                        type="text"
                        placeholder="Q4 Sales Prospects"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        required
                        className="rounded-xl border-2 border-gray-200 p-4 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 group-hover:border-cyan-300"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Upload className="w-4 h-4 text-cyan-600" />
                        Upload CSV File
                      </Label>
                      
                      <div 
                        onClick={triggerFileInput}
                        className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-50/50 group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-cyan-100 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-8 h-8 text-cyan-600" />
                          </div>
                          
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {file ? file.name : "Click to upload CSV"}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              {file ? `${(file.size / 1024).toFixed(2)} KB` : "Supports .csv files"}
                            </p>
                          </div>
                          
                          {!file && (
                            <Button type="button" variant="outline" className="border-cyan-300 text-cyan-600 hover:bg-cyan-50">
                              Choose File
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 text-lg shadow-2xl transition-all duration-500 transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-3 justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Building Your List...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 justify-center">
                      <Sparkles className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
                      <span>Create Custom List</span>
                      <Zap className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Target, title: "Precise Targeting", desc: "Filter by industry, role, location and more" },
            { icon: Users, title: "Bulk Upload", desc: "Upload thousands of contacts via CSV" },
            { icon: Sparkles, title: "Smart Validation", desc: "Automatically verify and clean your data" },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}