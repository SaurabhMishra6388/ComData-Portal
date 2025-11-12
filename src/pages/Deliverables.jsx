import React, { useState, useEffect, useCallback, useMemo } from "react"; // ADDED useMemo
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Palette,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ListCollapse,
  PlusCircle,
  Search, // ADDED
  X, // ADDED
} from "lucide-react";

// Assuming this function correctly fetches the array of objects
import { fetchdeliverablData, deletedeliverable } from "../../api"; 

// ------------------------------------------------------------------------------------------------
// FIX: Mock UI components included below (replace with real imports like shadcn/ui if used)
// ------------------------------------------------------------------------------------------------

// Mock components to prevent errors in a plain environment (remove these if you import the real components)
const Dialog = ({ children, open, onOpenChange }) => open ? <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">{children}</div> : null;
const DialogContent = ({ children }) => <div className="bg-white p-6 rounded-lg shadow-2xl">{children}</div>;
const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }) => <h2 className="text-xl font-bold">{children}</h2>;
const DialogDescription = ({ children }) => <p className="text-sm text-gray-500">{children}</p>;
const DialogFooter = ({ children }) => <div className="flex justify-end gap-3 mt-4">{children}</div>;
const Button = ({ children, variant, onClick, className, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`${className} px-4 py-2 text-sm rounded-md font-medium transition-colors 
      ${variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400' : 
        variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:text-gray-400' : 
        'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'}
        disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);
// NEW: Mock Input component
const Input = ({ type, placeholder, value, onChange, className }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    // Using a simpler style here since it's a mock
    className={`${className} w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
  />
);


const toast = (config) => {
  console.error(`Toast: ${config.title} - ${config.description}`);
};
const PRIMARY_COLOR = "blue-600";

const RECORDS_PER_PAGE = 8;

/**
 * Helper Functions
 */
// Status icons
const getCategoryIcon = (category) => {
  // Use lowercase for comparison just in case
  const lowerCategory = category ? category.toLowerCase() : "documents";

  switch (lowerCategory) {
    case "photos":
      return <ImageIcon className="h-4 w-4 text-blue-600" />;
    case "videos":
      return <Video className="h-4 w-4 text-blue-600" />;
    case "designs":
      return <Palette className="h-4 w-4 text-blue-600" />;
    case "documents":
      return <FileText className="h-4 w-4 text-blue-600" />;
    default:
      return <FileText className="h-4 w-4 text-blue-600" />;
  }
};

// Status icons
const getStatusIcon = (status) => {
  switch (status) {
    case "Approved":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "Pending Review":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "Revision Required":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

// Status badge style
const getStatusBadge = (status) => {
  let color = "";
  if (status === "Approved") color = "bg-green-100 text-green-700";
  else if (status === "Pending Review") color = "bg-yellow-100 text-yellow-700";
  else if (status === "Revision Required") color = "bg-red-100 text-red-700";
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {status}
    </span>
  );
};

/**
 * Main Component
 * FIX: Added userRole prop with a default of 'client'
 */
export default function Deliverables({ userRole = 'client' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- DELETE DIALOG STATE ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null); 
  // ---------------------------
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  // ------------------------

  // --- SEARCH STATE (NEW) ---
  const [searchTerm, setSearchTerm] = useState("");
  // --------------------

  // Define categories array (now CORRECTLY defined as a simple JS array of objects)
  const categories = [
    { value: "all", label: "All Files", icon: ListCollapse },
    { value: "photos", label: "Photos", icon: ImageIcon },
    { value: "videos", label: "Videos", icon: Video },
    { value: "designs", label: "Designs", icon: Palette },
    { value: "documents", label: "Documents", icon: FileText },
  ];
  
  // FIX: Helper to check for admin role
  const isAdmin = userRole === 'admin';

  // Use useCallback for fetchDeliverablesData to prevent issues with useEffect dependency
  const fetchDeliverablesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch data
      const data = await fetchdeliverablData();

      // 2. Map data to the desired format
      const mappedData = data.map((item, index) => ({
        // The id from the server is crucial for correct keying and deletion
        id: item.id || index + 1,
        name_project: item.project_name || "N/A",
        milestone_name: item.milestone_name || "N/A",
        due_date: item.due_date
          ? new Date(item.due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
          : "N/A",
        // The status field is now correctly populated
        status: item.status || "Pending Review",
        type: item.type || "File",
        file_url: item.file_url || "", 
        category: item.category ? item.category.toLowerCase() : "documents", // FIX: Ensure category is lowercase for consistent filtering
        storageType: item.storage_type || "Cloud",
        storageLink: item.storage_link || "", // Use empty string for better link checking
      }));

      // 3. Set state
      setDeliverables(mappedData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch deliverable data.");
      toast({
        title: "Error",
        description: "Failed to load deliverables. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliverablesData();
  }, [fetchDeliverablesData]);

  // FIX: Reset page when the tab or search term changes (UPDATED)
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // --- SEARCH FILTERING LOGIC (NEW) ---
  const dataFilteredBySearch = useMemo(() => {
    if (!searchTerm) {
      return deliverables;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return deliverables.filter((d) => {
      // Search by project name, milestone name, or ID (numbers/names)
      const projectNameMatch = d.name_project?.toLowerCase().includes(lowerCaseSearchTerm);
      const milestoneMatch = d.milestone_name?.toLowerCase().includes(lowerCaseSearchTerm);
      const idMatch = String(d.id)?.toLowerCase().includes(lowerCaseSearchTerm);

      return projectNameMatch || milestoneMatch || idMatch;
    });
  }, [deliverables, searchTerm]);
  // ------------------------------------

  // 1. Function to open the delete dialog
  const openDeleteDialog = (deliverable) => {
    setSelectedDeliverable(deliverable); 
    setIsDeleteDialogOpen(true); 
  };
  
  // 2. Function to handle the actual deletion (called by the dialog's button)
 const handleConfirmDelete = async () => {
  if (!selectedDeliverable) return;

  const idToDelete = selectedDeliverable.id;
  setIsDeleteDialogOpen(false);

  try {
    console.log("🟡 Deleting deliverable:", idToDelete);
    await deletedeliverable(idToDelete);

    // Update UI
    setDeliverables((prev) => prev.filter((d) => d.id !== idToDelete));

    toast({
      title: "Deleted",
      description: "Deliverable deleted successfully.",
      variant: "success",
    });
  } catch (error) {
    console.error("❌ Error deleting deliverable:", error);
    toast({
      title: "Error",
      description: "Failed to delete deliverable.",
      variant: "destructive",
    });
  } finally {
    setSelectedDeliverable(null);
  }
};

  // --- STATS CALCULATION ---
  const totalFiles = deliverables.length;
  const approvedFiles = deliverables.filter(
    (d) => d.status === "Approved"
  ).length;
  const pendingFiles = deliverables.filter(
    (d) => d.status === "Pending Review"
  ).length;
  const revisionFiles = deliverables.filter(
    (d) => d.status === "Revision Required"
  ).length;

  // --- PAGINATION & FILTERING ---
  // 1. Filter by Tab (Category) from the searched data
  const dataFilteredByTab = useMemo(() => {
    if (activeTab === "all") return dataFilteredBySearch;
    return dataFilteredBySearch.filter((d) => d.category === activeTab);
  }, [dataFilteredBySearch, activeTab]); // UPDATED: uses dataFilteredBySearch

  const totalPages = Math.ceil(dataFilteredByTab.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;

  const filteredData = dataFilteredByTab.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Handler for search input change (NEW)
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  // -------------------------------

  return (
    <div className="space-y-8 p-8 bg-gray-50 min-h-screen">
      {/* Header (UPDATED) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-3xl font-bold mb-2 text-${PRIMARY_COLOR}`}>
            Deliverables
          </h1>
          <p className="text-gray-500">
            Access all your project files and track approval status
          </p>
        </div>
                
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Total Files</p>
          <div className="flex justify-between items-center">
            <p className="text-3xl font-bold">{totalFiles}</p>
            <FileText className={`h-8 w-8 text-blue-600`} />
          </div>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Approved</p>
          <div className="flex justify-between items-center">
            <p className="text-3xl font-bold text-green-600">{approvedFiles}</p>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <div className="flex justify-between items-center">
            <p className="text-3xl font-bold text-yellow-500">{pendingFiles}</p>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Revisions</p>
          <div className="flex justify-between items-center">
            <p className="text-3xl font-bold text-red-500">{revisionFiles}</p>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      

      {/* Tabs and Table Container */}
      <div className="border rounded-lg shadow-xl bg-white">
        {/* FIX: Tabs and Controls Container (flex justify-between) */}
        <div className="border-b flex justify-between items-center p-3">
          
          {/* Tabs (Category Filter) - Left Side */}
          <div className="flex gap-4 overflow-x-auto">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.value}
                  onClick={() => setActiveTab(c.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === c.value
                    ? `bg-blue-600 text-white shadow-md`
                    : `text-gray-600 hover:bg-gray-100`
                    }`}
                >
                  <Icon
                    className={`h-4 w-4 ${activeTab === c.value ? "text-white" : `text-blue-600`
                      }`}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Search Input and Add Button - Right Side */}
          <div className="flex items-center gap-4 ml-auto"> 
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search name, project, or ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 pr-8"
              />
              {searchTerm && (
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-800 transition-colors"
                  onClick={() => setSearchTerm("")}
                  title="Clear Search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Add New Deliverable Button (Admin Only) */}
            {isAdmin && (
              <Button 
                onClick={() => navigate("/deliverables/add")} 
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Deliverable
              </Button>
            )}
          </div>
        </div>
        

        {/* Table */}
        <div className="overflow-x-auto">
        
          {loading ? (
            <div className={`p-4 flex justify-center items-center text-blue-600`}>
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading deliverables...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 font-medium">{error}</div>
          ) : filteredData.length === 0 ? (
            <div className="p-4 text-gray-500">
              No deliverables found {searchTerm && `for search "${searchTerm}" `} in the {activeTab === 'all' ? 'list' : activeTab} category.
            </div>
          ) : (
            <table className="min-w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Milestone
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Storage
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 flex items-center gap-2">
                      <div className={`h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center`}>
                        {getCategoryIcon(d.category)}
                      </div>
                      <span className="capitalize font-medium text-gray-800">
                        {d.category}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{d.name_project}</td>
                    <td className="p-3 text-gray-700">{d.milestone_name}</td>
                    <td className="p-3 text-gray-700">{d.due_date}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-gray-200 text-gray-800 font-medium">
                        {d.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded-full text-xs border border-gray-400 bg-white text-gray-700 font-medium">
                        {d.storageType}
                      </span>
                    </td>
                    <td className="p-3 flex items-center gap-1">
                      {getStatusIcon(d.status)}
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="p-3 text-right flex justify-end gap-1">
                      {/* --- External Link Button --- */}
                      <button
                        className="p-1 border rounded-md text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors disabled:opacity-50"
                        onClick={() => {
                          if (d.storageLink) {
                            // Use storageLink to open the URL
                            window.open(d.storageLink, "_blank");
                          } else {
                            toast({ title: "Error", description: "File link not available." });
                          }
                        }}
                        // Disable if storageLink is empty (falsy)
                        disabled={!d.storageLink}
                        title="Open File Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      {/* -------------------- */}
                      <button
                        className="p-1 border rounded-md text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        onClick={() => navigate(`/deliverables/view/${d.id}`)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {/* FIX: ADMIN/CLIENT ACCESS CONTROL: Show Edit and Delete only to Admin */}
                      {isAdmin && (
                        <>
                          <button
                            className="p-1 border rounded-md text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            onClick={() => navigate(`/deliverables/edit/${d.id}`)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 border rounded-md text-red-600 hover:bg-red-100 transition-colors"
                            // Calls openDeleteDialog to set the selected item and open the popup
                            onClick={() => openDeleteDialog(d)} 
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {/* ------------------------------------------------------------- */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {!loading && !error && dataFilteredByTab.length > 0 && ( // UPDATED: Check if there are any filtered results
          <div className="flex justify-between items-center p-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, dataFilteredByTab.length)} of {dataFilteredByTab.length} records
              {searchTerm && ` (filtered from ${deliverables.length})`}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 hover:bg-gray-100`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed text-blue-600 hover:bg-gray-100`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- DELETE DIALOG --- */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Deliverable</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the deliverable for project: 
                <span className="font-semibold ml-1">{selectedDeliverable?.name_project || "N/A"}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}> 
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}