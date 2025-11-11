// AddProfile.jsx - Full Content
import { useState } from "react";
// Assuming these are imports for the UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
// Assuming AddDataemployees is the function causing the API call
import { AddDataemployees } from "../../api"; // Ensure this path is correct

// Import icons
import { ArrowLeft, PlusCircle, Trash2, CalendarIcon, X, CheckCircle, AlertTriangle, ChevronsDownUp, Upload } from "lucide-react"; 

// Import necessary form components for react-hook-form implementation
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Utility for conditional classnames

// Define default structure for a single Milestone entry
const defaultMilestone = {
  milestone_name: "",
  description: "",
  status: "pending",
  completed_date: undefined,
  responsible_party: "",
  delay_reason: "",
};

// Define default structure for a single Project Detail entry
const defaultProject = {
  projectEmail: "",
  projectName: "",
  projectStatus: "",
  startDate: undefined,
  dueDate: undefined,
  completionPercentage: "",
  milestones: [defaultMilestone], 
};


// --- StatusPopup Component Logic (Modal/Dialog) ---
const StatusPopup = ({ status, onClose, navigateOnSuccess }) => {
  const navigate = useNavigate();
  
  if (!status.show) return null;

  const handleClose = () => {
    onClose();
    // Navigate only after a successful submission and the user closes the popup
    if (status.type === 'success' && navigateOnSuccess) {
        navigate("/profile");
    }
  };

  const isError = status.type === 'error';
  const headerClass = isError ? 'bg-red-500/10 text-red-700' : 'bg-green-500/10 text-green-700';
  const Icon = isError ? AlertTriangle : CheckCircle; 

  return (
    // Fixed overlay for the modal
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
        <CardHeader className={cn(headerClass, 'flex flex-row items-center justify-between')}>
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6" />
            <CardTitle>{status.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="font-medium mb-3">
            {isError ? "The following issues were found:" : "The operation was completed successfully."}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground max-h-40 overflow-y-auto">
            {status.messages.map((msg, index) => (
              <li key={index} className={isError ? "text-red-600" : "text-green-600"}>
                {msg}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button onClick={handleClose}>
            {status.type === 'success' ? 'Continue' : 'Close'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
// --- END StatusPopup Component Logic ---


const AddProfile = () => {
  // --- STATE HOOKS ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // State for loading
  
  const [statusPopup, setStatusPopup] = useState({
    show: false,
    type: "", 
    title: "",
    messages: [],
  });
  // -------------------------------------------------------------

  const navigate = useNavigate();

  const defaultValues = {
    name: "",
    emailId: "",
    phone: "",
    location: "",
    companyName: "",
    totalProjects: "",
    projectsStatus: "", // This field exists in the form state
    totalSpent: "",
    joinDate: undefined,
    image: null, 
    videoUrl: null, 
    project: defaultProject, // ⬅️ Single project object
  };

  const form = useForm({
    defaultValues: defaultValues,
  });
  
  // Helper function to close the popup
  const handleClosePopup = () => {
      setStatusPopup({ ...statusPopup, show: false });
  }

  const { 
    fields: milestoneFields, 
    append: appendMilestone, 
    remove: removeMilestone 
  } = useFieldArray({
    control: form.control,
    name: `project.milestones`, 
  });

  // Helper function to format date for API (YYYY-MM-DD)
  const safeFormatDateForAPI = (dateValue) => {
    if (!dateValue) return undefined;
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, "yyyy-MM-dd"); 
    } catch (error) {
      return undefined;
    }
  };

  // Helper function to format date for HTML Input type="date"
  const safeFormatDate = (dateValue) => {
    if (!dateValue) return null;
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, "yyyy-MM-dd");
    } catch (error) {
      return "";
    }
  };

  // Helper function to format date for display in the button
  const displayFormatDate = (dateValue) => {
    if (!dateValue) return <span>Pick a date</span>;
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, "PPP");
    } catch (error) {
      return <span>Pick a date</span>;
    }
  };

  // --- onError Handler for react-hook-form validation failures ---
  const onValidationFail = (errors) => {
    const errorMessages = [];

    const collectErrors = (errorObject, prefix = "") => {
      if (!errorObject) return;

      Object.entries(errorObject).forEach(([key, error]) => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        
        if (error.message) {
          // Attempt to create a human-readable field name
          let fieldName = fullPath.split('.').pop().replace(/([A-Z])/g, ' $1').trim();
          if (/^\d+$/.test(key)) {
            fieldName = `${prefix}`;
          }
          if (fullPath.startsWith('project.')) {
            fieldName = `Project ${fieldName}`;
          }
          errorMessages.push(`[${fieldName}] ${error.message}`);
        } else if (Array.isArray(error)) {
          error.forEach((item, index) => {
            if (item) {
              const newPrefix = fullPath.endsWith('milestones') ? `Milestone #${index + 1}` : fullPath;
              collectErrors(item, newPrefix);
            }
          });
        } else if (typeof error === 'object' && error !== null) {
          collectErrors(error, fullPath);
        }
      });
    };

    collectErrors(errors);

    if (errorMessages.length > 0) {
      setStatusPopup({
        show: true,
        type: "error",
        title: "Form Validation Failed",
        messages: errorMessages,
      });
    }
    console.log("Validation Errors:", errors);
  };
  // --- END onValidationFail HANDLER ---

  // --- CORRECTED onSubmit HANDLER: Uses FormData to send files and data ---
  const onSubmit = async (formData) => {
    setStatusPopup({ ...statusPopup, show: false }); 
    setIsSubmitting(true);
    setIsUploading(true); // Treat the entire submission as uploading/processing

    try {
      const totalProjects = Number(formData.totalProjects) || 0;
      const totalSpent = Number(formData.totalSpent) || 0;
      
      const profileImageFile = formData.image?.[0]; // File object from react-hook-form
      const profileVideoFile = formData.videoUrl?.[0]; // File object from react-hook-form

      // 1. Prepare Milestones and Project data
      const project = formData.project;
      
      const formattedProject = {
        name_project: project.projectName, 
        email: formData.emailId, 
        completion: Number(project.completionPercentage) || 0,
        status: project.projectStatus,
        start_date: safeFormatDateForAPI(project.startDate),
        due_date: safeFormatDateForAPI(project.dueDate),
        
        milestones: project.milestones.map(milestone => ({
          milestone_name: milestone.milestone_name,
          description: milestone.description,
          status: milestone.status,
          completed_date: safeFormatDateForAPI(milestone.completed_date),
          responsible_party: milestone.responsible_party,
          delay_reason: milestone.delay_reason,
        })),
      };

      // The backend expects an array of projects, even though we only have one here
      const projectsArrayForAPI = [formattedProject];
      
      // 2. 🚀 Construct FormData for multipart/form-data
      const apiFormData = new FormData();
      
      // A. Append Simple Fields
      apiFormData.append('name', formData.name || "");
      apiFormData.append('email', formData.emailId || "");
      apiFormData.append('phone', formData.phone || "");
      apiFormData.append('location', formData.location || "");
      apiFormData.append('company', formData.companyName || "");
      apiFormData.append('total_projects', totalProjects);
      apiFormData.append('total_spent', totalSpent);
      apiFormData.append('join_date', safeFormatDateForAPI(formData.joinDate) || "");
      
      // B. Append Files (Keys match server.js Multer configuration)
      if (profileImageFile) {
        apiFormData.append('image', profileImageFile); // Key 'image'
      }
      if (profileVideoFile) {
        apiFormData.append('video_file', profileVideoFile); // Key 'video_file'
      }

      // C. Append COMPLEX DATA as a JSON string
      apiFormData.append('projects', JSON.stringify(projectsArrayForAPI));
      
      console.log("Sending FormData to API. Projects JSON:", JSON.stringify(projectsArrayForAPI));

      // 3. Call the main API with the FormData object
      await AddDataemployees(apiFormData);

      setStatusPopup({
        show: true,
        type: "success",
        title: "Profile Added Successfully",
        messages: ["The new profile data, project details, and milestones have been successfully saved."],
      });
      
    } catch (err) {
      console.error("Submission error:", err);
      
      // Extract a better error message if available from the server's 500 response
      const serverMessage = err.response?.data?.error || err.message;

      // Handle specific server errors (like duplicate key)
      if (serverMessage.includes('employees_profile_email_key')) {
          form.setError("emailId", {
              type: "manual",
              message: "This Email-ID is already registered. Please use a unique email or check existing profiles.",
          });
          
          setStatusPopup({
              show: true,
              type: "error",
              title: "Data Integrity Error",
              messages: ["The **Profile Email-ID** you entered is already registered in the database. Please correct and resubmit."],
          });
      } else {
          // Handle other errors (API down, network error, etc.)
          setStatusPopup({
              show: true,
              type: "error",
              title: "Submission Failed (API Error)",
              messages: [serverMessage || "Failed to add profile. Check network and server logs."],
          });
      }
      
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };
  // --- END CORRECTED onSubmit HANDLER ---

  const handleCancel = () => {
    navigate(-1); 
  };

  const isFormDisabled = isSubmitting || isUploading;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* RENDER THE STATUS POPUP HERE */}
      <StatusPopup 
        status={statusPopup} 
        onClose={handleClosePopup}
        navigateOnSuccess={true}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="hover:bg-accent"
          disabled={isFormDisabled} 
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Add New Profile</h1>
          <p className="text-muted-foreground text-lg">
            Fill in the details to add a new Profile
          </p>
        </div>
      </div>


      <Form {...form}>
        {/* Pass onValidationFail to the form handler */}
        <form onSubmit={form.handleSubmit(onSubmit, onValidationFail)} className="space-y-6">
          {/* --- Profile Details Card --- */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter profile name"
                          {...field}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailId"
                  rules={{
                    required: "Profile Email-ID is required for cross-validation.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address format."
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email-ID*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email id"
                          {...field}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Phone Number"
                          {...field}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter complete address" className="resize-none" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalProjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Projects *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Total Projects number" type="number" {...field} onChange={(e) => field.onChange(e.target.value)} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="totalSpent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Spent (₹) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter total amount" type="number" {...field} onChange={(e) => field.onChange(e.target.value)} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Join Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isFormDisabled}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {displayFormatDate(field.value)}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          {/* Using a standard HTML input for date within the Popover for simplicity */}
                          <Input
                            type="date"
                            onChange={(e) => field.onChange(
                              e.target.value ? new Date(e.target.value) : undefined
                            )
                            }
                            value={safeFormatDate(field.value) || ""}
                            disabled={isFormDisabled}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>


          {/* --- Project Details Card --- */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Project Name */}
                <FormField
                  control={form.control}
                  name={`project.projectName`}
                  rules={{ required: "Project Name is required." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Completion within % */}
                <FormField
                  control={form.control}
                  name={`project.completionPercentage`}
                  rules={{
                    required: "Completion Percentage is required.",
                    min: { value: 0, message: "Cannot be less than 0." },
                    max: { value: 100, message: "Cannot be more than 100." }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion (%) *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 75" type="number" {...field} onChange={(e) => field.onChange(e.target.value)} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project Status (Dropdown) */}
                <FormField
                  control={form.control}
                  name={`project.projectStatus`}
                  rules={{ required: "Project Status is required." }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="start">Start</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed"> Completed </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                
                <FormField
                  control={form.control}
                  name="emailId"
                  rules={{
                    required: "Profile Email-ID is required for cross-validation.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address format."
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email-ID*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email id"
                          {...field}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Start Date (Calendar) */}
                <FormField
                  control={form.control}
                  name={`project.startDate`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isFormDisabled}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {displayFormatDate(field.value)}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" >
                          <Input
                            type="date"
                            onChange={(e) => field.onChange(
                              e.target.value ? new Date(e.target.value) : undefined
                            )
                            }
                            value={safeFormatDate(field.value) || ""}
                            disabled={isFormDisabled}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Due Date (Calendar) */}
                <FormField
                  control={form.control}
                  name={`project.dueDate`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isFormDisabled}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {displayFormatDate(field.value)}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Input
                            type="date"
                            onChange={(e) => field.onChange(
                              e.target.value ? new Date(e.target.value) : undefined
                            )
                            }
                            value={safeFormatDate(field.value) || ""}
                            disabled={isFormDisabled}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>


          {/* --- Milestone Details Card --- */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Milestone Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {milestoneFields.map((item, milestoneIndex) => (
                  <div key={item.id} className="border p-4 rounded-lg space-y-4 relative">
                    {/* Remove button (only show if more than one milestone exists) */}
                    {milestoneIndex > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeMilestone(milestoneIndex)}
                        disabled={isFormDisabled} 
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}

                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Milestone #{milestoneIndex + 1}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Milestone Name */}
                      <FormField
                        control={form.control}
                        name={`project.milestones.${milestoneIndex}.milestone_name`}
                        rules={{ required: `Milestone Name is required for Milestone #${milestoneIndex + 1}.` }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Milestone Name*</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Initial Design Review" {...field} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Responsible Party */}
                      <FormField
                        control={form.control}
                        name={`project.milestones.${milestoneIndex}.responsible_party`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsible Party</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., John Doe" {...field} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Milestone Status (Select) */}
                      <FormField
                        control={form.control}
                        name={`project.milestones.${milestoneIndex}.status`}
                        rules={{ required: "Milestone Status is required." }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled} >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="delayed">Delayed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Completed Date (Calendar) */}
                      <FormField
                        control={form.control}
                        name={`project.milestones.${milestoneIndex}.completed_date`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Completed Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isFormDisabled}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {displayFormatDate(field.value)}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Input
                                  type="date"
                                  onChange={(e) => field.onChange(
                                    e.target.value ? new Date(e.target.value) : undefined
                                  )
                                  }
                                  value={safeFormatDate(field.value) || ""}
                                  disabled={isFormDisabled}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Delay Reason (Textarea) */}
                      <FormField
                        control={form.control}
                        name={`project.milestones.${milestoneIndex}.delay_reason`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Delay Reason</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Explain delay, if status is 'delayed'" className="resize-none" {...field} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendMilestone(defaultMilestone)}
                  className="flex items-center gap-2"
                  disabled={isFormDisabled}
                >
                  <PlusCircle className="h-4 w-4" /> Add Milestone
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* --- File Uploads Card --- */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>File Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Image File Upload */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Profile Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          // Update react-hook-form value with the FileList
                          onChange={(e) => onChange(e.target.files)} 
                          {...fieldProps}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Profile Video File Upload */}
                <FormField
                  control={form.control}
                  name="videoUrl" // Note: This form field name is for the file input
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Profile Video</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="video/*"
                          // Update react-hook-form value with the FileList
                          onChange={(e) => onChange(e.target.files)} 
                          {...fieldProps}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <div className="flex gap-4 pt-8">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
                  disabled={isFormDisabled} 
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 animate-bounce" /> Processing Upload...
                    </>
                  ) : isSubmitting ? (
                    "Submitting Data..."
                  ) : (
                    "Submit Form"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
                  onClick={handleCancel}
                  disabled={isFormDisabled} 
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default AddProfile;