-- ============================================================
-- JU Student Management System — Full Schema
-- ============================================================
-- Run this file to initialise or reset the database.
-- Default admin: admin@ju.edu / Admin@2026!
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_management;

-- Drop tables in FK-safe reverse order
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS student_courses;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS departments;

-- ─── 1. Departments ──────────────────────────────────────────
CREATE TABLE departments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. Staff (teacher / admin / superadmin) ─────────────────
CREATE TABLE staff (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('teacher','admin','superadmin') NOT NULL DEFAULT 'teacher',
    department_id INT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ─── 3. Students ─────────────────────────────────────────────
CREATE TABLE students (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,
    phone         VARCHAR(20)   NULL,
    password_hash VARCHAR(255)  NULL,
    department_id INT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- ─── 4. Courses ──────────────────────────────────────────────
CREATE TABLE courses (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    code          VARCHAR(20)  NOT NULL UNIQUE,
    department_id INT NULL,
    instructor_id INT NULL,            -- FK → staff.id (teacher)
    credits       INT DEFAULT 3,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (instructor_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- ─── 5. Student ↔ Course Enrolment ───────────────────────────
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id  INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ─── 6. Grades ───────────────────────────────────────────────
CREATE TABLE grades (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    course_id   INT NOT NULL,
    grade       DECIMAL(5,2) NULL,          -- 0.00 – 100.00
    letter_grade VARCHAR(2)  NULL,          -- A, B+, C …
    graded_by   INT NULL,                   -- staff.id
    graded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_grade (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id)  ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)   ON DELETE CASCADE,
    FOREIGN KEY (graded_by)  REFERENCES staff(id)     ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO departments (id, name) VALUES
(1, 'Computer Science'),
(2, 'Business Administration'),
(3, 'Engineering'),
(4, 'Natural Sciences'),
(5, 'Arts & Humanities'),
(6, 'Mathematics');

-- Default admin account — password: Admin@2026!
-- bcrypt hash (12 rounds) of 'Admin@2026!'
INSERT INTO staff (id, name, email, password_hash, role, department_id) VALUES
(1, 'System Administrator', 'admin@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'superadmin', NULL);

-- Teachers
INSERT INTO staff (id, name, email, password_hash, role, department_id) VALUES
(2, 'Prof. Alan Turing',     'turing@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'teacher', 1),
(3, 'Prof. Donald Knuth',    'knuth@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'teacher', 1),
(4, 'Prof. Tim Berners-Lee', 'tbl@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'teacher', 1),
(5, 'Dr. Nikola Tesla',      'tesla@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'teacher', 3),
(6, 'Dr. Marie Curie',       'curie@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'teacher', 4),
(7, 'Dr. Katherine Johnson', 'kjohnson@ju.edu',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW',
 'teacher', 6);

-- Courses (instructor_id → staff.id)
INSERT INTO courses (id, name, code, department_id, instructor_id, credits, description) VALUES
(1, 'Introduction to Programming',    'CS101',  1, 2, 3, 'Foundations of computer programming and problem solving.'),
(2, 'Data Structures & Algorithms',   'CS201',  1, 3, 4, 'Core data structures, algorithm design, and complexity analysis.'),
(3, 'Web Development',                'WEB101', 1, 4, 3, 'Modern frontend and backend web application technologies.'),
(4, 'Principles of Management',       'BUS101', 2, NULL, 3, 'Fundamental management principles and organizational behavior.'),
(5, 'Microeconomics',                 'ECON101',2, NULL, 3, 'Supply, demand, market structures, and economic decision making.'),
(6, 'Circuit Analysis',               'ENG101', 3, 5, 4, 'Electrical circuits, AC/DC analysis, and network theorems.'),
(7, 'General Chemistry',              'CHEM101',4, 6, 4, 'Chemical bonding, stoichiometry, and reaction kinetics.'),
(8, 'Calculus I',                     'MATH201',6, 7, 4, 'Limits, derivatives, and integral calculus applications.');

-- Students (password hash same as above — all have password Admin@2026! for demo)
INSERT INTO students (id, name, email, phone, password_hash, department_id) VALUES
(1, 'Emma Johnson',   'emma.j@student.edu',   '+1 555 101 2020',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW', 1),
(2, 'Liam Williams',  'liam.w@student.edu',   '+1 555 202 3030',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW', 3),
(3, 'Olivia Brown',   'olivia.b@student.edu', '+1 555 303 4040',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW', 2),
(4, 'Noah Garcia',    'noah.g@student.edu',   '+1 555 404 5050',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW', 6),
(5, 'Ava Martinez',   'ava.m@student.edu',    '+1 555 505 6060',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzvdx3.jJR9L9u.K2Gc9VqhiIW', 4);

-- Enrolments
INSERT INTO student_courses (student_id, course_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 6),
(3, 4), (3, 5),
(4, 8),
(5, 7);

-- Grades
INSERT INTO grades (student_id, course_id, grade, letter_grade, graded_by) VALUES
(1, 1, 92.5, 'A',  2),
(1, 2, 87.0, 'B+', 3),
(1, 3, 95.0, 'A',  4),
(2, 6, 78.5, 'B',  5),
(3, 4, 88.0, 'B+', NULL),
(3, 5, 73.0, 'B-', NULL),
(4, 8, 91.0, 'A-', 7),
(5, 7, 85.0, 'B+', 6);
