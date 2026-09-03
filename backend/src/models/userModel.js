import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

// ─── Register ────────────────────────────────────────────────────────────────
/**
 * Creates a new user in the appropriate table.
 * Uses parameterized queries to prevent SQL injection.
 * @param {'student'|'teacher'|'admin'|'superadmin'} role
 * @param {{ name: string, email: string, password: string, department_id?: number|null }} data
 */
const registerUser = async (role, { name, email, password, department_id = null }) => {
    const passwordHash = await bcrypt.hash(password, 12);

    if (role === 'student') {
        const sql = `INSERT INTO students (name, email, password_hash, department_id)
                     VALUES (?, ?, ?, ?)`;
        const [result] = await pool.execute(sql, [
            name.trim(),
            email.trim().toLowerCase(),
            passwordHash,
            department_id
        ]);
        return result;
    }

    // Staff roles: teacher, admin, superadmin
    const sql = `INSERT INTO staff (name, email, password_hash, role, department_id)
                 VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        role,
        department_id
    ]);
    return result;
};

// ─── Find by email ────────────────────────────────────────────────────────────
/**
 * Searches students OR staff table based on role.
 * 'any' searches both tables (used during login).
 */
const findUserByEmail = async (role, email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (role === 'student') {
        const [rows] = await pool.execute(
            `SELECT id, name, email, password_hash, department_id, created_at,
                    'student' AS role, login_attempts, locked_until, password_changed_at, totp_enabled, totp_secret
             FROM students
             WHERE email = ? AND is_deleted = FALSE`,
            [normalizedEmail]
        );
        return rows[0] || null;
    }

    if (role === 'staff' || role === 'any') {
        const [rows] = await pool.execute(
            `SELECT id, name, email, password_hash, department_id, role, created_at,
                    login_attempts, locked_until, password_changed_at, totp_enabled, totp_secret
             FROM staff
             WHERE email = ? AND is_deleted = FALSE`,
            [normalizedEmail]
        );
        return rows[0] || null;
    }

    return null;
};

// ─── Find by id ───────────────────────────────────────────────────────────────
const findUserById = async (role, id) => {
    if (role === 'student') {
        const [rows] = await pool.execute(
            `SELECT id, name, email, phone, department_id, created_at,
                    'student' AS role
             FROM students
             WHERE id = ? AND is_deleted = FALSE`,
            [id]
        );
        return rows[0] || null;
    }

    // Teacher / admin / superadmin all live in staff
    const [rows] = await pool.execute(
        `SELECT id, name, email, department_id, role, created_at
         FROM staff
         WHERE id = ? AND is_deleted = FALSE`,
        [id]
    );
    return rows[0] || null;
};

// ─── Find student's enrolled courses + grades ─────────────────────────────────
const findStudentCoursesWithGrades = async (studentId) => {
    const [rows] = await pool.execute(
        `SELECT c.id, c.name, c.code, c.credits, c.description,
                d.name AS department_name,
                s.name AS instructor_name,
                sc.enrolled_at,
                g.grade, g.letter_grade
         FROM student_courses sc
         JOIN courses c         ON c.id = sc.course_id
         LEFT JOIN departments d ON d.id = c.department_id
         LEFT JOIN staff s       ON s.id = c.instructor_id
         LEFT JOIN grades g      ON g.student_id = sc.student_id AND g.course_id = sc.course_id
         WHERE sc.student_id = ?
         ORDER BY c.code ASC`,
        [studentId]
    );
    return rows;
};

// ─── Find teacher's assigned courses + enrolled students ──────────────────────
const findTeacherCoursesWithStudents = async (teacherId) => {
    // Courses taught by this teacher
    const [courses] = await pool.execute(
        `SELECT c.id, c.name, c.code, c.credits,
                d.name AS department_name,
                COUNT(sc.student_id) AS enrolled_count
         FROM courses c
         LEFT JOIN departments d    ON d.id = c.department_id
         LEFT JOIN student_courses sc ON sc.course_id = c.id
         WHERE c.instructor_id = ?
         GROUP BY c.id
         ORDER BY c.code ASC`,
        [teacherId]
    );

    // For each course get enrolled students + grades
    for (const course of courses) {
        const [students] = await pool.execute(
            `SELECT s.id, s.name, s.email,
                    g.grade, g.letter_grade, g.graded_at
             FROM student_courses sc
             JOIN students s ON s.id = sc.student_id AND s.is_deleted = FALSE
             LEFT JOIN grades g ON g.student_id = sc.student_id AND g.course_id = sc.course_id
             WHERE sc.course_id = ?
             ORDER BY s.name ASC`,
            [course.id]
        );
        course.students = students;
    }

    return courses;
};

// ─── Update student profile ───────────────────────────────────────────────────
const updateStudentProfile = async (studentId, { name, phone }) => {
    const [result] = await pool.execute(
        `UPDATE students SET name = ?, phone = ? WHERE id = ? AND is_deleted = FALSE`,
        [name.trim(), phone || null, studentId]
    );
    return result;
};

// ─── Submit / update a grade ──────────────────────────────────────────────────
const upsertGrade = async ({ studentId, courseId, grade, letterGrade, gradedBy }) => {
    const [result] = await pool.execute(
        `INSERT INTO grades (student_id, course_id, grade, letter_grade, graded_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           grade = VALUES(grade),
           letter_grade = VALUES(letter_grade),
           graded_by = VALUES(graded_by),
           graded_at = CURRENT_TIMESTAMP`,
        [studentId, courseId, grade, letterGrade, gradedBy]
    );
    return result;
};

// ─── Compare password ─────────────────────────────────────────────────────────
const comparePassword = async (plain, hash) => {
    if (!hash) return false;
    return bcrypt.compare(plain, hash);
};

// ─── Security: Account Lockout ───────────────────────────────────────────────
const incrementLoginAttempts = async (table, id) => {
    // table must be 'students' or 'staff'
    const maxAttempts = 5;
    const lockMinutes = 15;
    
    await pool.execute(
        `UPDATE ${table} 
         SET login_attempts = login_attempts + 1,
             locked_until = IF(login_attempts + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), locked_until)
         WHERE id = ?`,
        [maxAttempts, lockMinutes, id]
    );
};

const resetLoginAttempts = async (table, id) => {
    await pool.execute(
        `UPDATE ${table} SET login_attempts = 0, locked_until = NULL WHERE id = ?`,
        [id]
    );
};

// ─── TOTP (2FA) ─────────────────────────────────────────────────────────────
const enableTotp = async (table, id, secret) => {
    await pool.execute(
        `UPDATE ${table} SET totp_secret = ?, totp_enabled = TRUE WHERE id = ?`,
        [secret, id]
    );
};

// ─── Refresh Tokens ─────────────────────────────────────────────────────────
const saveRefreshToken = async (userId, userType, tokenHash, expiresAt) => {
    await pool.execute(
        `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
        [userId, userType, tokenHash, expiresAt]
    );
};

const findRefreshToken = async (tokenHash) => {
    const [rows] = await pool.execute(`SELECT * FROM refresh_tokens WHERE token_hash = ?`, [tokenHash]);
    return rows[0] || null;
};

const revokeRefreshToken = async (tokenHash) => {
    await pool.execute(`DELETE FROM refresh_tokens WHERE token_hash = ?`, [tokenHash]);
};

export {
    registerUser,
    findUserByEmail,
    findUserById,
    findStudentCoursesWithGrades,
    findTeacherCoursesWithStudents,
    updateStudentProfile,
    upsertGrade,
    comparePassword,
    incrementLoginAttempts,
    resetLoginAttempts,
    enableTotp,
    saveRefreshToken,
    findRefreshToken,
    revokeRefreshToken
};
