import axios from "axios";
//import { getAuthHeaders } from './authUtils';
// Make sure this matches your backend server (Express / Node)
const API_URL = "http://localhost:5000";

// Create an axios instance for cleaner requests
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export const getAuthHeaders = () => {
  // 1. Get the token (replace this with your actual token retrieval logic)
  const token = localStorage.getItem("authToken");

  // 2. Return the headers object
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // 3. Return basic headers if no token (or handle unauthenticated error)
  return {
    "Content-Type": "application/json",
  };
};



export const signupUser = async (email, password, role) => {
    try {
        // 💡 FIX: Changed the endpoint from /signup to /api/signup
        const response = await fetch(`${API_URL}/api/signup`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });

        // Try parsing JSON safely
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            // Example: store token or user info if your backend returns them
            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            return { success: true, data };
        } else {
            // The server will now return a proper error message (like "This email is already registered")
            return { success: false, error: data.error || 'Signup failed' };
        }
    } catch (error) {
        console.error('API Error during signup:', error);
        return { success: false, error: 'Network error or server unreachable' };
    }
};

export const loginUser = async (email, password, role) => {
    try {
        // 💡 FIX: Ensure correct path for server endpoint
        const response = await fetch(`${API_URL}/api/login`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });

        // Try parsing JSON safely
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            // Example: Token and user data are returned from the server
            return { success: true, data };
        } else {
            return { success: false, error: data.error || 'Login failed' };
        }
    } catch (error) {
        console.error('API Error during login:', error);
        return { success: false, error: 'Network error or server unreachable' };
    }
};

// ===========================
// FETCH PROFILE DATA
// ===========================
export const fetchProfileData = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get("/api/widgets-data", {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });

    console.log("Fetched Client Profile Data:", response.data);

    if (!Array.isArray(response.data)) {
      console.warn("Expected array but got:", response.data);
      return [];
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        "Server responded with an error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("No response received. Check if backend is running.");
    } else {
      console.error("Error setting up request:", error.message);
    }
    return [];
  }
};

//add project And profile 
export const AddDataemployees = async (apiPayload) => {
  try {
    const token = localStorage.getItem("token");
    
    // 💡 CRITICAL FIX: DO NOT set "Content-Type" when sending FormData (apiPayload).
    // Axios will automatically set the correct 'multipart/form-data' boundary.
    const response = await axios.post(`${API_URL}/api/employees`, apiPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        // The rest of the headers are managed automatically by Axios for FormData
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to add employees"
    );
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/employees-delete/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Delete API success:", response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting employee with id ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

//Get all data project
export const fetchprojectData = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${API_URL}/api/project-Data`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    const project = response.data;
    console.log("✅ Fetched Project Data:", project);

    if (!Array.isArray(project)) {
      console.warn("⚠️ Data is not an array:", project);
      return [];
    }

    return project;
  } catch (error) {
    console.error("❌ Error fetching the data project:", error);
    return [];
  }
};

//project detilas
export async function fetchProjectDetailsById(id) {
  if (!id) {
    throw new Error("ID is required to fetch project data.");
  }
  
  // 🛑 THE FIX IS HERE: Change the URL to match the working server route
  const url = `${API_URL}/api/Edit-Project-data/${id}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorDetails = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : { message: response.statusText || "Unknown server error" };

      throw new Error(
        `HTTP error! Status: ${response.status}. Details: ${
          errorDetails.message || errorDetails.error || response.statusText
        }`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching project data:", error);
    throw error;
  }
}

// **Your provided and now properly exported update function:**
export const updateProfileDetails = async (projectId, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/profile-Updated/${projectId}`,
      formData,
      {
        headers: getAuthHeaders(),
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating profile with id ${projectId}:`, error);
    throw error;
  }
};

//Edit data in profile
export async function fetchProfileDetails(id) {
  if (!id) {
    throw new Error("No ID provided to fetchProfileDetails");
  }
  const apiUrl = `${API_URL}/api/edit-profile-data/${id}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Fetch Error Details (Full Text):", errorText);
    throw new Error(
      `Failed to fetch profile details (Status ${response.status}): ${response.statusText}`
    );
  }

  return await response.json();
}

//edit project API

export async function EditprojectDatat(id) {
  if (!id) {
    throw new Error("No Project ID provided to fetchProjectData");
  }

  const apiUrl = `${API_URL}/api/Edit-Project-data/${id}`;

  // 💡 Debugging: Log the final URL to confirm it matches your backend
  console.log("Attempting to fetch data from URL:", apiUrl);

  const response = await fetch(apiUrl);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Fetch Error Details (Full Text):", errorText);

    // This error will be caught in ProjectEdit.jsx's catch block
    throw new Error(
      `Failed to fetch project details (Status ${response.status}): ${response.statusText}. Check the console for server details.`
    );
  }

  const data = await response.json();

  // Map backend keys to frontend state keys
  const mappedData = {
    id: data.id,
    name: data.name_project, // Mapping name_project
    description: data.description || "", // Assuming description might be missing in backend result
    status: data.completion, // Mapping completion (e.g., status or percentage)
    progress: data.completion ? Number(data.completion) : 0, 
    startDate: data.start_date
      ? new Date(data.start_date).toISOString().split("T")[0]
      : "",
    dueDate: data.due_date
      ? new Date(data.due_date).toISOString().split("T")[0]
      : "",
    budget: data.budget || "",
    spent: data.spent || "",
    milestones: (data.milestones || []).map((m) => ({
      name: m.milestone_name,
      status: m.status,
      completed_date: m.completed_date
        ? new Date(m.completed_date).toISOString().split("T")[0]
        : "",
    })),
  };

  return mappedData;
}

//updated project data 
export const UpdateProjectData = async (projectId, projectData, milestones) => {
  try {
    const response = await axios.put(`${API_URL}/api/project/${projectId}`, {
      project: projectData, // Send project details
      milestones: milestones, // Send all milestones
    }, {
      // Assuming getAuthHeaders is a function that returns auth headers
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating project with ID ${projectId}:`, error);
    // Use the error response from the server if available
    const errorMessage = error.response?.data?.error || error.message || `Failed to update project ${projectId}.`;
    throw new Error(errorMessage);
  }
};

//delete the project data API
export const deleteProject = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/project-delete/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Delete API success:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Error deleting project with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

//fehct the deliverable
export const fetchdeliverablData = async () => {
  try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/api/deliverable-data`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

    const deliverable = response.data;

    console.log("Fetched deliverable Management:", deliverable);

    if (!Array.isArray(deliverable)) {
      console.warn("Data is not an array:", deliverable);
      return [];
    }

    return deliverable;
  } catch (error) {
    console.error("Error fetching deliverable:", error);
    return [];
  }
};

//fecht the deliverable data show the view data 
export const fetchdeliverabledata = async (deliverableId) => {
    try {
        // 1. Check if the ID is provided
        if (!deliverableId) {
            console.error("Deliverable ID is missing.");
            return [];
        }

        const token = localStorage.getItem('token');
        
        // 2. Append the deliverable ID as a query parameter
        const response = await axios.get(
            `${API_URL}/api/deliverable-view?id=${deliverableId}`, 
            {
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            }
        );

        const deliverableData = response.data;

        console.log("Fetched Deliverable Data:", deliverableData);

        if (!Array.isArray(deliverableData)) {
            console.warn("Data is not an array:", deliverableData);
            // Since the server query is fetching a single item, it might return a single object, 
            // but for safety, we return the data if it's not an array, expecting the API to return an array.
            return deliverableData ? [deliverableData] : []; 
        }

        return deliverableData;

    } catch (error) {
        console.error("Error fetching deliverable data:", error.response ? error.response.data : error.message);
        return [];
    }
};

//Updates an existing deliverable record by ID.
export const updateDeliverable = async(id, payload) => {
    // ✅ FIX: Use the 'api' instance and add the missing '/api' prefix to match the Express route
    const url = `/api/deliverable-updated/${id}`; // This is a relative path to the baseURL in 'api' instance

    try {
        // Use the configured axios instance for consistency
        const response = await api.put(url, payload);

        // Axios throws an error for 4xx/5xx status codes, so we only handle success here
        return response.data;
    } catch (error) {
        console.error('API Error in updateDeliverable:', error);
        
        // Provide better error context from the server response if available
        const errorMessage = error.response?.data?.error || error.message || `Failed to update deliverable ${id}.`;
        throw new Error(errorMessage);
    }
}

//delete the data for deliverable API
export const deletedeliverable = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/deliverable-delete/${id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting deliverable with id ${id}:`, error);
    throw error;
  }
};


//renewals show the data all API
export const fetchrenewalsdata = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await api.get("/api/renewals-data", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      withCredentials: true,
    });

    const renewals = response.data;
    console.log("✅ Fetched Renewals Data:", renewals);

    if (!Array.isArray(renewals)) {
      console.warn("⚠️ Data received is not an array:", renewals);
      return [];
    }

    const cleanedRenewals = renewals.map((renewal) => ({
      id: renewal.id,
      service: renewal.service || "Unknown Service",
      provider: renewal.provider || "Unknown Provider",
      domain: renewal.domain || "N/A",
      purchase_date: renewal.purchase_date || "N/A",
      renewal_date: renewal.renewal_date || "N/A",
      cost: renewal.cost || "Free",
      autoRenew: renewal.autoRenew ?? true,
      status: renewal.status || "Active",
      iconType: renewal.iconType || "Globe",
    }));

    return cleanedRenewals;
  } catch (error) {
    console.error("❌ Error fetching Renewals Data:", error);
    throw error;
  }
};

//Renewals add new data API
export const addRenewal = async (newRenewalData) => {
  try {
    const token = localStorage.getItem("token");

    const payload = {
      service: newRenewalData.service,
      provider: newRenewalData.provider,
      domain: newRenewalData.domain,
      purchaseDate: newRenewalData.purchaseDate || newRenewalData.purchase_date,
      renewalDate: newRenewalData.renewalDate || newRenewalData.renewal_date,
      cost: parseFloat(newRenewalData.cost) || 0, // ✅ always numeric
      autoRenew:
        newRenewalData.autoRenew ?? newRenewalData.auto_renew ?? false,
      iconType:
        newRenewalData.iconType ||
        newRenewalData.icon_type ||
        newRenewalData.icon ||
        null,
    };

    console.log("✅ Sending renewal payload:", payload);

    const response = await axios.post(`${API_URL}/api/renewals`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    console.log("✅ Renewal added successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error in addRenewal API call:",
      error.response ? error.response.data : error.message
    );
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        error.message
    );
  }
};

export const handleApiCall = async (url, options) => {
    try {
        const response = await fetch(url, options);

        // Check if the response is valid
        if (!response.ok) {
            let errorDetail = await response.text();
            try {
                // Try to parse error as JSON if content-type suggests it
                errorDetail = JSON.parse(errorDetail);
            } catch (e) {
                // Ignore parsing error, keep as text
            }
            
            throw new Error(
                `API call failed: ${response.status} ${response.statusText}`, 
                { cause: errorDetail }
            );
        }

        // Return the parsed JSON response
        return await response.json();

    } catch (error) {
        console.error("Fetch/API error:", error);
        // Re-throw the error for the component to catch and display
        throw new Error(error.cause?.message || error.message || "Network request failed.");
    }
};

//Renewals updated data API
export const updateRenewaldata = async (id, formData) => {
  try {
    const token = localStorage.getItem("token");

    // ✅ Align with backend snake_case keys
    const payload = {
      service: formData.service,
      provider: formData.provider,
      domain: formData.domain,
      purchase_date: formData.purchase_date || formData.purchaseDate,
      renewal_date: formData.renewal_date || formData.renewalDate,
      daysuntilrenewal:
        formData.daysuntilrenewal ||
        formData.daysUntilRenewal ||
        formData.days_until_renewal,
      cost: formData.cost,
      autoRenew: formData.autoRenew ?? formData.auto_renew ?? false,
      icon: formData.icon || formData.iconType || formData.icon_type || "default-icon",
    };

    console.log("🟡 Sending update payload:", payload);

    // ✅ Simple field validation
    const required = [
      "service",
      "provider",
      "domain",
      "purchase_date",
      "renewal_date",
      "cost",
      "daysuntilrenewal",
      "icon",
    ];
    const missing = required.filter((key) => payload[key] === undefined || payload[key] === "");
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    const response = await axios.put(
      `${API_URL}/api/renewals-updated/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    console.log("✅ Renewal updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error in updateRenewaldata API call:",
      error.response ? error.response.data : error.message
    );

    throw new Error(
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message
    );
  }
};

//Renwals delete data API
export const RenwalsDelete = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/renewal-delete/${id}`, {
      headers: getAuthHeaders(), // make sure this returns { Authorization: 'Bearer ...' } or {}
      withCredentials: true,
    });

    // 204 No Content is expected on success
    if (response.status === 204) return true;

    // if server returns something else (200 + body), handle accordingly
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    // more explicit error logging
    if (error.response) {
      console.error(`API error ${error.response.status}:`, error.response.data);
    } else {
      console.error("Network / Axios error:", error.message);
    }
    throw error;
  }
};