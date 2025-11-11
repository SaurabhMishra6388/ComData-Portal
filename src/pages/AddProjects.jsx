import { useState } from "react";
// Assuming these are imports for the UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

// Import icons
import { ArrowLeft, PlusCircle, Trash2, CalendarIcon } from "lucide-react";

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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns"; 
import { cn } from "@/lib/utils"; // Utility for conditional classnames

// Define default structure for a single Project Detail entry
const defaultProject = {
  projectEmail: "",
  projectName: "",
  projectStatus: "",
  startDate: undefined,
  dueDate: undefined,
  completionPercentage: "",
};

const AddProfile = () => {
  const navigate = useNavigate();

  const defaultValues = {
    name: "",
    emailId: "",
    phone: "",
    location: "",
    companyName: "",
    totalProjects: "",
    projectsStatus: "",
    totalSpent: "",
    // Dynamic field array
    projects: [defaultProject],
  };

  const form = useForm({
    defaultValues: defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projects",
  });

  const onSubmit = (data) => {
    console.log("New profile data with projects:", data);
    // TODO: Add your API call or mutation here
    navigate("/profiles"); // Example redirect
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };
  
  // Helper to safely format dates, handling both Date objects and strings
  const safeFormatDate = (dateValue) => {
    if (!dateValue) return null;
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      return '';
    }
  };

  // Helper to display date in Popover button
  const displayFormatDate = (dateValue) => {
    if (!dateValue) return <span>Pick a date</span>;
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, "PPP");
    } catch (error) {
      return <span>Pick a date</span>;
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Add New Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            Fill in the details to add a new Profile
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <Input placeholder="Enter profile name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email-ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email id" {...field} />
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
                        <Input placeholder="Enter Phone Number" {...field} />
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
                        <Textarea
                          placeholder="Enter complete address"
                          className="resize-none"
                          {...field}
                        />
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
                        <Input placeholder="Enter company name" {...field} />
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
                        <Input
                          placeholder="Enter Total Projects number"
                          type="number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectsStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projects Status*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="start">Start</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="Enter total amount" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* --- Project Details Card (Dynamic Array) --- */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Details</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(defaultProject)} // Add a new project entry
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" /> Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg space-y-4 relative"
                >
                  {/* Remove Button */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <h3 className="text-lg font-semibold mb-4">
                    Project #{index + 1}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Project Name */}
                    <FormField
                      control={form.control}
                      name={`projects.${index}.projectName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Website Redesign" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name={`projects.${index}.projectEmail`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="project.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Completion within % */}
                    <FormField
                      control={form.control}
                      name={`projects.${index}.completionPercentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completion (%) *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 75"
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Project Status (Dropdown) */}
                    <FormField
                      control={form.control}
                      name={`projects.${index}.projectStatus`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Status*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="start">Start</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Start Date (Calendar) */}
                    <FormField
                      control={form.control}
                      name={`projects.${index}.startDate`}
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
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {displayFormatDate(field.value)}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              {/* Using type="date" input inside PopoverContent */}
                              <Input
                                type="date"
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                value={safeFormatDate(field.value) || ''}
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
                      name={`projects.${index}.dueDate`}
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
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {displayFormatDate(field.value)}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              {/* Using type="date" input inside PopoverContent */}
                              <Input
                                type="date"
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                value={safeFormatDate(field.value) || ''}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-center text-muted-foreground italic">
                  No projects added yet. Click 'Add Project' to begin.
                </p>
              )}
            </CardContent>
          </Card>

          {/* --- File Uploads and Submission --- */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Additional Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <Input type="file" multiple accept="image/*" />
                  <p className="text-sm text-muted-foreground">
                    Upload property images (JPG, PNG)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Upload Videos</Label>
                  <Input type="file" multiple accept="video/*" />
                  <p className="text-sm text-muted-foreground">
                    Upload property videos (MP4, MOV)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <Button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2">
                  Submit Form
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
                  onClick={handleCancel}
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