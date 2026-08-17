import * as userModel from '../models/userModel.js';

// ─── GET /api/profile/me ──────────────────────────────────────────────────────
// Returns authenticated user's full profile + courses/grades
export const getMyProfile = async (req, res) => {
    try {
        const { id, role } = req.user;

        const user = await userModel.findUserById(role, id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let courses = [];
        if (role === 'student') {
            courses = await userModel.findStudentCoursesWithGrades(id);
        } else if (role === 'teacher') {
            courses = await userModel.findTeacherCoursesWithStudents(id);
        }

        return res.json({
            success: true,
            profile: {
                id:            user.id,
                name:          user.name,
                email:         user.email,
                phone:         user.phone || null,
                role:          user.role,
                department_id: user.department_id,
                created_at:    user.created_at
            },
            courses
        });
    } catch (error) {
        console.error('[profileController.getMyProfile]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── PUT /api/profile/me ──────────────────────────────────────────────────────
// Updates authenticated student's profile
export const updateMyProfile = async (req, res) => {
    try {
        const { id, role } = req.user;
        if (role !== 'student') {
            return res.status(403).json({ success: false, message: 'Only students can update their profile here.' });
        }

        const { name, phone } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'Name is required.' });
        }

        await userModel.updateStudentProfile(id, { name: String(name).trim(), phone });

        const updated = await userModel.findUserById('student', id);
        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            profile: {
                id:            updated.id,
                name:          updated.name,
                email:         updated.email,
                phone:         updated.phone || null,
                role:          updated.role,
                department_id: updated.department_id
            }
        });
    } catch (error) {
        console.error('[profileController.updateMyProfile]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/profile/grades ─────────────────────────────────────────────────
// Teacher submits or updates a grade for a student in their course
export const submitGrade = async (req, res) => {
    try {
        const { role, id: teacherId } = req.user;
        if (role !== 'teacher' && role !== 'admin' && role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only teachers can submit grades.' });
        }

        const { student_id, course_id, grade, letter_grade } = req.body;

        if (!student_id || !course_id || grade === undefined || grade === null) {
            return res.status(400).json({ success: false, message: 'student_id, course_id, and grade are required.' });
        }
        const numericGrade = parseFloat(grade);
        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
            return res.status(400).json({ success: false, message: 'Grade must be a number between 0 and 100.' });
        }

        await userModel.upsertGrade({
            studentId:   Number(student_id),
            courseId:    Number(course_id),
            grade:       numericGrade,
            letterGrade: letter_grade || null,
            gradedBy:    teacherId
        });

        return res.json({ success: true, message: 'Grade saved successfully.' });
    } catch (error) {
        console.error('[profileController.submitGrade]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};
