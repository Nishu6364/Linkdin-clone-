import multer from 'multer';
import path from 'path';

// Configure storage for resume uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/resumes/'); // Uploads will be stored in public/resumes/
    },
    filename: function (req, file, cb) {
        // Generate unique filename: userId-timestamp-random.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, req.userId + '-' + uniqueSuffix + ext);
    }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
};

// Configure multer
const resumeUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

export default resumeUpload;