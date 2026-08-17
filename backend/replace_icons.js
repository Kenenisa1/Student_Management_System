import fs from 'fs';
import path from 'path';

const emojis = {
    '🏠': '<i data-lucide="home"></i>',
    '📚': '<i data-lucide="book"></i>',
    '👤': '<i data-lucide="user"></i>',
    '📊': '<i data-lucide="bar-chart-2"></i>',
    '👨‍🎓': '<i data-lucide="users"></i>',
    '🏫': '<i data-lucide="building"></i>',
    '📈': '<i data-lucide="trending-up"></i>',
    '🎓': '<i data-lucide="graduation-cap"></i>',
    '📋': '<i data-lucide="clipboard-list"></i>',
    '☀️': '<i data-lucide="sun"></i>',
    '🌙': '<i data-lucide="moon"></i>'
};

const lucideScript = `
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
    });
  </script>
</body>`;

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;

            // Replace emojis
            for (const [emoji, icon] of Object.entries(emojis)) {
                if (content.includes(emoji)) {
                    content = content.split(emoji).join(icon);
                    modified = true;
                }
            }

            // Insert lucide script
            if (modified && !content.includes('unpkg.com/lucide')) {
                content = content.replace('</body>', lucideScript);
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

const frontendDir = path.join(process.cwd(), 'c:\\Users\\lehul\\WPS Cloud\\WPSDrive\\14311530194245\\WPSDrive\\student_management_system_project\\Student_Management_System\\frontend');
// The process.cwd() might be wrong so let's just use absolute path
const absFrontendDir = 'c:\\Users\\lehul\\WPS Cloud\\WPSDrive\\14311530194245\\WPSDrive\\student_management_system_project\\Student_Management_System\\frontend';

walkDir(absFrontendDir);
console.log('Done!');
