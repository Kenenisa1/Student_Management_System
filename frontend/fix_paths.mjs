import fs from 'fs';
const files = ['dashboard.html', 'students.html', 'courses.html', 'departments.html', 'reports.html'];
for (const f of files) {
  const p = 'admin/' + f;
  if (!fs.existsSync(p)) continue;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/href="css\//g, 'href="../css/');
  c = c.replace(/src="js\//g, 'src="../js/');
  
  // also fix links between dashboard pages (so they don't point to nothing)
  // e.g. href="students.html" is still valid because they are all in admin/ now!
  
  // fix logo link to dashboard instead of main-page
  c = c.replace(/href="..\/main-page\/index.html"/g, 'href="dashboard.html"');
  c = c.replace(/href="main-page\/index.html"/g, 'href="dashboard.html"');
  
  fs.writeFileSync(p, c);
}
console.log('Fixed relative paths');
