import fs from 'fs';
import path from 'path';

const jsFiles = ['courses.js', 'departments.js', 'students.js', 'reports.js', 'dashboard.js'];

for (const file of jsFiles) {
  const filePath = path.join('c:/Users/lehul/WPS Cloud/WPSDrive/14311530194245/WPSDrive/student_management_system_project/Student_Management_System/frontend/js', file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. fetch(API_URL) -> fetch(API_URL, { headers: EduAuth.getAuthHeaders() })
  content = content.replace(/fetch\(API_URL\)/g, "fetch(API_URL, { headers: EduAuth.getAuthHeaders() })");
  
  // 2. fetch('http://localhost:5000/api/departments') -> fetch('http://localhost:5000/api/departments', { headers: EduAuth.getAuthHeaders() })
  content = content.replace(/fetch\('http:\/\/localhost:5000\/api\/departments'\)/g, "fetch('http://localhost:5000/api/departments', { headers: EduAuth.getAuthHeaders() })");

  // 3. fetch('http://localhost:5000/api/students') -> fetch('http://localhost:5000/api/students', { headers: EduAuth.getAuthHeaders() })
  content = content.replace(/fetch\('http:\/\/localhost:5000\/api\/students'\)/g, "fetch('http://localhost:5000/api/students', { headers: EduAuth.getAuthHeaders() })");

  // 4. fetch('http://localhost:5000/api/courses') -> fetch('http://localhost:5000/api/courses', { headers: EduAuth.getAuthHeaders() })
  content = content.replace(/fetch\('http:\/\/localhost:5000\/api\/courses'\)/g, "fetch('http://localhost:5000/api/courses', { headers: EduAuth.getAuthHeaders() })");

  // 5. Replace POST/PUT headers
  // We need to replace `headers: { 'Content-Type': 'application/json' }` 
  // with `headers: EduAuth.getAuthHeaders()`
  content = content.replace(/headers:\s*{\s*'Content-Type':\s*'application\/json'\s*}/g, "headers: EduAuth.getAuthHeaders()");

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
