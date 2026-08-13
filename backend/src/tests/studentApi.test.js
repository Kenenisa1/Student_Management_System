import request from 'supertest';
import app from '../app.js';
import { pool } from '../config/db.js';

describe('Student API Integration Tests', () => {
    let testStudentId;
    let testDepartmentId;
    let testCourseId;

    // After all tests finish, close the database connection pool so Jest can cleanly exit
    afterAll(async () => {
        await pool.end();
    });

    describe('Setup Test Data', () => {
        it('should create a test department', async () => {
            const res = await request(app)
                .post('/api/departments')
                .send({ name: 'Integration Test Department' });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            testDepartmentId = res.body.id;
        });

        it('should create a test course', async () => {
            const res = await request(app)
                .post('/api/courses')
                .send({ name: 'Integration Test Course', code: 'INT101', department_id: testDepartmentId });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            testCourseId = res.body.id;
        });
    });

    describe('Student CRUD Operations', () => {
        it('should create a new student successfully', async () => {
            const res = await request(app)
                .post('/api/students')
                .send({
                    name: 'Integration Test User',
                    email: `integration_${Date.now()}@test.com`, // Unique email
                    phone: '1234567890',
                    department_id: testDepartmentId
                });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            testStudentId = res.body.id;
        });

        it('should fail to create a student without an email (Validation Check)', async () => {
            const res = await request(app)
                .post('/api/students')
                .send({
                    name: 'No Email User'
                });
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
        });

        it('should fetch all students', async () => {
            const res = await request(app).get('/api/students');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBeTruthy();
        });

        it('should fetch a single student by ID', async () => {
            const res = await request(app).get(`/api/students/${testStudentId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toEqual(testStudentId);
            expect(res.body.name).toEqual('Integration Test User');
        });

        it('should update the student', async () => {
            const res = await request(app)
                .put(`/api/students/${testStudentId}`)
                .send({
                    name: 'Updated Integration User',
                    email: `updated_${Date.now()}@test.com`,
                    phone: '0987654321',
                    department_id: testDepartmentId
                });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Student updated successfully');
        });
    });

    describe('Course Assignment & Filtering', () => {
        it('should assign a course to the student', async () => {
            const res = await request(app)
                .post(`/api/students/${testStudentId}/courses`)
                .send({ course_id: testCourseId });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Course assigned successfully');
        });

        it('should search active students by department', async () => {
            const res = await request(app).get(`/api/students/department/${testDepartmentId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('Soft Deletion', () => {
        it('should soft-delete the student', async () => {
            const res = await request(app).delete(`/api/students/${testStudentId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Student deleted successfully');
        });

        it('should return 404 when trying to fetch a soft-deleted student', async () => {
            const res = await request(app).get(`/api/students/${testStudentId}`);
            expect(res.statusCode).toEqual(404);
        });
    });
});
