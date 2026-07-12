// server-side file (app/api/chatbot/route.js)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const sessionStore = new Map();

const WEBSITE_CONTEXT = `
ABOUT THE SYSTEM:
Eklavya ATS (Automated Timetable Scheduler) is an AI-powered platform that automates First Year (FY) university timetable generation. It handles complex scheduling constraints including faculty availability, room allocation, lab sessions, and theory classes.

WEBSITE PAGES & NAVIGATION:

PUBLIC PAGES:
- Home Page: Landing page with hero section, workflow, system architecture, feasibility, impact, business model, tech stack, and team sections
- Sign In: Login page with role selection (Admin or Department Coordinator)
- Setup University: Initial university configuration page where admin creates the university and adds departments

ADMIN PAGES (after admin login):
- Admin Dashboard: Overview with statistics, recent activities, quick actions, and department grid
- All Schedules: View and compare schedules from all departments with analytics
- Modify Dept: Edit department information, update configurations, and manage department settings
- Notify: Send notifications and announcements to all departments or specific departments

DEPARTMENT COORDINATOR PAGES (after coordinator login):
- Department Dashboard: Department-specific overview with stats and quick actions
- Schedules: Upload Excel files with faculty, rooms, students, subjects, and time data. View generated timetables and download schedules
- Division: Manage student divisions and batches
- Faculty: Manage faculty information and assignments
- Rooms: Manage classroom and lab room allocations
- Notify: View notifications from admin

HOW TO GET STARTED:
1. Go to Setup University page from the home page
2. Admin fills in university details (name, location, contact)
3. Admin adds departments with their details
4. System generates admin credentials and department coordinator credentials
5. Admin and coordinators can now sign in using their credentials

HOW TO LOGIN:
1. Click Sign In button in the navigation bar
2. Select your role: Admin or Department Coordinator
3. Enter your email and password
4. Admin credentials are shown after university setup
5. Department coordinator credentials are auto-generated for each department

HOW TO GENERATE TIMETABLE (Department Coordinator):
1. Login as Department Coordinator
2. Go to dashboard, click upload, select Excel file with data page
3. Upload Excel file with 5 sheets: Rooms, Time, Student, Faculty, Subject
4. System validates the data and generates optimized timetable
5. View the generated schedule in grid format
6. Download the schedule as Excel file

EXCEL FILE FORMAT:
The Excel file must have 5 sheets:
- Rooms: Room names and types (Theory/Lab)
- Time: Time slots with index and slot timings
- Student: Batch names and types (Theory/Lab)
- Faculty: Faculty name, course, batch, theory hours, lab hours
- Subject: Subject type, name, theory hours, lab hours, credits

COMMON INPUT ERRORS AND VALIDATION:

ROOMS SHEET ERRORS:
1. Room name blank - Room name missing in row X. Enter valid room code (e.g., H202)
2. Invalid room format - Room name is not in valid format. Use format like H202
3. Room type missing - Room type missing at row X. Choose Theory or Lab
4. Wrong room type spelling - Invalid room type. Use exactly: Theory or Lab
5. Duplicate rooms - Room is repeated. Remove duplicates

FACULTY SHEET ERRORS:
1. No name provided - Faculty name is missing at row X
2. Duplicate names - Faculty name is already used
3. Negative or blank hours - Weekly hours must be positive number
4. Total hours mismatch - Total hours exceed weekly availability
5. Subject not in Subject sheet - Subject for faculty does not exist in Subject sheet
6. Invalid hours format - Teaching hours must be numeric values only

TIME SHEET ERRORS:
1. Invalid day name - Invalid day name. Use: Monday to Saturday
2. Start time >= end time - Start time must be earlier than end time
3. Wrong time format - Invalid time format. Use HH:MM (e.g., 09:00)
4. Overlapping slots - Time slot overlaps with another slot on same day

STUDENT SHEET ERRORS:
1. Department blank - Invalid department. Examples: COMP, IT, MECH
2. Semester out of range - Semester must be between 1-8
3. Division wrong format - Division must be letter like A, B, C
4. Invalid batch number - Batch is invalid for division. Check allowed batches
5. Duplicate entries - Student group is duplicated

SUBJECT SHEET ERRORS:
1. Blank subject name - Subject name or code missing
2. Duplicate subject code - Subject code is duplicate. Codes must be unique
3. Wrong subject type - Subject type must be Theory or Lab
4. Invalid hours - Hours per week must be a number
5. Semester invalid - Semester must be between 1-8
6. Subject-faculty mismatch - Subject assigned to faculty but not in Subject sheet

GENERAL VALIDATION ERRORS:
1. Insufficient rooms - Not enough rooms for timetable generation
2. No lab rooms - Lab subject requires Lab rooms but none available
3. Faculty unavailable - Faculty has insufficient availability for subject
4. Batch count mismatch - Lab needs specific batches but fewer defined
5. Insufficient time slots - Weekly hours insufficient for semester subjects
6. Wrong semester mapping - Subject belongs to different semester
7. Lab-Theory mismatch - Lab subject assigned to Theory-only faculty
8. Excess hours allocated - Subject has more hours than required weekly

KEY FEATURES:
- AI-powered automated timetable generation using CP-SAT solver
- Constraint satisfaction for faculty, rooms, and student batches
- Multi-department management from single admin panel
- Real-time notifications between admin and coordinators
- Schedule comparison and analytics
- Excel-based data input and output
- Responsive design for all devices
- Session management and authentication

COMMON TASKS:
- Upload schedule data: Go to Department Schedules page, click upload, select Excel file
- View all schedules: Admin goes to All Schedules page
- Send notification: Admin goes to Notify page, writes message, selects departments
- Edit department: Admin goes to Modify Dept page, selects department, updates info
- Download schedule: Go to Schedules page, click download button
`;

const getSystemPrompt = (currentPage) => `You are Eklavya, an intelligent AI assistant for the Automated Timetable Scheduler (ATS) system.

CURRENT PAGE: ${currentPage}

${WEBSITE_CONTEXT}

Your role is to help users with:
1. Navigating the website and understanding features
2. Setting up university and departments
3. Login and authentication guidance
4. Uploading schedule data and Excel file format
5. Generating and managing timetables
6. Admin and coordinator workflows
7. Troubleshooting common issues
8. Understanding system capabilities and constraints

RESPONSE GUIDELINES:
1. Keep responses SHORT and CONCISE - maximum 3-4 sentences or 4-5 steps
2. Use numbered steps when explaining processes
3. Write in plain conversational language
4. Never mention URLs or routes - use natural language like go to the Schedules page or click the Sign In button in the navbar
5. Be specific about which role (Admin or Coordinator) can access which features
6. When explaining Excel format, be clear about the 5 required sheets
7. Provide context-aware help based on the current page user is on
8. If user asks about a feature, explain what it does and how to access it
9. For off-topic questions, politely redirect: I can only help with the ATS system and university timetable scheduling
10. IMPORTANT: When user asks about generating schedule, uploading data, or Excel format, ALWAYS end your response by asking: Would you like me to generate an Excel template for you?
11. CRITICAL: If user responds with yes, yeah, sure, ok, please, or any affirmative response after being asked about template generation, respond EXACTLY with: GENERATE_TEMPLATE_NOW
12. IMPORTANT: When user asks about validation or checking Excel file, respond with ONLY: Upload your Excel file here and I will validate it for you.
13. Do NOT give long explanations - just ask to upload

EXAMPLES OF GOOD RESPONSES:
- How do I generate a schedule? Login as Department Coordinator and go to the Dashboard page. Click the upload button and select your Excel file with 5 sheets: Rooms, Time, Student, Faculty, and Subject. The system will validate the data and generate your optimized timetable. Would you like me to generate an Excel template for you?
- What is the Excel format? The Excel file needs 5 sheets: Rooms (room names and types), Time (time slots), Student (batch names and types), Faculty (faculty details and hours), and Subject (subject info and credits). Would you like me to generate an Excel template for you?
- How do I upload a schedule? Go to the Schedules page from your dashboard. Click the upload button and select your Excel file with the required 5 sheets. The system will validate and generate your timetable. Would you like me to generate an Excel template for you?
- I forgot my password: Contact your admin to reset your credentials. Admin credentials are shown during university setup, and coordinator credentials are auto-generated for each department.`;

// Use an env var for model when possible
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// small helper to call models list with timeout and fallback
async function getUsableModel(apiKey) {
  // If user configured a model, use it immediately
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;

  // try to list models but with a short timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000); // 7s
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) {
      // server responded but not ok
      console.warn('models list not ok', resp.status, await resp.text());
      return DEFAULT_MODEL;
    }
    const data = await resp.json();
    const models = data?.models || [];
    for (const m of models) {
      const methods = m.supportedGenerationMethods || [];
      if (methods.includes('generateContent')) {
        return m.name.replace(/^models\//, '') || DEFAULT_MODEL;
      }
    }
    return DEFAULT_MODEL;
  } catch (err) {
    clearTimeout(timeout);
    console.warn('listModels failed (will fallback to default):', err?.message || err);
    return DEFAULT_MODEL;
  }
}

export async function POST(request) {
  try {
    const { message, sessionId, currentPage = '/' } = await request.json();
    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId required' }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    if (!sessionStore.has(sessionId)) sessionStore.set(sessionId, new Map());
    const userSession = sessionStore.get(sessionId);
    if (userSession.has(message)) {
      return NextResponse.json({ response: userSession.get(message), cached: true });
    }

    const modelName = await getUsableModel(process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Use structured contents payload with page context
    const systemPrompt = getSystemPrompt(currentPage);
    const promptText = `${systemPrompt}\n\nUser Question: ${message}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
    };

    // generateContent can throw network / API errors
    const result = await model.generateContent(payload);

    // The SDK returns a result with a `response` you can await — be flexible in extraction
    let text = '';
    try {
      const responseObj = await result.response;
      if (typeof responseObj.text === 'function') {
        text = await responseObj.text();
      } else if (typeof responseObj.text === 'string') {
        text = responseObj.text;
      } else {
        text =
          responseObj?.output?.[0]?.content?.map(c => c?.text || '').join('') ||
          responseObj?.output?.[0]?.content?.[0]?.text ||
          JSON.stringify(responseObj).slice(0, 2000);
      }
    } catch (innerErr) {
      console.error('Error extracting text from response object:', innerErr);
      text = 'Error: Failed to parse response from model';
    }

    userSession.set(message, text);
    return NextResponse.json({ response: text, cached: false });
  } catch (error) {
    console.error('Chatbot error:', error);
    const msg = error?.message || String(error);
    
    // Handle specific error types
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please check your Gemini API billing or try again later.',
        type: 'quota_exceeded'
      }, { status: 429 });
    }
    
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json({ 
        error: 'API access denied. Please verify your API key and billing settings.',
        type: 'permission_denied'
      }, { status: 403 });
    }
    
    return NextResponse.json({ error: msg || 'Failed to process request' }, { status: 500 });
  }
}
