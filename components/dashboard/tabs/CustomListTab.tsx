"use client";

import { useState } from "react";
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
import { ListChecks, Loader as Loader2, Upload } from "lucide-react";

export function CustomListTab() {
  const [listName, setListName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Additional form state for search criteria
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [titles, setTitles] = useState("");
  const [numContacts, setNumContacts] = useState("");
  const [location, setLocation] = useState("");

  // Additional contact form
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2500));
      toast.success("Custom list uploaded successfully!");

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-9xl mx-auto p-4">
      <div>
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-pink-500 to-indigo-600 bg-clip-text text-transparent mb-3 animate-gradient-x" style={{ backgroundSize: "200% 200%" }}>
          Custom List
        </h2>
        <p className="text-slate-600 text-lg max-w-xl">
          Upload and manage your custom lead lists. Fill out your search criteria and contact details below.
        </p>
      </div>

      <Card className="shadow-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-blue-600" />
            Upload Custom List
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing your custom leads or enter contact information manually
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Search Criteria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    type="text"
                    placeholder="E.g. Technology"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    type="text"
                    placeholder="E.g. CTOs, Founders"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="titles">Titles</Label>
                  <Input
                    id="titles"
                    type="text"
                    placeholder="E.g. Manager, Director"
                    value={titles}
                    onChange={(e) => setTitles(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="numContacts">Number of Contacts</Label>
                  <Input
                    id="numContacts"
                    type="number"
                    placeholder="100"
                    min={1}
                    value={numContacts}
                    onChange={(e) => setNumContacts(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="E.g. New York"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Add Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactName">Name</Label>
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="John Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 555 1234 567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <Label htmlFor="listName">List Name</Label>
                <Input
                  id="listName"
                  type="text"
                  placeholder="Q4 Prospects"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  required
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
                {file && (
                  <p className="text-xs mt-1 text-slate-500">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </section>

            <Button
              type="submit"
              disabled={loading}
              className="w-80% bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] align item-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload List
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
