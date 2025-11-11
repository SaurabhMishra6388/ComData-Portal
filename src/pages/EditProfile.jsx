// EditProfile.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  User,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// **FIX: Import the updateProfileDetails function along with fetchProfileDetails**
import { fetchProfileDetails, updateProfileDetails } from "../../api";

export default function EditProfile() {
  // Looks for a URL parameter named 'projectId'.
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    company: "",
    joined_date: "",
    status: "",
    image: "",
    video: "",
    total_projects: 0, // Initialize as number for controlled input consistency
    completed_projects: 0, // Initialize as number
    total_spent: 0, // Initialize as number
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // State to manage save loading
  const [error, setError] = useState(null);

useEffect(() => {
    const loadProfileData = async () => {
      if (!projectId) {
        setError("Missing Client ID.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProfileDetails(projectId);

        setFormData({
          id: data.id || "",
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          company: data.company || "",
          // Ensure status is capitalized for display
          status: data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Active",
          image: data.image || "",
          video: data.video_url || "",
          // Handle joined_date: use substring only if data exists and is not empty
          joined_date: data.joined_date && data.joined_date.trim() !== ""
            ? data.joined_date.substring(0, 10)
            : "",
          // Ensure number fields are initialized correctly
          total_projects: Number(data.total_projects) || 0,
          completed_projects: Number(data.completed_projects) || 0,
          total_spent: Number(data.total_spent) || 0,
        });
      } catch (err) {
        console.error("Error fetching client data:", err);
        setError("Failed to load client details.");
        toast({
          title: "Error",
          description: "Failed to load client details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [projectId]);

  // FIX: Ensure non-string inputs are correctly handled if needed, though for Input type='number' strings are usually fine.
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isLoading || isSaving) return;
    setIsSaving(true);
    setError(null);

    // FIX: Ensure numeric values are numbers before calculation, although DB query likely handles string conversion.
    const totalProjects = Number(formData.total_projects) || 0;
    const completedProjects = Number(formData.completed_projects) || 0;
    const totalSpent = Number(formData.total_spent) || 0;

    const updatePayload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      company: formData.company,
      // FIX: The backend status validation only accepts 'active' or 'suspended' (lowercase).
      status: formData.status.toLowerCase(), 
      joined_date: formData.joined_date,
      image: formData.image,
      video_url: formData.video,
      total_projects: totalProjects,
      completed_projects: completedProjects,
      active_projects: totalProjects - completedProjects, // Recalculate active projects
      total_spent: totalSpent,
    };

    try {
      await updateProfileDetails(projectId, updatePayload);

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      navigate("/profile");
    } catch (err) {
      console.error("Error saving data:", err);
      // FIX: Log and display the server's error message if available in the response data
      const serverMessage = err.response?.data?.error || err.message;

      toast({
        title: "Error Saving Profile",
        description: `Failed to save changes: ${serverMessage || "An unknown error occurred."}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this client profile? This action cannot be undone."
      )
    ) {
      // TODO: Implement actual API call to delete data
      toast({
        title: "Client Deleted (Simulated)",
        description: "The client profile has been removed successfully.",
        variant: "destructive",
      });
      navigate("/profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <p>Loading client data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10">
        <h1 className="text-xl font-bold text-red-600">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/profile")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Edit Client Profile: {formData.name}
          </h1>
          <p className="text-muted-foreground">
            Update personal and company details for Client ID: **{projectId}**
          </p>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Details
          </CardTitle>
          <CardDescription>
            Edit the basic contact and location details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Client Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  {/* FIX: Changed to Suspended to match backend validation */}
                  <SelectItem value="Suspended">Suspended</SelectItem> 
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joined_date">Joined Date</Label>
              <Input
                id="joined_date"
                type="date"
                value={formData.joined_date}
                onChange={(e) =>
                  handleInputChange("joined_date", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                placeholder="URL to profile image"
                onChange={(e) => handleInputChange("image", e.target.value)}
              />
            </div>

            {/* **Video URL Field** */}
            <div className="space-y-2">
              <Label htmlFor="video">Video URL</Label>
              <Input
                id="video"
                type="url"
                value={formData.video}
                placeholder="URL to video"
                onChange={(e) => handleInputChange("video", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Stats - Editable */}
     <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Project Statistics (Editable)
        </CardTitle>
        <CardDescription>
          Update the project metrics below. The Active Projects count will be automatically calculated.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="space-y-2">
            <Label htmlFor="total_projects">Total Projects</Label>
            {/* FIX: Use value and onChange for controlled input */}
            <Input
              id="total_projects"
              type="number"
              value={formData.total_projects}
              onChange={(e) => handleInputChange("total_projects", e.target.value)}
              placeholder="Enter total projects"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completed_projects">Completed Projects</Label>
            {/* FIX: Use value and onChange for controlled input */}
            <Input
              id="completed_projects"
              type="number"
              value={formData.completed_projects}
              onChange={(e) => handleInputChange("completed_projects", e.target.value)}
              placeholder="Enter completed projects"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_spent">Total Spent</Label>
            {/* FIX: Use value and onChange for controlled input */}
            <Input
              id="total_spent"
              type="number"
              value={formData.total_spent}
              onChange={(e) => handleInputChange("total_spent", e.target.value)}
              placeholder="Enter total amount spent"
            />
          </div>

        </div>
      </CardContent>
    </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => navigate("/profile")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {/* Use the isSaving state to disable the button and show a loader */}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>        
      </div>
    </div>
  );
}