import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Loader,
  Activity,
  Plus,
  Edit,
  Trash2,
  ChevronLeft, // For pagination
  ChevronRight, // For pagination
  Search, // NEW: For the search icon
  X, // NEW: For clearing the search
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Import DialogFooter for buttons
} from "@/components/ui/dialog";
// Assuming you have an Input component for the search box
import { Input } from "@/components/ui/input"; // ADDED: Input component
import { fetchprojectData, fetchProjectDetailsById, deleteProject } from "../../api";
import { toast } from "@/components/ui/use-toast";

// --- Constants ---
const RECORDS_PER_PAGE = 8;

const getStatusBadgeStyle = (status) => {
  if (!status) return { className: "bg-gray-200 text-gray-700", icon: <Loader className="mr-1 h-3 w-3" /> };
  switch (status.toLowerCase().replace(" ", "-")) {
    case "completed":
      return {
        className: "bg-green-500 hover:bg-green-600 text-white",
        icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
      };
    case "in-progress":
      return {
        className: "bg-blue-500 hover:bg-blue-600 text-white",
        icon: <Activity className="mr-1 h-3 w-3" />,
      };
    case "pending":
    case "on-hold":
    case "review":
    case "upcoming":
      return {
        className: "bg-yellow-500 hover:bg-yellow-600 text-black",
        icon: <Clock className="mr-1 h-3 w-3" />,
      };
    default:
      return {
        className: "bg-muted text-foreground",
        icon: <Loader className="mr-1 h-3 w-3" />,
      };
  }
};

// --- ProjectDetailsPopup Component ---
const ProjectDetailsPopup = ({ project }) => {
  // Destructure properties available from the backend (name_project, status, etc.)
  const {
    id,
    name_project,
    project_status, // Mapped status
    start_date,
    due_date,
    completion,
  } = project;

  const formatDate = (isoString) =>
    isoString ? isoString.substring(0, 10) : "N/A";

  const { className: badgeClassName, icon: badgeIcon } = getStatusBadgeStyle(project_status);
  
  const formattedStatus = project_status
    ? project_status.charAt(0).toUpperCase() +
      project_status.slice(1).replace("-", " ")
    : "N/A";

  const progressValue = completion || 0;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Project Header and Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-xl font-bold mb-2 sm:mb-0">
            {name_project || "Project Name N/A"}
          </h3>
          <Badge className={`text-sm font-semibold ${badgeClassName}`}>
            {badgeIcon}
            {formattedStatus}
          </Badge>
        </div>

        {/* Project Dates */}
        <div className="grid grid-cols-2 gap-6 mb-6 border-b pb-4">
          {/* Start Date */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              {formatDate(start_date)}
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              {formatDate(due_date)}
            </p>
          </div>
        </div>

        {/* Overall Progress bar section */}
        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Overall Progress</span>
              <span className="text-base font-bold text-blue-600">
                {progressValue}%
              </span>
            </div>
            <Progress value={progressValue} className="h-3" />
          </div>
        </div>
        
        {/* You can add Milestones here if needed, based on the server response structure */}
      </CardContent>
    </Card>
  );
};

// FIX: Accept isAdmin prop from the router wrapper
export default function Projects({ isAdmin }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  
  // --- NEW STATE FOR DELETE CONFIRMATION ---
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState(null);
  // ------------------------------------------

  // --- NEW STATE FOR SEARCH ---
  const [searchTerm, setSearchTerm] = useState("");
  // ----------------------------

const handleView = async (projectId) => {
    // Clear previous state and open the popup
    setSelectedProject(null);
    setDetailError(null);
    setIsPopupOpen(true);
    setIsDetailLoading(true);

    try {
      const projectFromList = projects.find((p) => p.id === projectId);
      if (!projectFromList) {
        throw new Error("Project not found in local list.");
      }

      const projectIdForDetails = projectFromList.id;
      const detailData = await fetchProjectDetailsById(projectIdForDetails);

      if (!detailData) {
        throw new Error("No detailed project data found.");
      }

      const mappedDetails = {
        id: detailData.id,
        name_project: detailData.name_project,
        project_status: detailData.status, 
        start_date: detailData.start_date,
        due_date: detailData.due_date,
        completion: detailData.completion || 0,
      };

      setSelectedProject(mappedDetails);
    } catch (err) {
      console.error("Detail Fetch Error: ", err);
      setDetailError(`Failed to load project details. Error: ${err.message || 'Unknown error'}`);
      toast({
        title: "Error",
        description: `Failed to fetch project details: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  // --- Data Fetching Logic ---
  const fetchprojectDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchprojectData();

      const mappedData = data.map((project) => ({
        id: project.id,
        name_project: project.name_project || project.name,
        status: project.status,
        start_date: project.start_date,
        completion: project.completion || 0, 
        due_date: project.due_date,
        progress: project.completion || 0,
      }));

      setProjects(mappedData);
      setCurrentPage(1);

    } catch (err) {
      setError("Failed to fetch project data.");
      console.error("Fetch error: ", err);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchprojectDetails();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return isoString.substring(0, 10);
  };

  // Handler for Add Project
  const handleAddProject = () => {
    navigate("/add-project"); // Assuming your route for adding a project is '/add-project'
  };

  const handleEdit = (id) => {
    navigate(`/project-edit/${id}`);
  };

// --- UPDATED handleDelete to open the custom dialog ---
const handleDelete = (id) => {
  setProjectToDeleteId(id);
  setIsDeleteConfirmOpen(true);
};

// --- NEW handleConfirmDelete function ---
const handleConfirmDelete = async () => {
  // Ensure we have an ID and close the confirmation dialog
  const id = projectToDeleteId;
  setIsDeleteConfirmOpen(false);
  setProjectToDeleteId(null); 

  if (!id) return;

  try {
    await deleteProject(id);
    toast({
      title: "Deleted Successfully",
      description: `Project ID ${id} has been deleted.`,
    });
    fetchprojectDetails(); // refresh your table
  } catch (err) {
    toast({
      title: "Delete Failed",
      description: err.message || "Something went wrong.",
      variant: "destructive",
    });
  }
};
// ----------------------------------------------------

  // --- Search Filtering Logic ---
  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return projects;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return projects.filter((project) => {
      // Search by project name, status, or ID
      const nameMatch = project.name_project?.toLowerCase().includes(lowerCaseSearchTerm);
      const statusMatch = project.status?.toLowerCase().includes(lowerCaseSearchTerm);
      // Convert ID to string for searching
      const idMatch = String(project.id)?.toLowerCase().includes(lowerCaseSearchTerm);

      return nameMatch || statusMatch || idMatch;
    });
  }, [projects, searchTerm]);


  // --- Pagination Logic (Client-Side) ---
  const totalPages = Math.ceil(filteredProjects.length / RECORDS_PER_PAGE);
  const currentProjects = useMemo(() => {
    // Reset page to 1 if search term changes
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
    
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, totalPages]);


  // Handler for search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to the first page on a new search
  };
  
  // --- Render Component ---
  return (
    <div className="space-y-0">
      <div>
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-muted-foreground">
          Track progress and milestones for all your projects.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>
              A list of all active and historical projects.
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search Input Field */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, status, or ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 pr-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1); // Reset page on clear
                  }}
                  title="Clear Search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Admin-only button: Rendered only if isAdmin is true */}
            {isAdmin && (
              <Button 
                onClick={handleAddProject} 
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            )}
          </div>

        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Sr/No</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Start Date
                </TableHead>
                <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <Loader className="h-6 w-6 animate-spin inline-block mr-2" />
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-red-500 font-medium"
                  >
                    <AlertCircle className="h-5 w-5 inline-block mr-2" />
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No projects found {searchTerm && `for "${searchTerm}"`}.
                  </TableCell>
                </TableRow>
              ) : (
                currentProjects.map((project, index) => {
                  const badgeStyle = getStatusBadgeStyle(project.status);
                  const serialNumber =
                    (currentPage - 1) * RECORDS_PER_PAGE + index + 1;

                  return (
                    <TableRow key={project.id}>
                      <TableCell>{serialNumber}</TableCell>
                      <TableCell className="font-semibold">
                        {project.name_project}
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeStyle.className}>
                          {badgeStyle.icon}
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(project.start_date)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(project.due_date)}
                      </TableCell>
                      <TableCell className="text-right space-y-1">
                        <p className="text-sm font-medium">
                          {project.completion}%
                        </p>
                        <Progress
                          value={project.completion}
                          className="h-2 w-24 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          {/* View Details Button - Unrestricted */}
                          <Button
                            variant="outline"
                            size="icon"
                            title="View Details"
                            onClick={() => handleView(project.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Admin-only buttons: Rendered only if isAdmin is true */}
                          {isAdmin && (
                            <>
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => handleEdit(project.id)}
                                title="Edit Project"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(project.id)}
                                title="Delete Project"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* --- Dialog Component for Project Details (Unchanged) --- */}
        <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedProject?.name_project || "Project Details"}
              </DialogTitle>
              <DialogDescription>
                Project ID: {selectedProject?.id || "N/A"}
              </DialogDescription>
            </DialogHeader>
            
            {isDetailLoading ? (
              <div className="text-center py-6">
                <Loader className="h-6 w-6 animate-spin inline-block mr-2" />
                Loading details...
              </div>
            ) : detailError ? (
              <div className="text-center py-6 text-red-500 font-medium">
                <AlertCircle className="h-5 w-5 inline-block mr-2" />
                {detailError}
              </div>
            ) : selectedProject ? (
              <ProjectDetailsPopup project={selectedProject} />
            ) : null}
          </DialogContent>
        </Dialog>
        {/* --- End Dialog Component --- */}

        {/* --- Dialog Component for DELETE CONFIRMATION (Unchanged) --- */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you absolutely sure you want to delete this project (ID:{" "}
                <span className="font-semibold">{projectToDeleteId}</span>)?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setProjectToDeleteId(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* --- End Delete Confirmation Dialog --- */}

        {/* --- Pagination Footer --- */}
        {filteredProjects.length > 0 && ( // Display pagination only if there are filtered results
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * RECORDS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * RECORDS_PER_PAGE, filteredProjects.length)} of{" "}
              {filteredProjects.length} projects {searchTerm && `(filtered from ${projects.length})`}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}