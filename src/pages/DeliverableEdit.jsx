"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
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
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
// Assuming fetchdeliverabledata and updateDeliverable are correctly exported from "../../api"
import { fetchdeliverabledata, updateDeliverable } from "../../api";

export default function DeliverableEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  // State for form data
  const [formData, setFormData] = useState({
    project_name: "",
    milestone_name: "",
    due_date: "",
    status: "",
    approval_status: "",
    approval_date: "",
    approved_name: "", // Renamed approver_name to approved_name to match DB/API response
    category: "",
    type: "", // Will hold the value for 'Type' in the API
    storage: "", // Will hold the value for 'Storage' in the API
    image: "",
    video: "",
    file_url: "",
  });

  // State for loading, error, and submission status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🎯 NEW: Submitting state

  // --- useEffect to Load Data ---
  useEffect(() => {
    if (id) {
      const loadDeliverable = async () => {
        try {
          const data = await fetchdeliverabledata(id);

          if (data && data.length > 0) {
            const apiData = data[0];
            
            // Map API data (e.g., snake_case, PascalCase) to component state (camelCase)
            setFormData({
              project_name: apiData["Project Name"] || "",
              milestone_name: apiData["Milestone Name"] || "",
              due_date: apiData["Due Date"] || "",
              status: apiData.deliverable_status || apiData.status || "",
              approval_status: apiData.deliverable_status || apiData.status || "",
              approval_date: apiData.approval_date || "",
              approved_name: apiData.approved_name || apiData.approved_by || "", // 🎯 Corrected key name
              category: apiData.category || "",
              type: apiData.Type || "", // Note the uppercase 'Type' from the SQL alias
              storage: apiData.Storage || "", // 🎯 Corrected key name to 'storage'
              image: apiData.image || "",
              video: apiData.video_url || "",
              file_url: apiData.file_url || "",
            });
          } else {
            setError("Deliverable not found or ID is invalid.");
          }
        } catch (err) {
          console.error("Failed to fetch deliverable data:", err);
          setError("Failed to load deliverable data.");
        } finally {
          setLoading(false);
        }
      };

      loadDeliverable();
    } else {
      setLoading(false);
      setError("Deliverable ID is missing in the URL.");
    }
  }, [id]);

  // --- Handle Input Changes ---
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Handle Form Submit (WORKING CODE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 🎯 CRITICAL: Map frontend state keys (formData) to backend expected keys (req.body)
    const payload = {
      status: formData.status,
      approval_date: formData.approval_date,
      approved_name: formData.approved_name, // Matches backend
      Type: formData.type, // Matches backend: 'Type'
      Storage: formData.storage, // Matches backend: 'Storage'
      file_url: formData.file_url,
      category: formData.category,
      // Note: approved_by is missing in both frontend and backend but should be added if needed
    };
    
    try {
      // 1. Call the API
      const updatedData = await updateDeliverable(id, payload);
      
      // 2. Success Feedback
      toast({
        title: "Success! 🎉",
        description: `Deliverable ${updatedData.id} updated successfully.`,
        variant: "default",
      });

      // 3. Navigate away or update local state
      navigate("/deliverables");

    } catch (err) {
      // 4. Error Feedback
      console.error("Deliverable update failed:", err);
      toast({
        title: "Update Failed",
        description: err.message || "An unknown error occurred during update.",
        variant: "destructive",
      });
      // Optionally re-enable the form fields here if you don't navigate away
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading state
  if (loading) {
      return (
          <div className="p-6 text-center">Loading deliverable data...</div>
      );
  }

  // Display error state
  if (error) {
      return (
          <div className="p-6 text-center text-red-500">Error: {error}</div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/deliverables")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Deliverable (ID: {id})</h1>
          <p className="text-muted-foreground">
            Update deliverable information
          </p>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Deliverable Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Project Name (Read Only) */}
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  readOnly
                />
              </div>

              {/* Milestone Name (Read Only) */}
              <div className="space-y-2">
                <Label htmlFor="milestone_name">Milestone Name</Label>
                <Input
                  id="milestone_name"
                  value={formData.milestone_name}
                  readOnly
                />
              </div>

              {/* Due Date (Read Only) */}
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  readOnly
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending Review">
                      Pending Review
                    </SelectItem>
                    <SelectItem value="Revision Required">
                      Revision Required
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photos">Photos</SelectItem>
                    <SelectItem value="Videos">Videos</SelectItem>
                    <SelectItem value="Designs">Designs</SelectItem>
                    <SelectItem value="Documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Figma File">Figma File</SelectItem>
                    <SelectItem value="ZIP Archive">ZIP Archive</SelectItem>
                    <SelectItem value="MP4 Video">MP4 Video</SelectItem>
                    <SelectItem value="PDF Document">PDF Document</SelectItem>
                    <SelectItem value="Image Collection">
                      Image Collection
                    </SelectItem>
                    <SelectItem value="PNG Images">PNG Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Storage */}
              <div className="space-y-2">
                <Label htmlFor="storage">Storage</Label>
                <Select
                  value={formData.storage} // 🎯 Note: Changed from storageType to storage
                  onValueChange={(value) => handleChange("storage", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Drive">Google Drive</SelectItem>
                    <SelectItem value="Dropbox">Dropbox</SelectItem>
                    <SelectItem value="OneDrive">OneDrive</SelectItem>
                    <SelectItem value="Local Storage">
                      Local Storage
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Approver Name */}
              <div className="space-y-2">
                <Label htmlFor="approved_name">Approver Name</Label>
                <Input
                  id="approved_name"
                  placeholder="Enter name of approver"
                  value={formData.approved_name}
                  onChange={(e) => handleChange("approved_name", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Approval Date */}
              <div className="space-y-2">
                <Label htmlFor="approval_date">Approval Date</Label>
                <Input
                  id="approval_date"
                  type="date"
                  value={formData.approval_date}
                  onChange={(e) => handleChange("approval_date", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Image URL (Read Only) */}
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  readOnly
                />
              </div>

              {/* Video URL (Read Only) */}
              <div className="space-y-2">
                <Label htmlFor="video">Video URL</Label>
                <Input
                  id="video"
                  placeholder="https://example.com/video.mp4"
                  value={formData.video}
                  readOnly
                />
              </div>

              {/* File URL */}
              <div className="space-y-2">
                <Label htmlFor="file_url">File URL</Label>
                <Input
                  id="file_url"
                  placeholder="https://docs.google.com/"
                  value={formData.file_url}
                  onChange={(e) => handleChange("file_url", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/deliverables")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}