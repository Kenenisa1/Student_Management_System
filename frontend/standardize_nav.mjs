import fs from 'fs';
import path from 'path';

const files = ['dashboard.html', 'students.html', 'departments.html', 'courses.html', 'reports.html'];

for (const file of files) {
  const filePath = path.join('c:/Users/lehul/WPS Cloud/WPSDrive/14311530194245/WPSDrive/student_management_system_project/Student_Management_System/frontend/admin', file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to find the whole <nav class="nav-links" ...> ... </nav> block
  const navRegex = /<nav class="nav-links" id="nav-links" role="navigation" aria-label="Main navigation">[\s\S]*?<\/nav>/;

  const newNav = `<nav class="nav-links" id="nav-links" role="navigation" aria-label="Main navigation">
        <a href="../index.html"    class="nav-link">🏠 Home</a>
        <a href="dashboard.html"   class="nav-link ${file === 'dashboard.html' ? 'nav-link--active' : ''}">📊 Dashboard</a>
        <a href="students.html"    class="nav-link admin-only ${file === 'students.html' ? 'nav-link--active' : ''}">👨‍🎓 Students</a>
        <a href="departments.html" class="nav-link admin-only ${file === 'departments.html' ? 'nav-link--active' : ''}">🏫 Departments</a>
        <a href="courses.html"     class="nav-link ${file === 'courses.html' ? 'nav-link--active' : ''}">📚 Courses</a>
        <a href="reports.html"     class="nav-link admin-only ${file === 'reports.html' ? 'nav-link--active' : ''}">📈 Reports</a>
      </nav>`;

  content = content.replace(navRegex, newNav);
  
  // Also ensure the Home link logo points to dashboard
  content = content.replace(/<a href="[^"]*" class="logo"/g, '<a href="dashboard.html" class="logo"');

  fs.writeFileSync(filePath, content);
  console.log(`Standardized nav in ${file}`);
}
