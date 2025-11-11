// src/pages/Renewals.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Calendar, AlertTriangle, CheckCircle2, Globe, Server, Mail, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
  
  // Ensure the day count is not negative (minimum of 0 days)
  return diffDays > 0 ? diffDays : 0;
};


const getStatusBadge = (status, days) => {
  if (days <= 7) {
    return <Badge className="bg-gradient-to-r from-destructive to-red-400">Expiring Soon</Badge>;
  } else if (days <= 30) {
    return <Badge className="bg-gradient-to-r from-warning to-orange-400">Renewal Due</Badge>;
  } else {
    return <Badge className="bg-gradient-to-r from-success to-emerald-400">{status || "Active"}</Badge>;
  }
};


export default function Renewals() {
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
  // daysuntilrenewal is REMOVED from formData state
  const [formData, setFormData] = useState({
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

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;


  const resetForm = () => {
    // daysuntilrenewal is REMOVED from resetForm
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
    setFormErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.service.trim()) newErrors.service = "Service name is required.";
    if (!formData.provider.trim()) newErrors.provider = "Provider is required.";
    if (!formData.domain.trim()) newErrors.domain = "Domain/Account is required.";
    if (!formData.purchase_date) newErrors.purchase_date = "Purchase date is required.";
    if (!formData.renewal_date) newErrors.renewal_date = "Renewal date is required.";
    if (!formData.cost.trim()) newErrors.cost = "Cost is required.";
    // daysuntilrenewal validation is REMOVED

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

  // --- CRUD Handlers ---

 const handleAdd = async () => {
  if (!validateForm()) {
    toast({
      title: "Validation Error",
      description: "Please fill in all required fields.",
      variant: "destructive",
    });
    return;
  }

  try {
    // daysuntilrenewal is NOT in formData, so it is automatically excluded
    const { icon, iconType, purchase_date, renewal_date, ...rest } = formData;

    const apiData = {
      ...rest,
      iconType: iconType || icon,
      purchaseDate: purchase_date,
      renewalDate: renewal_date,
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
    if (!selectedRenewal || !validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // daysuntilrenewal is NOT in formData, so it is automatically excluded
      const { icon, iconType, purchase_date, renewal_date, ...restOfData } = formData;
      
      const apiData = { 
          ...restOfData, 
          icon: iconType || icon,
          purchaseDate: purchase_date, 
          renewalDate: renewal_date,   
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

 const handleDelete = async () => {
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

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (renewal) => {
    setSelectedRenewal(renewal);
    setFormData({
      service: renewal.service,
      provider: renewal.provider,
      domain: renewal.domain,
      purchase_date: formatDate(renewal.purchase_date),
      renewal_date: formatDate(renewal.renewal_date),
      // daysuntilrenewal is correctly excluded
      cost: renewal.cost,
      autoRenew: renewal.autoRenew,
      icon: renewal.iconType || renewal.icon, 
      iconType: renewal.iconType || renewal.icon,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (renewal) => { setSelectedRenewal(renewal); setIsViewDialogOpen(true); };
  const openDeleteDialog = (renewal) => { setSelectedRenewal(renewal); setIsDeleteDialogOpen(true); };
  
  const handleIconSelectChange = (value) => { setFormData(prevData => ({ ...prevData, icon: value, iconType: value })); }; 

  // --- PAGINATION CALCULATIONS ---
  const totalRecords = renewals.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  const currentRecords = useMemo(() =>
    renewals.slice(indexOfFirstRecord, indexOfLastRecord),
    [renewals, indexOfFirstRecord, indexOfLastRecord]
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

  // daysuntilrenewal is now calculated and available on renewal objects
  const upcomingRenewals = renewals.filter((r) => r.daysuntilrenewal <= 30);
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

      {/* Upcoming Renewals Alert */}
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
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          {/* Left Side: Title and Description */}
          <div>
            <CardTitle>All Services</CardTitle>
            <CardDescription>
              Complete list of your subscriptions and their renewal dates
            </CardDescription>
          </div>

          {/* Right Side: Button */}
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Renewal
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Sr/No</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Domain/Account</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Purchase Date</TableHead>
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
                      <TableCell className="font-medium">{formatDate(renewal.renewal_date)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            renewal.daysuntilrenewal <= 7
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(renewal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(renewal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(renewal)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No renewals found. Click "Add New Renewal" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* PAGINATION CONTROLS */}
          {totalRecords > recordsPerPage && (
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing **{indexOfFirstRecord + 1}** to **{Math.min(indexOfLastRecord, totalRecords)}** of **{totalRecords}** records
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

      {/* Add/Edit Dialog */}
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
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., example.com"
                maxLength={255}
              />
              {formErrors.domain && (
                <p className="text-sm text-destructive">{formErrors.domain}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
                {formErrors.purchase_date && (
                  <p className="text-sm text-destructive">{formErrors.purchase_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewalDate">Renewal Date *</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={formData.renewal_date}
                  onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                />
                {formErrors.renewal_date && (
                  <p className="text-sm text-destructive">{formErrors.renewal_date}</p>
                )}
              </div>
            </div>
            {/* The Days Until Renewal input is REMOVED from the form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
                onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
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

      {/* View Dialog */}
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

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}