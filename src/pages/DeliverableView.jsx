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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  ImageIcon, 
  VideoIcon,
  Loader2, 
  ArrowRight, // Use ArrowRight for 'Open File' for better semantics
  Clock, // Added for Approval
  Calendar, // Added for Due Date
} from "lucide-react";

// Assuming this path and function exist and are correct
import { fetchdeliverabledata } from "../../api"; 

// --- Helper function for status color ---
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return "bg-gradient-to-r from-green-500 to-emerald-400 text-white";
    case 'pending review': // Match your Deliverables.js status
    case 'pending':
      return "bg-yellow-500 text-white";
    case 'revision required': // Match your Deliverables.js status
    case 'rejected':
      return "bg-red-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};
// -----------------------------------------------------------------

// Helper component for detail rows
const DetailItem = ({ icon: Icon, title, value, badge }) => (
    <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-gray-700">{title}</p>
        </div>
        {badge ? (
            <div>{value}</div> // Render the badge element directly
        ) : (
            <p className="text-sm text-right font-semibold text-gray-900 break-all">{value}</p>
        )}
    </div>
);


export default function DeliverableView() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const loadDeliverable = async () => {
        try {
          const data = await fetchdeliverabledata(id);
          
          if (data && data.length > 0) {
            const apiData = data[0];
            setDeliverable({
              id: id,
              project_name: apiData["Project Name"] || "N/A",
              milestone_name: apiData["Milestone Name"] || "N/A",
              due_date: apiData["Due Date"],
              status: apiData["Status"] || apiData.deliverable_status,
              file_url: apiData.file_url,
              type: apiData.Type || "N/A", 
              category: apiData.category || "N/A",
              approval_date: apiData.approval_date,
              approved_by: apiData.approved_by,
              approved_name: apiData.approved_name,
              image: apiData.image, 
              video_url: apiData.video_url,
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

  // --- Render Loading and Error States ---
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px] text-blue-600">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading Deliverable...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <h1 className="text-xl font-semibold">Error</h1>
        <p>{error}</p>
        <Button onClick={() => navigate("/deliverables")} className="mt-4" variant="outline">
          Go Back to List
        </Button>
      </div>
    );
  }
  
  if (!deliverable) {
      return null;
  }
  
  const statusClass = getStatusClass(deliverable.status);
  
  // Format dates
  const formattedDueDate = deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : "N/A";
  const formattedApprovalDate = deliverable.approval_date ? new Date(deliverable.approval_date).toLocaleDateString() : "N/A";

  // --- Main Render (Single Card) ---
  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/deliverables")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {deliverable.milestone_name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Project: <span className="font-medium text-blue-600">{deliverable.project_name}</span>
            </p>
          </div>
        </div>
        {/* Open File Button */}
        <Button 
            onClick={() => deliverable.file_url && window.open(deliverable.file_url, "_blank")}
            disabled={!deliverable.file_url}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
             <ArrowRight className="h-4 w-4 mr-2" /> Open File
        </Button>
      </div>
      
      <hr />

      {/* Single Main Card for all details */}
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Deliverable Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. General Details Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-700 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    General Details
                </h3>
                <DetailItem 
                    icon={Calendar} 
                    title="Due Date" 
                    value={formattedDueDate} 
                />
                <DetailItem 
                    icon={FileText} 
                    title="File Type" 
                    value={
                        <Badge variant="secondary" className="capitalize">
                            {deliverable.type}
                        </Badge>
                    }
                    badge
                />
                <DetailItem 
                    icon={FileText} 
                    title="Category" 
                    value={
                        <Badge variant="outline" className="capitalize">
                            {deliverable.category}
                        </Badge>
                    } 
                    badge
                />
                <DetailItem 
                    icon={Clock} 
                    title="Status" 
                    value={
                        <Badge className={`font-semibold ${statusClass}`}>
                            {deliverable.status}
                        </Badge>
                    } 
                    badge
                />
                <DetailItem 
                    icon={ArrowRight} 
                    title="File URL" 
                    value={deliverable.file_url ? 'Link Provided' : 'Not Provided'}
                />
            </div>

            {/* 2. Approval Details Section */}
            <div className="space-y-4 border-t pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8">
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-700 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Approval & Workflow
                </h3>
                <DetailItem 
                    icon={FileText} 
                    title="Approved By (Name)" 
                    value={deliverable.approved_name || "N/A"}
                />
                <DetailItem 
                    icon={FileText} 
                    title="Approved By (ID)" 
                    value={deliverable.approved_by || "N/A"}
                />
                <DetailItem 
                    icon={Calendar} 
                    title="Approval Date" 
                    value={formattedApprovalDate}
                />
            </div>

            {/* 3. Media Preview Section */}
            <div className="space-y-6 border-t pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8">
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-700 flex items-center gap-2">
                    {deliverable.image ? <ImageIcon className="h-5 w-5 text-indigo-600" /> : <VideoIcon className="h-5 w-5 text-indigo-600" />}
                    Media Preview
                </h3>

                {/* Conditional Preview Rendering */}
                {deliverable.image ? (
                    <div className="space-y-2">
                        <p className="font-medium text-sm">Image Preview</p>
                        <div className="rounded-lg overflow-hidden border shadow-inner">
                            <img
                                src={deliverable.image}
                                alt={deliverable.milestone_name}
                                className="w-full h-auto object-cover max-h-60"
                            />
                        </div>
                    </div>
                ) : deliverable.video_url ? (
                    <div className="space-y-2">
                        <p className="font-medium text-sm">Video Preview</p>
                        <div className="rounded-lg overflow-hidden border shadow-inner">
                            <video
                                src={deliverable.video_url}
                                controls
                                className="w-full h-auto max-h-60"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                        <FileText className="h-10 w-10 mb-3" />
                        <p className="text-sm">No media preview available</p>
                    </div>
                )}
            </div>

        </CardContent>
      </Card>
    </div>
  );
}