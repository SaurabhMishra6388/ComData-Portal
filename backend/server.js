// server.js
import express from "express";
import cors from "cors";
import pg, { Pool } from "pg"; // ⬅️ CHANGED: Import Pool
import bcrypt from "bcrypt";
import fs from 'fs';
import { fileURLToPath } from "url";

import multer from "multer";
import path from "path";
const { Client } = pg; // Keep Client for reference, but use Pool

// ⬅️ CHANGED: Use Pool for connection management
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "admincomdata",
  password: "Admin@123",
  port: 5432,
});

// ⬅️ CHANGED: Connect using pool
pool.on('connect', () => console.log("✅ Connected to PostgreSQL Pool"));
pool.on('error', (err) => {
    console.error("❌ Unexpected error on idle client", err);
    process.exit(1);
});

// Optional: Test initial connection
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log("✅ Pool is ready for queries.");
    } catch (err) {
        console.error("❌ Database connection error on startup:", err.stack);
        process.exit(1);
    }
})();


const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({ 
    origin: 'http://localhost:8080', // Replace with your client's address
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}));

app.use(express.json());

const SALT_ROUNDS = 10;

const generateToken = (user) => {   
    return 'DUMMY_TOKEN'; 
};

app.use((req, res, next) => {
    req.db = pool;
    next();
});


// ⬅️ CHANGED: Use pool for all queries instead of client
app.post('/api/login', async (req, res) => { 
    // 🟢 FIX: Deconstruct the role from the request body
    const { email, password, role } = req.body; 

    if (!email || !password || !role) { // 🟢 Ensure role is required
        return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    
    // 🟢 FIX: Validate that the role is one of the allowed values before querying
    const allowedRoles = ['client', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected.' });
    }

    try {
        // 🟢 FIX: Modify the SQL query to include the 'role'
        const result = await req.db.query( 
            `SELECT id, email, password_hash, role, created_at 
             FROM cd.users 
             WHERE email = $1 AND role = $2;`, // <--- Check both email AND role
            [email, role] // <--- Pass both parameters
        );

        const user = result.rows[0];

        // If the user is not found (meaning the email/role combination failed)
        if (!user) {
            // This error covers both 'email not found' or 'email found but role mismatch'
            return res.status(401).json({ error: 'Invalid credentials or role mismatch.' });
        }
        
        // Compare password hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials or role mismatch.' });
        }
        
        // Proceed with successful login
        const token = generateToken(user);
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role, 
                created_at: user.created_at,
            },
            token: token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'An unexpected error occurred during login.' });
    }
});

// CHANGED: Use pool for all queries signup of client
app.post('/api/signup', async (req, res) => { 
    const { email, password, role } = req.body;
    
    // Simple input validation
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    try {
        // 1. Hash the password (This line should now work correctly)
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS); // SALT_ROUNDS is defined globally
        
        const result = await req.db.query( // req.db.query now works
            `INSERT INTO cd.users (email, password_hash, role)
             VALUES ($1, $2, $3)
             RETURNING id, email, role, created_at;`,
            [email, password_hash, role]
        );

        const user = result.rows[0];
        
        // 3. Generate a token for immediate login
        const token = generateToken(user);
        
        // Send response (excluding the password hash)
        res.status(201).json({ 
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
            token: token
        });

    } catch (err) {
        console.error('Signup error:', err);
        // Check for unique constraint violation (e.g., email already exists)
        if (err.code === '23505') { 
            return res.status(409).json({ error: 'This email is already registered.' });
        }
        res.status(500).json({ error: 'Could not create account.' });
    }
});

app.get("/api/widgets-data", async (req, res) => {
  try {
    const queryText = `
     SELECT id, name, 
           email, 
		   phone, 
		   location, 
		   company, 
		   joined_date, 
		   status, 
		   image, 
		   total_projects, 
		   completed_projects, 
		   active_projects, 
		   total_spent, 
		   active, 
		   video_url
	FROM cd.employees_profile  where 
	active = 'true' ORDER BY  id ASC;
    `;

    const result = await pool.query(queryText); // ⬅️ Use pool
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching widgets data:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");

// ⬅️ FIX 3: Check and create the upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log(`Created uploads directory at: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the absolute path
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });
app.use("/uploads", express.static(uploadDir));
app.post("/api/employees", 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video_file', maxCount: 1 } 
  ]), 
  async (req, res) => {
    const imageFile = req.files.image ? req.files.image[0] : null;
    const videoFile = req.files.video_file ? req.files.video_file[0] : null;

    // Destructure all fields from req.body, including the 'projects' JSON string
    const {
      name,
      email,
      phone,
      location,
      company,
      total_projects,
      total_spent,
      join_date,
      projects, // This is a JSON string because the request is multipart/form-data
    } = req.body;

    const imagePath = imageFile ? `/uploads/${imageFile.filename}` : null;
    const videoPath = videoFile ? `/uploads/${videoFile.filename}` : null;

    let projectsData;
    
    // 💡 FIX 1: Manually parse the 'projects' JSON string from req.body
    try {
        projectsData = JSON.parse(projects);
    } catch (e) {
        // Clean up files and return a 400 error if the JSON is invalid
        if (imageFile) fs.unlinkSync(imageFile.path);
        if (videoFile) fs.unlinkSync(videoFile.path);
        return res.status(400).json({
            success: false,
            error: "Invalid data format: 'projects' must be a valid JSON string.",
            details: e.message
        });
    }

    // 💡 FIX 2: Use the parsed array for validation
    if (!Array.isArray(projectsData) || projectsData.length === 0) {
      // Clean up uploaded files if validation fails
      if (imageFile) fs.unlinkSync(imageFile.path);
      if (videoFile) fs.unlinkSync(videoFile.path);
      return res.status(400).json({
        success: false,
        error: "Project array is missing or empty.",
      });
    }

    // 1️⃣ Insert Employee Profile (No change)
    const employeeQueryText = `
      INSERT INTO cd.employees_profile (
        name, email, phone, location, company, image, total_projects, total_spent, video_url, joined_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const employeeQueryValues = [
      name,
      email,
      phone,
      location,
      company,
      imagePath, // Use the path from the uploaded file
      total_projects,
      total_spent,
      videoPath, // Use the path from the uploaded file
      join_date,
    ];

    // 2️⃣ Insert Projects
    const PROJECT_FIELDS_COUNT = 6; 
    let projectQueryText = `
      INSERT INTO cd.projects_details (
        name_project, email, completion, status, start_date, due_date
      )
      VALUES
    `;
    let projectQueryValues = [];
    let projectValuePlaceholders = [];

    // 💡 FIX 3: Iterate over the parsed array
    projectsData.forEach((project, index) => { 
      const baseIndex = index * PROJECT_FIELDS_COUNT;
      projectValuePlaceholders.push(
        `($${baseIndex + 1},$${baseIndex + 2},$${baseIndex + 3},$${baseIndex + 4},$${baseIndex + 5},$${baseIndex + 6})`
      );

      projectQueryValues.push(
        project.name_project || "N/A",
        project.email || email,
        project.completion == null ? null : project.completion,
        project.status || "start",
        project.start_date || null,
        project.due_date || null
      );
    });

    projectQueryText += projectValuePlaceholders.join(", ") + " RETURNING *;";

    // 3️⃣ Transaction logic
    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // A. Insert Employee Profile
      const employeeResult = await client.query(employeeQueryText, employeeQueryValues);
      const employeeRow = employeeResult.rows[0];

      // B. Insert Projects
      const projectResult = await client.query(projectQueryText, projectQueryValues);
      const insertedProjects = projectResult.rows;

      // C. Insert Milestones
      const MILESTONE_FIELDS_COUNT = 8;
      let milestoneQueryValues = [];
      let milestoneValuePlaceholders = [];
      let placeholderCount = 0;
      const employeeId = employeeRow.id; 

      // 💡 FIX 4: Iterate over the parsed array
      projectsData.forEach((proj, projectIndex) => { 
        const milestones = Array.isArray(proj.milestones) ? proj.milestones : [];
        const projectsDetailsId = insertedProjects[projectIndex]?.id; 
        
        if (!projectsDetailsId) {
            console.warn(`Could not find inserted project ID for project at index ${projectIndex}. Skipping milestones.`);
            return;
        }

        milestones.forEach((milestone) => {
          const baseIndex = placeholderCount * MILESTONE_FIELDS_COUNT; 

          milestoneValuePlaceholders.push(
            `($${baseIndex + 1},$${baseIndex + 2},$${baseIndex + 3},$${baseIndex + 4},$${baseIndex + 5},$${baseIndex + 6},$${baseIndex + 7},$${baseIndex + 8})`
          );

          milestoneQueryValues.push(
            milestone.milestone_name || "Unnamed Milestone",
            milestone.description || null,
            milestone.status || "pending",
            milestone.completed_date || null,
            milestone.responsible_party || null, 
            milestone.delay_reason || null,
            employeeId,
            projectsDetailsId
          );

          placeholderCount++;
        });
      });

      let milestoneResult = { rows: [] };
      if (milestoneQueryValues.length > 0) {
        const milestoneQueryText = `
          INSERT INTO cd.project_milestones (
            milestone_name,
            description,
            status,
            completed_date,
            responsible_party,
            delay_reason,
            employees_id,
            project_id 
          )
          VALUES
          ${milestoneValuePlaceholders.join(", ")}
          RETURNING *
        `;

        milestoneResult = await client.query(milestoneQueryText, milestoneQueryValues);
      }
      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Employee profile, projects, and milestones inserted successfully.",
        employeeData: {
            ...employeeRow,
            image: employeeRow.image ? `${req.protocol}://${req.get('host')}${employeeRow.image}` : null,
            video_url: employeeRow.video_url ? `${req.protocol}://${req.get('host')}${employeeRow.video_url}` : null,
        },
        projectData: insertedProjects,
        milestoneData: milestoneResult.rows,
      });
    } catch (err) {      
      // Rollback transaction
      if (client) await client.query("ROLLBACK");     
      
      // Clean up uploaded files
      if (imageFile) {
        try { fs.unlinkSync(imageFile.path); } catch (cleanErr) { console.error("Cleanup image error:", cleanErr); }
      }
      if (videoFile) {
        try { fs.unlinkSync(videoFile.path); } catch (cleanErr) { console.error("Cleanup video error:", cleanErr); }
      }

      console.error("Transaction Error:", err.stack);
      res.status(500).json({
        success: false,
        error: err.message || "Transaction failed and rolled back. Check server logs for database error details.",
      });
    } finally {
      if (client) client.release();
    }
});

// Delete employee (soft delete)
app.delete('/api/employees-delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE cd.employees_profile SET active = false, update_date = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id] 
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(200).json({
      message: 'Employee deleted successfully (soft delete)',
      employee: result.rows[0],
    });
  } catch (err) {
    console.error('❌ Error deleting employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET all Project details
app.get("/api/project-Data", async (req, res) => {
  try {
    const queryText = `
      SELECT DISTINCT ON (email, name_project)
    id,
    email,
    name_project,
    status,
    start_date,
    completion,
    active,
    due_date
FROM cd.projects_details 
WHERE active = 'true'
ORDER BY email, name_project, id ASC;;
    `;

    const result = await pool.query(queryText); // ⬅️ Use pool
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching project data:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

//show the details project 
// ✅ NEW: GET Project details by Project ID
// This endpoint is correctly called by the frontend's handleView(project.id)
app.get('/api/projects/details/:id', async (req, res) => {
    // The ID passed here is the Project ID from the main table list
    const projectId = parseInt(req.params.id, 10);
    
    // 1. 💡 FIX: Select employee's name, email, and company
    const sqlQuery = `
        
SELECT 
    pd.name_project,
    pd.start_date,
    pd.completion,
    pd.due_date,
    pm.milestone_name,
    pm.completed_date,
    pm.status
FROM cd.projects_details AS pd
JOIN cd.project_milestones AS pm
    ON pd.id = pm.project_id
WHERE pd.id = $1 or active = 'true'
ORDER BY pd.name_project, pm.milestone_name;
    `;

    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    try {        
        const { rows } = await pool.query(sqlQuery, [projectId]);        
        
        if (rows.length === 0) {
             return res.status(404).json({ message: `Project ID: ${projectId} not found.` });
        }
        
        // Return only the single detailed project row
        res.json(rows[0]); 

    } catch (err) {
        console.error('Database query error:', err.message);
        res.status(500).json({ 
            error: 'Failed to retrieve project data.',
            details: err.message 
        });
    }
});

// GET all contractors
app.get("/api/edit-profile-data/:id", async (req, res) => {
  try {
    const { id } = req.params; // ✅ get id from URL params

    const queryText = `
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        location, 
        company, 
        joined_date, 
        status, 
        image, 
        total_projects, 
        completed_projects, 
        active_projects, 
        total_spent, 
        active, 
        video_url
      FROM cd.employees_profile 
      WHERE id = $1;
    `;

    const result = await pool.query(queryText, [id]); // ✅ pass parameter correctly

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(result.rows[0]); // ✅ return single profile
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

// profile updated code 
app.put('/api/profile-Updated/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name,
        email,
        phone,
        location,
        company,
        joined_date,
        status,
        image,
        total_projects,
        completed_projects,
        active_projects,
        total_spent,
        video_url
    } = req.body;

    console.log('Received profile update for ID:', id);
    console.log('Data:', req.body);

    // ✅ Validate required fields
    if (!id) {
        return res.status(400).json({ error: 'ID parameter is required.' });
    }

    // This validation is the source of the 400 error if the frontend sends 'pending' or 'inactive'
    // The frontend was fixed to send only 'active' or 'suspended' (lowercase)
    const validStatuses = ['active', 'suspended'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "active" or "suspended".' });
    }

    try {
        const query = `
            UPDATE cd.employees_profile
            SET 
                name = $2,
                email = $3,
                phone = $4, 
                location = $5, 
                company = $6, 
                joined_date = $7, 
                status = $8, 
                image = $9, 
                total_projects = $10,
                completed_projects = $11,
                active_projects = $12,
                total_spent = $13,       
                video_url = $14
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
            name,
            email,
            phone,
            location,
            company,
            joined_date,
            status,
            image,
            total_projects,
            completed_projects,
            active_projects,
            total_spent,
            video_url
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile updated successfully.',
            data: result.rows[0],
        });

    } catch (err) {
        console.error('❌ Error updating user profile:', err);
        // The 500 status should catch DB errors, but the 400 from validation is handled above.
        res.status(500).json({ error: 'Internal server error.' });
    }
});

//Com data edit project 
app.get("/api/Edit-Project-data/:id", async (req, res) => {
  try {
    const { id } = req.params;
       
    const projectQuery = `SELECT 
      id, 
      name_project, 
      start_date, 
      completion, 
      status,
      due_date
    FROM cd.projects_details
    WHERE id = $1`;
    
    // Execute the query
    const projectResult = await pool.query(projectQuery, [id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projectResult.rows[0];

    // 2. Fetch Milestones
    const milestoneQuery = `SELECT milestone_name, completed_date, status FROM cd.project_milestones WHERE project_id = $1 ORDER BY completed_date`;
    const milestoneResult = await pool.query(milestoneQuery, [id]);
    
    // 3. Combine and return
    res.status(200).json({
      ...project,
      milestones: milestoneResult.rows
    });
  } catch (error) {
    console.error("Error fetching project data:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

//view data in project
app.put('/api/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { project: projectData, milestones: milestonesData } = req.body; // Expecting both project and milestones in the body

  // --- 1. Queries for Project Details Update ---
  const projectDetailsQuery = `
    UPDATE cd.projects_details
    SET
      name_project = $1,
      start_date = $2,
      completion = $3, -- Maps to projectData.progress
      status = $4,
      due_date = $5,      
      update_date = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *;
  `;
  const projectDetailsValues = [
    projectData.name,         // $1
    projectData.startDate,    // $2
    projectData.progress / 100, // $3 (assuming completion is a fraction/decimal in DB)
    projectData.status,       // $4
    projectData.dueDate,      // $5    
    projectId,                // $9
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Execute Project Details Update
    const projectDetailsResult = await client.query(projectDetailsQuery, projectDetailsValues);
    const updatedProject = projectDetailsResult.rows[0];

    if (!updatedProject) {
        throw new Error("Project Details not found for update.");
    }

    // --- 2. Loop and Update Milestones ---
    const updatedMilestones = [];
    for (const milestone of milestonesData) {
      // Only attempt to update existing milestones (which must have an 'id')
      if (!milestone.id) {
        console.warn(`Skipping milestone without ID: ${milestone.name}`);
        continue;
      }

      const milestoneQuery = `
        UPDATE cd.project_milestones
        SET
          milestone_name = $1,
          status = $2,
          completed_date = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        AND project_id = $5
        RETURNING *;
      `;
      const milestoneValues = [
        milestone.name,
        milestone.status,
        milestone.completed_date, // Note: Frontend sends 'completed_date' for the date field
        milestone.id,
        projectId,
      ];

      const milestoneResult = await client.query(milestoneQuery, milestoneValues);
      if (milestoneResult.rows[0]) {
        updatedMilestones.push(milestoneResult.rows[0]);
      }
    }
    // Handle adding new milestones here if your component supported it (omitted for brevity)

    await client.query('COMMIT');

    // Send successful response
    res.status(200).json({
      message: 'Project and Milestones updated successfully.',
      project: updatedProject,
      milestones: updatedMilestones,
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Revert changes if any query failed
    console.error('Database Transaction Error:', error.message);

    if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update project and milestones. Changes were rolled back.', details: error.message });

  } finally {
    client.release();
  }
});

// ✅ Soft Delete Project Route
app.delete('/api/project-delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE cd.projects_details 
       SET active = false, update_date = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found or already inactive.' });
    }

    res.json({
      message: 'Project deleted (soft delete) successfully.',
      project: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// GET all data deliverable
app.get('/api/deliverable-data', async (req, res) => {
    try {
        const queryText = `
            SELECT 
                p.name_project AS project_name,       -- CORRECTED: Changed alias from "Project Name" to project_name
                pm.milestone_name AS milestone_name,  -- CORRECTED: Changed alias from "Milestone Name" to milestone_name
                p.due_date AS due_date,               -- CORRECTED: Changed alias from "Due Date" to due_date
                d.type,
                d.category,
                d.storage AS storage_type,            -- CORRECTED: Changed alias from "storageType" to storage_type
                d.status AS status,
                d.id AS id,
                d.file_url AS storage_link,           -- CORRECTED: Changed alias from "storageLink" to storage_link
                d.active AS active
            FROM cd.deliverables d 
            LEFT JOIN cd.projects_details p 
                ON d.project_id = p.id
            LEFT JOIN cd.project_milestones pm 
                ON p.id = pm.project_id
            WHERE d.active = 'true'
            ORDER BY p.name_project;
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching deliverable data:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET all contractors
app.get('/api/deliverable-view', async (req, res) => {
    try {        
        const deliverableId = req.query.id; 
        
        if (!deliverableId) {
            return res.status(400).json({ error: 'Deliverable ID is required in the query parameters (e.g., /api/deliverable-view?id=123)' });
        }       
        
        const queryText = `
            SELECT 
                p.name_project AS "Project Name",
                pm.milestone_name AS "Milestone Name",
                p.due_date AS "Due Date",    
                ep.image,    
                ep.video_url,                 
                d.file_url, 
                d.Type,
                d.category,
                d.approval_date,
                d.approved_by,
                d.approved_name,
                d.Storage,
                d.status AS "Status"
            FROM cd.employees_profile ep
            LEFT JOIN cd.profiles_data pd 
                ON ep.email = pd.email
            LEFT JOIN cd.projects_details p 
                ON ep.id = p.id OR ep.email = p.email 
            LEFT JOIN cd.project_milestones pm 
                ON p.id = pm.project_id
            LEFT JOIN cd.deliverables d 
                ON p.id = d.project_id 
            WHERE d.id = $1 ---AND d.active = 'true' -- Use $1 for the parameterized ID
            ORDER BY p.name_project -- Fixed ORDER BY clause
        `;
        
        // 3. Pass the ID as the parameter for $1
        const result = await pool.query(queryText, [deliverableId]); 
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching deliverable data:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// PUT to update a deliverable
app.put('/api/deliverable-updated/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Keys must exactly match the frontend payload: status, Type, Storage, approved_name, etc.
        const { status, approval_date, approved_name, Type, Storage, file_url, category } = req.body;
        
        // Basic validation (optional but recommended)
        if (!status || !Type || !Storage || !id) {
             return res.status(400).json({ error: 'Missing required update fields (status, Type, Storage, or id).' });
        }

        const queryText = `
            UPDATE cd.deliverables
            SET
                status = $1,
                approval_date = $2,
                approved_name = $3,
                Type = $4,
                Storage = $5,
                file_url = $6,
                category = $7
            WHERE
                id = $8 AND active = 'true'
            RETURNING *;
        `;
        // Ensure values array order matches the query's $ parameters
        const values = [status, approval_date, approved_name, Type, Storage, file_url, category, id];

        const result = await pool.query(queryText, values);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Deliverable not found or is inactive' });
        }
    } catch (error) {
        console.error('Error updating deliverable data:', error);
        // Ensure the error response is always JSON
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

//delete the deliverable data 
app.delete("/api/deliverable-delete/:id", async (req, res) => {
  const { id } = req.params;

  console.log("🔥 DELETE deliverable route hit:", id); // for debugging

  try {
    const result = await pool.query(
      "UPDATE cd.deliverables SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deliverable not found." });
    }

    res.status(200).json({
      message: "Deliverable deleted successfully.",
      deliverable: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting deliverable:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


//Renewals all data show 
// ✅ Get all active renewals
app.get("/api/renewals-data", async (req, res) => {
  try {
    const queryText = `
      SELECT 
        id,
        service, 
        provider, 
        domain, 
        purchase_date,
        renewal_date,
        cost,
        autorenew AS "autoRenew",
        status,
        'Globe' AS "iconType"
      FROM cd.renewals_data
      WHERE active = TRUE
      ORDER BY id;
    `;

    const result = await pool.query(queryText);

    console.log("✅ Renewals fetched successfully:", result.rows.length);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error("❌ Error fetching renewals data:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

// --- Route Handler for Adding Renewal ---
// ✅ ROUTE: Add a new renewal
app.post("/api/renewals", async (req, res) => {
  const {
    service,
    provider,
    domain,
    purchaseDate,
    renewalDate,
    cost,
    autoRenew,
    iconType,
  } = req.body;

  // Map frontend field names to DB format
  const purchase_date = purchaseDate;
  const renewal_date = renewalDate;
  const icon = iconType;

  // ✅ Validation — no .trim() on non-strings
  const missingFields = [];

  if (!service || (typeof service === "string" && service.trim() === ""))
    missingFields.push("service");

  if (!provider || (typeof provider === "string" && provider.trim() === ""))
    missingFields.push("provider");

  if (!domain || (typeof domain === "string" && domain.trim() === ""))
    missingFields.push("domain");

  if (!purchase_date || (typeof purchase_date === "string" && purchase_date.trim() === ""))
    missingFields.push("purchaseDate");

  if (!renewal_date || (typeof renewal_date === "string" && renewal_date.trim() === ""))
    missingFields.push("renewalDate");

  if (cost === undefined || cost === null || cost === "")
    missingFields.push("cost");

  // If any missing, return 400
  if (missingFields.length > 0) {
    console.error("❌ Missing required field(s):", missingFields.join(", "));
    return res.status(400).json({
      error: `Missing required field(s): ${missingFields.join(", ")}`,
      details: "Please ensure all required fields are provided.",
    });
  }

  // ✅ Sanitize numeric and boolean values safely
  let costValue = 0;
  if (typeof cost === "string") {
    const parsed = parseFloat(cost);
    costValue = isNaN(parsed) ? 0 : parsed;
  } else if (typeof cost === "number") {
    costValue = cost;
  }

  const autoRenewValue = typeof autoRenew === "boolean" ? autoRenew : false;
  const statusValue = "Active";
  
  // ❌ REMOVED: daysUntilRenewal calculation block

  try {
    console.log("🟢 Inserting renewal with:", {
      service,
      provider,
      domain,
      purchase_date,
      renewal_date,
      costValue,
      statusValue,
      autoRenewValue,
      icon,
    });

    const queryText = `
      INSERT INTO cd.renewals_data
      (service, provider, domain, purchase_date, renewal_date, cost, status, autorenew, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `;

    const result = await pool.query(queryText, [
      service,  // $1
      provider, // $2
      domain,   // $3
      purchase_date, // $4
      renewal_date,  // $5
      costValue,     // $6
      statusValue,   // $7
      autoRenewValue, // $8
      icon          // $9
    ]);

    console.log("✅ Renewal added successfully:", result.rows[0]);
    res.json({
      id: result.rows[0].id,
      message: "Renewal added successfully",
    });
  } catch (error) {
    console.error("❌ Database Insert Error:", error);
    res.status(500).json({
      error: "Failed to add renewal to the database.",
      details: error.message,
    });
  }
});

// 3. Update Renewal Data Route (PUT /renewals/:id)
app.put('/api/renewals-updated/:id', async (req, res) => {
  const { id } = req.params;
  const renewalId = parseInt(id, 10);

  if (isNaN(renewalId)) {
    return res.status(400).send({ message: 'Invalid Renewal ID format.' });
  }

  const {
    service,
    provider,
    domain,
    purchase_date,
    renewal_date,
    cost,
    autoRenew,
    daysuntilrenewal,
    icon
  } = req.body;

  // Validation
  if (
    !service ||
    !provider ||
    !domain ||
    !purchase_date ||
    !renewal_date ||
    cost === undefined ||
    icon === undefined ||
    daysuntilrenewal === undefined
  ) {
    return res.status(400).send({ message: 'All required fields must be provided.' });
  }

  const autoRenewValue =
    typeof autoRenew === 'boolean' ? autoRenew : autoRenew === 'true';

  // ✅ Clean SQL — no invisible chars or stray whitespace
  const queryText = `
    UPDATE cd.renewals_data
    SET 
      service = $1,
      provider = $2,
      domain = $3,
      purchase_date = $4,
      renewal_date = $5,
      cost = $6,
      autorenew = $7,
      daysuntilrenewal = $8,
      icon = $9
    WHERE id = $10
    RETURNING *;
  `;

  const queryValues = [
    service,
    provider,
    domain,
    purchase_date,
    renewal_date,
    cost,
    autoRenewValue,
    daysuntilrenewal,
    icon,
    renewalId
  ];

  try {
    const result = await pool.query(queryText, queryValues);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: `Renewal with ID ${id} not found.` });
    }

    res.status(200).json({
      message: 'Renewal record updated successfully',
      updatedRenewal: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error executing update query:', err.stack);
    res.status(500).send({
      message: 'An error occurred during the update.',
      error: err.message,
      detail: err.stack.substring(0, 200)
    });
  }
});


// DELETE /api/users/:id: Delete a user
app.delete('/api/renewal-delete/:id', async (req, res) => {
  const { id } = req.params;
  const renewalId = parseInt(id, 10);
  if (Number.isNaN(renewalId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await pool.query(
      `UPDATE cd.renewals_data
       SET active = false, updated_date = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [renewalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Renewal not found' });
    }

    // no content
    return res.status(204).send();
  } catch (err) {
    console.error('Error deactivating renewal:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});