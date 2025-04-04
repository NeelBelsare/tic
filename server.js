const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow requests from your frontend
app.use(cors({
    origin: ['http://localhost:5500', 'https://your-frontend-url.onrender.com'] // Update with your actual frontend URLs
}));

app.use(express.json());
app.use(express.static('public'));

// Configure storage for uploaded photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `photo_${timestamp}.jpg`);
    }
});

const upload = multer({ storage });

// Endpoint to receive and save photos
app.post('/capture', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }
    
    console.log(`Photo saved: ${req.file.filename}`);
    res.status(200).json({ 
        message: 'Photo captured successfully',
        filename: req.file.filename
    });
});

// Endpoint to get list of all captured photos
app.get('/photos', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: 'Could not read photos directory' });
        }
        
        // Filter only image files and sort by date (newest first)
        const photoFiles = files
            .filter(file => file.match(/\.(jpg|jpeg|png)$/i))
            .sort((a, b) => {
                const timeA = parseInt(a.split('_')[1].split('.')[0]);
                const timeB = parseInt(b.split('_')[1].split('.')[0]);
                return timeB - timeA;
            });
            
        res.status(200).json({ photos: photoFiles });
    });
});

// Endpoint to get a specific photo
app.get('/photos/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Photo not found' });
    }
});

// Endpoint to delete all photos (for cleanup)
app.delete('/photos', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: 'Could not read photos directory' });
        }
        
        let deletedCount = 0;
        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            fs.unlink(filePath, err => {
                if (err) console.error(`Error deleting file ${file}:`, err);
                else deletedCount++;
            });
        });
        
        res.status(200).json({ 
            message: `Deleted ${deletedCount} photos`,
            totalDeleted: deletedCount
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});