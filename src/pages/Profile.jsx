"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Import Input component for the search box
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search, // Import Search icon
} from "lucide-react";
import { fetchProfileData, deleteEmployee } from "../../api";
import { toast } from "@/components/ui/use-toast";

// FIX: Accept isAdmin prop from the router wrapper
export default function Profile({ isAdmin }) {
  const navigate = useNavigate();
  // Ensure this BASE_URL matches the port your backend (server.js) is running on
  const BASE_URL = "http://localhost:5000";

  const [clientData, setClientData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [open, setOpen] = useState(false);

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");

  // State for custom delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  const fetchProfilemanage = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProfileData();

      const mappedData = data.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        location: client.location,
        company: client.company,
        joined_date: client.joined_date,
        status: client.status,
        total_projects: client.total_projects,
        completed_projects: client.completed_projects,
        // The image paths are constructed correctly based on your folder structure:
        // http://localhost:5000/uploads/filename.jpg
        image: client.image
          ? `${BASE_URL}/uploads/${client.image}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              client.name
            )}&background=random&color=fff`,
        video: client.video ? `${BASE_URL}/uploads/${client.video}` : null,
      }));

      setClientData(mappedData);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to fetch client data.");
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfilemanage();
  }, []);

  const handleEditDetails = (client) => {
    const userId = client?.id;
    if (userId) {
      navigate(`/edit-profile/${userId}`, { state: { clientData: client } });
    } else {
      alert("Error: Could not find client ID to edit profile.");
    }
  };

  const handleAddDetails = () => {
    navigate("/add-profile", { state: { client: null } });
  };

  const handleDelete = (id) => {
    setClientToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  // When user confirms delete in dialog
  const confirmDelete = async () => {
    if (!clientToDeleteId) return;

    try {
      // ✅ Call backend delete API (backend should handle file deletion)
      await deleteEmployee(clientToDeleteId);

      // ✅ Update local state (remove deleted employee)
      setClientData((prevData) =>
        prevData.filter((client) => client.id !== clientToDeleteId)
      );

      // ✅ Call the fetch function to ensure the list is synced with the backend
      // await fetchProfilemanage(); // Commented out to prevent full re-fetch after successful deletion

      toast({
        title: "Deleted Successfully",
        description: `Employee with ID ${clientToDeleteId} has been deleted.`,
      });
    } catch (error) {
      console.error("❌ Error deleting employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee.",
        variant: "destructive",
      });
    } finally {
      setClientToDeleteId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return isoString.substring(0, 10);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // FIX: Directly set the client data to selectedClient when viewing details
  const handleViewDetails = (client) => {
    setSelectedClient(client); // client is the correctly mapped object with image URL
    setOpen(true);
  };

  // FIX: clientDetail is simply the selectedClient, which holds the correct data
  const clientDetail = selectedClient;

  // --- Filtering Logic (Search) ---
  const filteredClients = useMemo(() => {
    if (!searchTerm) {
      return clientData;
    }
    const lowercasedSearch = searchTerm.toLowerCase();
    return clientData.filter(
      (client) =>
        client.name.toLowerCase().includes(lowercasedSearch) ||
        client.email.toLowerCase().includes(lowercasedSearch) ||
        client.phone.toLowerCase().includes(lowercasedSearch)
    );
  }, [clientData, searchTerm]);

  // --- Pagination Logic (applied to filtered results) ---
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredClients.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredClients.length / recordsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Find the name of the client to be deleted for the dialog title
  const clientToDeleteName = clientToDeleteId
    ? clientData.find((c) => c.id === clientToDeleteId)?.name
    : "this client";

  return (
    <div className="space-y-0 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-1x0 font-bold mb-0">Client Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and view account details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Client List</CardTitle>
              <CardDescription>
                Click 'View' to see detailed client information.
              </CardDescription>
            </div>

            {/* Search and Add Buttons Container */}
            <div className="flex items-center space-x-4 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative w-full max-w-sm lg:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Admin-only button: Rendered only if isAdmin is true */}
              {isAdmin && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddDetails}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Add Profile
                </Button>
              )}
            </div>
          </CardHeader>
          {/* --- Separator --- */}
          <hr className="my-0 border-gray-200" />
          {/* ----------------- */}

          <CardContent className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Sr/No
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Image
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Company
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Joined Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Loading client data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="text-center py-8 text-red-500"
                    >
                      Error: {error}
                    </td>
                  </tr>
                ) : currentRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? `No clients found matching "${searchTerm}".`
                        : "No client data available."}
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((client, index) => (
                    <tr key={client.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">
                        {(currentPage - 1) * recordsPerPage + (index + 1)}
                      </td>

                      <td className="px-4 py-2">
                        <img
                          src={client.image}
                          alt={client.name}
                          className="h-10 w-10 rounded-full object-cover border"
                          onError={(e) => {
                            // FIX: Changed to a reliable placeholder URL
                            e.target.src =
                              "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                      </td>

                      <td className="px-4 py-2">{client.name}</td>
                      <td className="px-4 py-2">{client.email}</td>
                      <td className="px-4 py-2">{client.phone}</td>
                      <td className="px-4 py-2">{client.location}</td>
                      <td className="px-4 py-2">{client.company}</td>
                      <td className="px-4 py-2">
                        {formatDate(client.joined_date)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={getStatusClass(client.status)}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(client)}
                        >
                          View
                        </Button>

                        {/* Admin-only buttons: Rendered only if isAdmin is true */}
                        {isAdmin && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEditDetails(client)}
                              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                              className="bg-red-500 hover:bg-red-700 text-white"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredClients.length > recordsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={handlePrevPage}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <p className="text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={handleNextPage}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog - unchanged */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-4 sm:p-6">
          {clientDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {clientDetail.name}
                </DialogTitle>
                <DialogDescription>
                  Compact client overview and project summary.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* FIX: Ensure clientDetail.image is correctly used here */}
                      <img
                        src={clientDetail.image}
                        alt={clientDetail.name}
                        className="h-24 w-24 rounded-full object-cover border"
                        onError={(e) => {
                          // FIX: Changed to a reliable placeholder URL
                          e.target.src =
                            "https://placehold.co/150x150?text=No+Image";
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {clientDetail.name}
                        </h3>
                        <Badge className="mt-1 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-xs">
                          {clientDetail.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{clientDetail.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{clientDetail.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{clientDetail.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span>{clientDetail.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Joined {formatDate(clientDetail.joined_date)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-2">
                      <CardContent className="text-center p-0">
                        <p className="text-xl font-bold text-primary">
                          {clientDetail.total_projects || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Projects
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="p-2">
                      <CardContent className="text-center p-0">
                        <p className="text-xl font-bold text-green-500">
                          {clientDetail.completed_projects || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Completed
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {clientDetail.video && (
                    <video
                      controls
                      src={clientDetail.video}
                      className="rounded-lg shadow-md w-full"
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Delete Confirmation Dialog - unchanged */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-xl text-red-600">
              <Trash2 className="h-6 w-6 mr-2" /> Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              This action cannot be undone. This will permanently delete the
              client profile for **{clientToDeleteName}** and remove all their
              associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={confirmDelete}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Delete Profile
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}