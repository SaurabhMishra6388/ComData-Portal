// src/pages/Renewals.jsx

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// 🛑 ADDED Search Icon
import { Bell, Calendar, AlertTriangle, CheckCircle2, Globe, Server, Mail, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Clock, Search } from "lucide-react"; 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
// Corrected Imports to include all necessary API functions for CRUD operations
import { fetchrenewalsdata, addRenewal, updateRenewaldata, RenwalsDelete } from "../../api"; 

const iconMap = {
  Globe: Globe,
  Server: Server,
  Mail: Mail,
  CheckCircle2: CheckCircle2,
};

const formatDate = (isoDateString) => {
  if (!isoDateString) return '';
  try {
    const date = new Date(isoDateString);
    if (isNaN(date)) {
      return isoDateString;
    }
    // Return format 'YYYY-MM-DD' which is required for input type="date"
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoDateString;
  }
};

/**
 * Calculates the number of days between today and a target date.
 * FIX: If the renewal date is TODAY, it returns 1 (instead of 0).
 * @param {string} isoDateString - The renewal date string (e.g., 'YYYY-MM-DD').
 * @returns {number} The number of full days until the renewal date.
 */
const calculateDaysUntilRenewal = (isoDateString) => {
  if (!isoDateString) return 9999; 
  const renewalDate = new Date(isoDateString);
  const today = new Date();
  
  // Set time to midnight for accurate day-count comparison
  today.setHours(0, 0, 0, 0);
  renewalDate.setHours(0, 0, 0, 0);

  const diffTime = renewalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // CRITICAL FIX: To handle dates *before* today returning 0, we use a different logic.
  // We want: TODAY: 1, FUTURE: > 1, PAST: 0
  if (diffDays <= 0) {
      const floorDiffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return floorDiffDays >= 0 ? 1 : 0;
  }
  
  // Return the days until renewal (always > 0 for future dates)
  return diffDays;
};

/**
 * Calculates the renewal date by adding a cycle duration to a purchase date.
 * @param {string} purchaseDateStr - The purchase date string (YYYY-MM-DD).
 * @param {number} cycleDays - The number of days in the renewal cycle.
 * @returns {string} The calculated renewal date string (YYYY-MM-DD).
 */
const calculateNewRenewalDate = (purchaseDateStr, cycleDays) => {
  if (!purchaseDateStr || !cycleDays || Number(cycleDays) <= 0) return '';
  
  try {
    const purchaseDate = new Date(purchaseDateStr);
    
    // Check for valid date
    if (isNaN(purchaseDate)) return '';

    // Convert cycleDays to an integer
    const daysToAdd = parseInt(cycleDays, 10);
    
    // Use setDate to add days, which correctly handles month/year rollovers, 
    // including leap years.
    purchaseDate.setDate(purchaseDate.getDate() + daysToAdd);

    // Format back to YYYY-MM-DD
    return purchaseDate.toISOString().split('T')[0];

  } catch (e) {
    console.error("Error calculating renewal date:", e);
    return '';
  }
};


const getStatusBadge = (status, days) => {
  // days=1 means today (due to the fix)
  if (days <= 7 && days > 0) { 
    return <Badge className="bg-gradient-to-r from-destructive to-red-400">Expiring Soon</Badge>;
  } else if (days <= 30 && days > 7) {
    return <Badge className="bg-gradient-to-r from-warning to-orange-400">Renewal Due</Badge>;
  } else if (days === 0) {
    return <Badge className="bg-destructive">Expired</Badge>; // Added Expired status
  } else {
    return <Badge className="bg-gradient-to-r from-success to-emerald-400">{status || "Active"}</Badge>;
  }
};


// 🔑 FIX: Added isAdmin prop with a default value of false for role-based access control
export default function Renewals({ isAdmin = false }) {
  const { toast } = useToast();
  const [renewals, setRenewals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  // NEW STATE: To manage the renewal cycle duration in days
  const [renewalCycleDays, setRenewalCycleDays] = useState(365); 
  
  // 🛑 NEW STATE: To manage the search query
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    service: "",
    provider: "",
    domain: "",
    purchase_date: "",
    renewal_date: "", // This will be calculated from purchase_date + renewalCycleDays
    cost: "",
    autoRenew: true,
    icon: "Globe", 
    iconType: "Globe", 
  });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;


  const resetForm = () => {
    setFormData({
      service: "",
      provider: "",
      domain: "",
      purchase_date: "",
      renewal_date: "",
      cost: "",
      autoRenew: true,
      icon: "Globe",
      iconType: "Globe",
    });
    setRenewalCycleDays(365); // Reset cycle days as well
    setFormErrors({});
  };
  
  // Function to handle changes in form data, including date calculation logic
  const handleFormChange = (name, value) => {
    setFormData(prevData => {
      let newPurchaseDate = name === 'purchase_date' ? value : prevData.purchase_date;
      let newCycleDays = name === 'renewalCycleDays' ? Number(value) : renewalCycleDays;
      let newData = { ...prevData, [name]: value };

      // Update local state if renewalCycleDays is changed (it's not in formData)
      if (name === 'renewalCycleDays') {
        setRenewalCycleDays(newCycleDays); 
      }
      
      // Calculate new renewal date if either key component changes
      if (name === 'purchase_date' || name === 'renewalCycleDays') {
        const newRenewalDate = calculateNewRenewalDate(newPurchaseDate, newCycleDays);
        newData.renewal_date = newRenewalDate;
      }
      
      return newData;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.service.trim()) newErrors.service = "Service name is required.";
    if (!formData.provider.trim()) newErrors.provider = "Provider is required.";
    if (!formData.domain.trim()) newErrors.domain = "Domain/Account is required.";
    if (!formData.purchase_date) newErrors.purchase_date = "Purchase date is required.";
    // Check if renewalCycleDays is valid
    if (!renewalCycleDays || Number(renewalCycleDays) <= 0) newErrors.renewalCycleDays = "Renewal cycle is required and must be greater than 0."; 
    // The renewal_date itself will be validated if purchase_date and cycle are present
    if (!formData.renewal_date) newErrors.renewal_date = "Renewal date could not be calculated. Check purchase date and cycle."; 
    if (!formData.cost.trim()) newErrors.cost = "Cost is required.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchrenwalsrowdata = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchrenewalsdata();

      if (Array.isArray(data)) {
        const mappedData = data.map(renewal => {
          // Get the correct renewal date string
          const renewalDateStr = renewal.renewal_date || renewal.renewalDate;
          // Get the renewal cycle, assuming the API returns a field for it
          // FALLBACK: Estimate the cycle if the field is missing
          const cycleDays = renewal.renewal_cycle_days || renewal.renewalCycleDays || estimateRenewalCycleDays(renewal.purchase_date, renewalDateStr);

          // CALCULATE DAYS AUTOMATICALLY HERE
          const daysUntil = calculateDaysUntilRenewal(renewalDateStr);
          
          return {
            id: renewal.id,
            service: renewal.service,
            provider: renewal.provider,
            domain: renewal.domain,
            purchase_date: renewal.purchase_date || renewal.purchaseDate,
            renewal_date: renewalDateStr,             
            cost: renewal.cost,
            status: renewal.status || "Active",
            autoRenew: renewal.autoRenew !== undefined ? renewal.autoRenew : renewal.auto_renew,
            icon: iconMap[renewal.iconType || renewal.icon] || Globe, 
            iconType: renewal.iconType || renewal.icon || 'Globe',
            // ✅ ADDED: The fixed renewal cycle duration
            renewalCycle: cycleDays, 
            // ADDED the calculated field to the renewal object
            daysuntilrenewal: daysUntil, 
          };
        });
        setRenewals(mappedData);
      } else {
        setRenewals([]);
      }
    } catch (err) {
      setError("Failed to fetch renewal data.");
      console.error("Fetch error:", err);
      toast({
        title: "Error",
        description: "Failed to load renewals. Please check server status.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchrenwalsrowdata();
  }, []);

  // --- Search/Filter Logic ---
  const filteredRenewals = useMemo(() => {
    if (!searchQuery) return renewals;

    const lowerCaseQuery = searchQuery.toLowerCase();

    return renewals.filter(renewal =>
      renewal.service.toLowerCase().includes(lowerCaseQuery) ||
      renewal.provider.toLowerCase().includes(lowerCaseQuery) ||
      renewal.domain.toLowerCase().includes(lowerCaseQuery)
    );
  }, [renewals, searchQuery]);
  // ---------------------------


  // --- CRUD Handlers ---

 const handleAdd = async () => {
  // 🔒 RBAC Check
  if (!isAdmin) return;
  
  if (!validateForm()) {
    toast({
      title: "Validation Error",
      description: "Please fill in all required fields and ensure the renewal date is calculated.",
      variant: "destructive",
    });
    return;
  }

  try {
    const { icon, iconType, purchase_date, renewal_date, ...rest } = formData;
    
    // 🛑 ADDED: Calculate daysuntilrenewal for the payload
    const calculatedDaysUntilRenewal = calculateDaysUntilRenewal(renewal_date);

    const apiData = {
      ...rest,
      iconType: iconType || icon,
      purchaseDate: purchase_date,
      renewalDate: renewal_date, // Send the calculated renewal_date
      renewalCycleDays: renewalCycleDays, // Send the cycle days to the backend
      // 🛑 ADDED: Include the calculated days until renewal in the payload
      daysuntilrenewal: calculatedDaysUntilRenewal,
    };

    console.log("➡️ Sending Add Renewal Data:", apiData);

    await addRenewal(apiData); 
    await fetchrenwalsrowdata();

    setIsAddDialogOpen(false);
    resetForm();
    toast({
      title: "Success",
      description: "Renewal added successfully.",
    });
  } catch (e) {
    console.error("Error adding renewal via API:", e);
    toast({
      title: "API Error",
      description:
        e.message || "Failed to add renewal. Check server connection and route.",
      variant: "destructive",
    });
  }
};

const handleEdit = async () => {
    // 🔒 RBAC Check
    if (!isAdmin) return;
    
    if (!selectedRenewal || !validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and ensure the renewal date is calculated.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { icon, iconType, purchase_date, renewal_date, ...restOfData } = formData;
      
      // ✅ FIX: Calculate daysuntilrenewal required for the updateRenewaldata API validation
      const calculatedDaysUntilRenewal = calculateDaysUntilRenewal(renewal_date);
      
      const apiData = { 
          ...restOfData, 
          icon: iconType || icon,
          purchaseDate: purchase_date, 
          renewalDate: renewal_date, // Send the calculated renewal_date  
          renewalCycleDays: renewalCycleDays, // Send the cycle days to the backend
          // 🛑 ADDED: Include the calculated days until renewal in the payload
          daysuntilrenewal: calculatedDaysUntilRenewal,
      }; 
      
      await updateRenewaldata(selectedRenewal.id, apiData);
      await fetchrenwalsrowdata();

      setIsEditDialogOpen(false);
      setSelectedRenewal(null);
      resetForm();
      toast({ title: "Success", description: "Renewal updated successfully." });

    } catch (e) {
      console.error("Error editing renewal via API:", e);
      toast({
        title: "API Error",
        description: e.message || "Failed to update renewal.",
        variant: "destructive"
      });
    }
  };

/**
 * NEW FUNCTION: Handles the action of manually renewing a service.
 * It calculates the next renewal date, updates the record, and refreshes the data.
 */
const handleRenewAction = async (renewal) => {
    // 🔒 RBAC Check
    if (!isAdmin) return;
    
    if (!renewal || !renewal.id) return;

    // 1. Get renewal cycle days from the current record's mapped data
    // Use renewal.renewalCycle (the value added in the fetch function)
    const cycleDays = renewal.renewalCycle;

    if (cycleDays <= 0) {
        toast({
            title: "Error",
            description: "Cannot renew. Renewal cycle days is 0 or less.",
            variant: "destructive",
        });
        return;
    }

    // 2. Calculate the NEXT renewal date (current renewal date + cycle days)
    const nextRenewalDate = calculateNewRenewalDate(renewal.renewal_date, cycleDays);
    
    if (!nextRenewalDate) {
        toast({
            title: "Error",
            description: "Failed to calculate the next renewal date.",
            variant: "destructive",
        });
        return;
    }

    // 3. Prepare data for API update
    const calculatedDaysUntilRenewal = calculateDaysUntilRenewal(nextRenewalDate);

    // Use the existing renewal data, but update the date fields
    const apiData = {
        service: renewal.service,
        provider: renewal.provider,
        domain: renewal.domain,
        purchaseDate: renewal.purchase_date,
        renewalDate: nextRenewalDate, // ⬅️ NEW RENEWAL DATE
        cost: renewal.cost,
        autoRenew: renewal.autoRenew,
        icon: renewal.iconType,
        renewalCycleDays: cycleDays, // Use the cycle days for the payload
        daysuntilrenewal: calculatedDaysUntilRenewal, // ⬅️ NEW DAYS UNTIL RENEWAL
    };

    try {
        await updateRenewaldata(renewal.id, apiData);
        await fetchrenwalsrowdata();

        toast({
            title: "Success",
            description: `Successfully renewed ${renewal.service} until ${nextRenewalDate}.`,
        });
    } catch (e) {
        console.error("Error performing renew action via API:", e);
        toast({
            title: "API Error",
            description: e.message || "Failed to perform renewal action.",
            variant: "destructive",
        });
    }
};

 const handleDelete = async () => {
  // 🔒 RBAC Check
  if (!isAdmin) return;
  
  if (!selectedRenewal || !selectedRenewal.id) {
    toast({
      title: "No selection",
      description: "Please select a renewal to delete.",
      variant: "destructive",
    });
    return;
  }

  const id = parseInt(selectedRenewal.id, 10);
  if (Number.isNaN(id)) {
    console.error("Invalid renewal id:", selectedRenewal.id);
    toast({
      title: "Invalid ID",
      description: "Selected renewal has an invalid id.",
      variant: "destructive",
    });
    return;
  }

  try {
    const ok = await RenwalsDelete(id); 
    if (ok) {
      await fetchrenwalsrowdata();

      setIsDeleteDialogOpen(false);
      setSelectedRenewal(null);

      toast({
        title: "Success",
        description: "Renewal deleted successfully.",
      });
    } else {
      toast({
        title: "Delete failed",
      description: "Server did not confirm deletion.",
      variant: "destructive",
      });
    }
  } catch (e) {
    console.error("Error deleting renewal via API:", e);
    toast({
      title: "API Error",
      description: e?.response?.data?.error || e.message || "Failed to delete renewal.",
      variant: "destructive",
    });
  }
};

  // Helper to estimate the cycle days for pre-filling the Edit form
  const estimateRenewalCycleDays = (purchaseDateStr, renewalDateStr) => {
      if (!purchaseDateStr || !renewalDateStr) return 365;
      
      try {
          const purchaseDate = new Date(purchaseDateStr);
          const renewalDate = new Date(renewalDateStr);
          
          if (isNaN(purchaseDate) || isNaN(renewalDate)) return 365;

          // Set time to midnight for accurate day-count comparison
          purchaseDate.setHours(0, 0, 0, 0);
          renewalDate.setHours(0, 0, 0, 0);

          const diffTime = renewalDate.getTime() - purchaseDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return diffDays > 0 ? diffDays : 365;

      } catch (e) {
          console.error("Error estimating cycle days:", e);
          return 365;
      }
  };

  const openAddDialog = () => {
    // 🔒 RBAC Check
    if (!isAdmin) return;
    
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (renewal) => {
    // 🔒 RBAC Check
    if (!isAdmin) return;
    
    setSelectedRenewal(renewal);
    
    // Estimate/determine renewal cycle days for the form
    // Use the cycle we mapped from the API (renewal.renewalCycle)
    const estimatedCycle = renewal.renewalCycle || estimateRenewalCycleDays(renewal.purchase_date, renewal.renewal_date);
    setRenewalCycleDays(estimatedCycle);

    setFormData({
      service: renewal.service,
      provider: renewal.provider,
      domain: renewal.domain,
      purchase_date: formatDate(renewal.purchase_date),
      renewal_date: formatDate(renewal.renewal_date),
      cost: renewal.cost,
      autoRenew: renewal.autoRenew,
      icon: renewal.iconType || renewal.icon, 
      iconType: renewal.iconType || renewal.icon,
      
      // ✅ The frontend requires daysuntilrenewal in the payload, so it's included here.
      daysuntilrenewal: renewal.daysuntilrenewal, 
      
    });
    setIsEditDialogOpen(true);
};

  const openViewDialog = (renewal) => { setSelectedRenewal(renewal); setIsViewDialogOpen(true); };
  const openDeleteDialog = (renewal) => { 
    // 🔒 RBAC Check
    if (!isAdmin) return;
    
    setSelectedRenewal(renewal); 
    setIsDeleteDialogOpen(true); 
  };
  
  const handleIconSelectChange = (value) => { 
    setFormData(prevData => ({ ...prevData, icon: value, iconType: value }));
  }; 

  // --- PAGINATION CALCULATIONS ---
  // 🛑 Use the filteredRenewals for pagination
  const totalRecords = filteredRenewals.length; 
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  const currentRecords = useMemo(() =>
    // 🛑 Slice from the filteredRenewals list
    filteredRenewals.slice(indexOfFirstRecord, indexOfLastRecord),
    [filteredRenewals, indexOfFirstRecord, indexOfLastRecord] // Depend on filtered list
  );

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  // -------------------------------

  const upcomingRenewals = renewals.filter((r) => r.daysuntilrenewal <= 30 && r.daysuntilrenewal > 0);
  const totalAnnualCost = renewals.reduce((sum, r) => {
    const cost = r.cost === "Free" ? 0 : parseInt(String(r.cost).replace(/[₹,]/g, "") || 0);
    return sum + cost;
  }, 0);

  // Conditional Rendering for Loading/Error
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl font-medium">Loading renewals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
        <p className="text-xl font-medium text-destructive">{error}</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Renewals & Reminders</h1>
          <p className="text-muted-foreground">
            Track and manage your subscriptions and service renewals
          </p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Services</p>
                <p className="text-3xl font-bold">{renewals.length}</p>
              </div>
              <Server className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Due in 30 Days</p>
                <p className="text-3xl font-bold text-warning">
                  {upcomingRenewals.length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Annual Cost</p>
                <p className="text-3xl font-bold text-primary">
                  ₹{totalAnnualCost.toLocaleString()}
                </p>              
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Auto-Renewal</p>
                <p className="text-3xl font-bold text-success">
                  {renewals.filter((r) => r.autoRenew).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals Alert (Uses the full renewals list) */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <CardTitle>Upcoming Renewals</CardTitle>
                <CardDescription>
                  You have {upcomingRenewals.length} service(s) renewing in the
                  next 30 days
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRenewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    {renewal.icon && <renewal.icon className="h-5 w-5 text-warning" />}
                    <div>
                      <p className="font-medium">{renewal.service}</p>
                      <p className="text-sm text-muted-foreground">
                        {renewal.domain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(renewal.renewal_date)}</p>
                    <p className="text-sm text-warning">
                      In {renewal.daysuntilrenewal} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renewals Table */}
      <Card>
        {/* UPDATED CARD HEADER: Title on left, Search and Button on right */}
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between pb-4">
          {/* Left Side: Title and Description */}
          <div className="flex flex-col space-y-2">
            <CardTitle>All Services</CardTitle>
            <CardDescription>
              Complete list of your subscriptions and their renewal dates. Showing {filteredRenewals.length} of {renewals.length} records.
            </CardDescription>
          </div>

          {/* Right Side: Search and Add Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-4">
            
            {/* 🛑 SEARCH INPUT FIELD */}
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search services, providers, or domains..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on new search
                    }}
                    className="pl-9"
                />
            </div>
            {/* ----------------------------- */}

            {/* 🔑 Add Button (Conditionally Rendered) */}
            {isAdmin && (
                <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Renewal
                </Button>
            )}
          </div>
        </CardHeader>
        {/* END OF UPDATED CARD HEADER */}
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Sr/No</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Domain/Account</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Renewal Cycle (Days)</TableHead> {/* ⬅️ NEW COLUMN */}
                <TableHead>Renewal Date</TableHead>
                <TableHead>Days Until Renewal</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Auto-Renew</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length > 0 ? (
                currentRecords.map((renewal, index) => {
                  const serialNumber = indexOfFirstRecord + index + 1;
                  const isExpired = renewal.daysuntilrenewal === 0;

                  return (
                    <TableRow key={renewal.id}>
                      <TableCell className="font-semibold text-muted-foreground">{serialNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {renewal.icon && <renewal.icon className="h-5 w-5 text-primary" />}
                          <span className="font-medium">{renewal.service}</span>
                        </div>
                      </TableCell>
                      <TableCell>{renewal.domain}</TableCell>
                      <TableCell>{renewal.provider}</TableCell>
                      <TableCell>{formatDate(renewal.purchase_date)}</TableCell>
                      <TableCell className="font-medium"> {/* ⬅️ NEW CELL */}
                         {renewal.renewalCycle} days
                      </TableCell>
                      <TableCell className="font-medium">{formatDate(renewal.renewal_date)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            renewal.daysuntilrenewal === 0
                              ? "text-destructive font-bold"
                              : renewal.daysuntilrenewal <= 7
                                ? "text-destructive font-bold"
                                : renewal.daysuntilrenewal <= 30
                                  ? "text-warning font-bold"
                                  : ""
                          }
                        >
                          {renewal.daysuntilrenewal} days
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{renewal.cost}</TableCell>
                      <TableCell>
                        {renewal.autoRenew ? (
                          <Badge variant="outline" className="text-success border-success">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(renewal.status, renewal.daysuntilrenewal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                            {/* 🔑 RENEW NOW BUTTON: Only show if admin, and expired or due soon */}
                            {isAdmin && (isExpired || renewal.daysuntilrenewal <= 30) && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    title="Renew Now (Advance Date)"
                                    onClick={() => handleRenewAction(renewal)}
                                    className={isExpired ? "text-destructive border-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"}
                                >
                                    <Clock className="h-4 w-4" />
                                </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(renewal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                            {/* 🔑 EDIT BUTTON: Only show if admin */}
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(renewal)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {/* 🔑 DELETE BUTTON: Only show if admin */}
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDeleteDialog(renewal)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? `No renewals found for "${searchQuery}".` : `No renewals found. ${isAdmin && 'Click "Add New Renewal" to get started.'}`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* PAGINATION CONTROLS */}
          {totalRecords > recordsPerPage && (
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, totalRecords)} of {totalRecords} records
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔑 Add/Edit Dialog (Only opens if isAdmin is true) */}
      {isAdmin && (
        <Dialog
          open={isAddDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedRenewal(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isAddDialogOpen ? "Add New Renewal" : "Edit Renewal"}</DialogTitle>
              <DialogDescription>
                {isAddDialogOpen ? "Add a new service renewal to track" : "Update the renewal information"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <Input
                    id="service"
                    value={formData.service}
                    onChange={(e) => handleFormChange('service', e.target.value)}
                    placeholder="e.g., Domain Registration"
                    maxLength={100}
                  />
                  {formErrors.service && (
                    <p className="text-sm text-destructive">{formErrors.service}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider *</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => handleFormChange('provider', e.target.value)}
                    placeholder="e.g., GoDaddy"
                    maxLength={100}
                  />
                  {formErrors.provider && (
                    <p className="text-sm text-destructive">{formErrors.provider}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain/Account *</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => handleFormChange('domain', e.target.value)}
                  placeholder="e.g., example.com"
                  maxLength={255}
                />
                {formErrors.domain && (
                  <p className="text-sm text-destructive">{formErrors.domain}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleFormChange('purchase_date', e.target.value)}
                  />
                  {formErrors.purchase_date && (
                    <p className="text-sm text-destructive">{formErrors.purchase_date}</p>
                  )}
                </div>
                
                {/* INPUT FIELD: Renewal Cycle Days (used for calculation) */}
                <div className="space-y-2">
                  <Label htmlFor="renewalCycleDays">Renewal Cycle (Days) *</Label>
                  <Input
                    id="renewalCycleDays"
                    type="number"
                    value={renewalCycleDays}
                    onChange={(e) => handleFormChange('renewalCycleDays', e.target.value)}
                    placeholder="e.g., 365"
                    min="1"
                  />
                  {formErrors.renewalCycleDays && (
                    <p className="text-sm text-destructive">{formErrors.renewalCycleDays}</p>
                  )}
                </div>
                
                {/* DISPLAY FIELD: Calculated Renewal Date (Read-Only) */}
                <div className="space-y-2">
                  <Label htmlFor="renewalDateDisplay">Calculated Renewal Date</Label>
                  <Input
                    id="renewalDateDisplay"
                    type="text"
                    value={formatDate(formData.renewal_date)}
                    readOnly // Make this read-only as it's calculated
                    className="bg-gray-100 dark:bg-gray-700"
                  />
                  {formErrors.renewal_date && (
                    <p className="text-sm text-destructive">{formErrors.renewal_date}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost *</Label>
                  <Input
                    id="cost"
                    value={formData.cost}
                    onChange={(e) => handleFormChange('cost', e.target.value)}
                    placeholder="e.g., ₹1,200 or Free"
                    maxLength={50}
                  />
                  {formErrors.cost && (
                    <p className="text-sm text-destructive">{formErrors.cost}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iconType">Icon Type *</Label>
                  <Select
                    value={formData.iconType || formData.icon}
                    onValueChange={handleIconSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Globe">Globe (Domain)</SelectItem>
                      <SelectItem value="Server">Server (Hosting)</SelectItem>
                      <SelectItem value="Mail">Mail (Email)</SelectItem>
                      <SelectItem value="CheckCircle2">Check Circle (SSL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => handleFormChange('autoRenew', checked)}
                />
                <Label htmlFor="autoRenew">Auto-Renew Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedRenewal(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={isAddDialogOpen ? handleAdd : handleEdit}>
                {isAddDialogOpen ? "Add Renewal" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog (Visible to all users) */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renewal Details</DialogTitle>
          </DialogHeader>
          {selectedRenewal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedRenewal.icon && <selectedRenewal.icon className="h-8 w-8 text-primary" />}
                <div>
                  <h3 className="text-lg font-semibold">{selectedRenewal.service}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRenewal.provider}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Domain/Account</p>
                  <p className="font-medium">{selectedRenewal.domain}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="font-medium">{selectedRenewal.cost}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">{formatDate(selectedRenewal.purchase_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
                  <p className="font-medium">{formatDate(selectedRenewal.renewal_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renewal Cycle (Days)</p>
                  <p className="font-medium">{selectedRenewal.renewalCycle} days</p> {/* Displaying the cycle */}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Until Renewal</p>
                  {/* Displaying the automatically calculated value */}
                  <p className="font-medium">{selectedRenewal.daysuntilrenewal} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Renew</p>
                  <p className="font-medium">{selectedRenewal.autoRenew ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                {getStatusBadge(selectedRenewal.status, selectedRenewal.daysuntilrenewal)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔑 Delete Confirmation Dialog (Only opens if isAdmin is true) */}
      {isAdmin && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Renewal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this renewal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedRenewal && (
              <div className="py-4">
                <p className="font-medium">{selectedRenewal.service}</p>
                <p className="text-sm text-muted-foreground">{selectedRenewal.domain}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}