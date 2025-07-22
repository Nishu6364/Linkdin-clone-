import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        console.log("Auth middleware - Cookies received:", req.cookies);
        const { token } = req.cookies;
        if (!token) {
            console.log("Auth middleware - No token found in cookies");
            return res.status(401).json({ message: "User does not have token" });
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!verifyToken) {
            console.log("Auth middleware - Token verification failed");
            return res.status(401).json({ message: "Invalid token" });
        }
        console.log("Auth middleware - Token verified successfully for user:", verifyToken.userId); 

        req.userId = verifyToken.userId;
        next();

    } catch (error) {
        console.log("Auth middleware - Error:", error.message);
        return res.status(500).json({ message: "Auth middleware error", error: error.message });
    }
};

export default isAuth;
