import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        console.log("Auth middleware - Headers:", req.headers);
        console.log("Auth middleware - Cookies received:", req.cookies);
        console.log("Auth middleware - Origin:", req.get('Origin'));
        
        const { token } = req.cookies;
        if (!token) {
            console.log("Auth middleware - No token found in cookies");
            return res.status(401).json({ 
                message: "User does not have token",
                debug: {
                    cookiesReceived: Object.keys(req.cookies),
                    origin: req.get('Origin'),
                    userAgent: req.get('User-Agent')
                }
            });
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
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token format" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(500).json({ message: "Auth middleware error", error: error.message });
    }
};

export default isAuth;
