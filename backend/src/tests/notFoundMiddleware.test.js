import notFound from "../middleware/notFoundMiddleware.js";
import { jest } from '@jest/globals';

describe("Not Found Middleware Unit Tests", () => {
    it("should return 404 status and error message", () => {
        const req = { originalUrl: "/api/nonexistent-route" };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        notFound(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Route /api/nonexistent-route not found"
        });
        
        // Error handling middleware shouldn't pass to next() on a 404 handler
        expect(next).not.toHaveBeenCalled(); 
    });
});
