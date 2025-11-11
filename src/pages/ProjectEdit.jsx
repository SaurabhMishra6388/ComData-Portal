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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trash2, Save, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
// 🎯 Import the functions defined in '../../api.js'
import { EditprojectDatat, UpdateProjectData } from "../../api";

// Helper to map status from backend format (e.g., 'completed') to display format (e.g., 'Completed')
const mapStatusToDisplay = (status) => {
  if (!status) return "Pending";
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ProjectEdit() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // State for fetched project data and loading/error
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for saving/deleting process
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // State for form data, initialized to empty, will be updated in useEffect
  const [formData, setFormData] = useState({
    name: "",   
    status: "In Progress", // Default value
    progress: 0,
    startDate: "",
    dueDate: "",
    budget: "",
    spent: "",
  });

  // Milestones structure should match the backend expectation
  const [milestones, setMilestones] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    const id = Number(projectId);
    if (isNaN(id) || id <= 0) {
      setIsLoading(false);
      setError("Invalid project ID provided.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // --- API CALL TO FETCH DATA ---
    EditprojectDatat(id)
      .then((data) => {
        setProjectData(data);
        // Initialize form state with fetched data
        setFormData({
          name: data.name || "",
          description: data.description || "",
          status: data.status || "In Progress",
          progress: data.progress || 0,
          startDate: data.startDate || "",
          dueDate: data.dueDate || "",
          budget: data.budget || "",
          spent: data.spent || "",
        });
        // Ensure milestones have a unique 'id' for backend update if possible,
        // using index for client-side display if 'id' is missing.
        setMilestones(data.milestones || []);
      })
      .catch((err) => {
        console.error("Error fetching project data:", err);
        setError(err.message || "Failed to load project details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    // Rename 'date' field to 'completed_date' to match the backend expectation
    const key = field === "date" ? "completed_date" : field;
    updated[index] = { ...updated[index], [key]: value };
    setMilestones(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Prepare data for the API call
      // The API call expects the project details (formData) and the array of milestones
      await UpdateProjectData(projectId, formData, milestones);

      toast({
        title: "Project Updated Successfully",
        description: `Project ${formData.name} details have been saved.`,
      });

      // Optionally navigate back or refresh data
       navigate(`/projects`); 

    } catch (err) {
      console.error("Save Error:", err);
      toast({
        title: "Update Failed",
        description: err.message || "There was an error saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete project: "${projectData?.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await DeleteProject(projectId);

      toast({
        title: "Project Deleted Successfully",
        description: `Project ID ${projectId} has been removed.`,
        variant: "destructive",
      });

      // Navigate back to the projects list after successful deletion
      navigate("/projects");
    } catch (err) {
      console.error("Delete Error:", err);
      toast({
        title: "Deletion Failed",
        description: err.message || "There was an error deleting the project.",
        variant: "destructive",
      });
      setIsDeleting(false); // Only reset if navigation failed
    }
  };

  // --- Render Logic for Loading/Error/Not Found ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Loading Project Data...</h1>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-red-600">
            {error ? "Error Loading Project" : "Project Not Found"}
          </h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // --- Main Render (Data Loaded) ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Edit Project: {projectData.name}
          </h1>
          <p className="text-muted-foreground">
            Update project details and milestones for Project ID:{" "}
            {projectData.id}
          </p>
        </div>       
      </div>

      <hr />

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Edit the basic details of your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
              />
            </div>
           
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <div className="space-y-2">
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    handleInputChange("progress", Number(e.target.value))
                  }
                />
                <Progress value={formData.progress} className="h-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <hr />

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>
            Edit milestone details and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <p className="text-muted-foreground">
                No milestones found for this project.
              </p>
            ) : (
              milestones.map((milestone, index) => (
                <Card key={milestone.id || index} className="p-4"> {/* Use milestone.id if available */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`milestone-name-${index}`}>
                        Milestone Name
                      </Label>
                      <Input
                        id={`milestone-name-${index}`}
                        value={milestone.name || milestone.milestone_name} // Check both for flexibility
                        onChange={(e) =>
                          handleMilestoneChange(index, "name", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestone-status-${index}`}>
                        Status
                      </Label>
                      <Select
                        // The variant/className logic based on status is complex for Select, removing for simplicity
                        value={milestone.status}
                        onValueChange={(value) =>
                          handleMilestoneChange(index, "status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in-progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          {/* Correcting duplicated/misspelled item values */}
                          <SelectItem value="delayed">Delayed</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestone-date-${index}`}>
                        Completion Date
                      </Label>
                      <Input
                        id={`milestone-date-${index}`}
                        type="date"
                        // Key for date is 'completed_date' to match form state initialization
                        value={milestone.completed_date}
                        onChange={(e) =>
                          handleMilestoneChange(index, "date", e.target.value) // handleMilestoneChange maps 'date' to 'completed_date'
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

       <div className="flex gap-3">
          <Button onClick={() => navigate("/projects")} variant="outline" disabled={isSaving || isDeleting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isDeleting}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
    </div>
  );
}