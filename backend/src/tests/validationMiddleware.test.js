import { validateStudent } from "../middleware/validationMiddleware.js";
import { jest } from '@jest/globals';

describe("Validation Middleware Unit Tests", () => {
    let req;
    let res;
    let next;

    // Reset mocks before each test
    beforeEach(() => {
        req = {
            body: {}
        };
        // Mock the Express response object methods
        res = {
            status: jest.fn().mockReturnThis(), // allows chaining like res.status().json()
            json: jest.fn()
        };
        next = jest.fn();
    });

    it("should return 400 if 'name' is missing", () => {
        req.body = { email: "test@example.com" };
        
        validateStudent(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Validation Error: 'name' and 'email' are required fields."
        });
        expect(next).not.toHaveBeenCalled(); // Ensure the request doesn't proceed
    });

    it("should return 400 if 'email' is missing", () => {
        req.body = { name: "Getachew" };
        
        validateStudent(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Validation Error: 'name' and 'email' are required fields."
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next() if both 'name' and 'email' are provided", () => {
        req.body = { name: "Getachew", email: "getachew@example.com" };
        
        validateStudent(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1); // Ensure the request proceeds to the controller
    });
});
