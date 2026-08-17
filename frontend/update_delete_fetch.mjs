import fs from 'fs';
import path from 'path';

const jsFiles = ['courses.js', 'departments.js', 'students.js'];

for (const file of jsFiles) {
  const filePath = path.join('c:/Users/lehul/WPS Cloud/WPSDrive/14311530194245/WPSDrive/student_management_system_project/Student_Management_System/frontend/js', file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Add headers to DELETE methods
  content = content.replace(/method:\s*'DELETE'/g, "method: 'DELETE',\n                                headers: EduAuth.getAuthHeaders()");

  fs.writeFileSync(filePath, content);
  console.log(`Updated DELETE methods in ${file}`);
}
