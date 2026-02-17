import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');
const DB_SAMPLE_PATH = path.join(__dirname, 'db.sample.json');

// Initialize DB if for some reason it's not present
if (!fs.existsSync(DB_PATH)) {
    console.log('Database not found. Initializing from sample...');
    try {
        if (fs.existsSync(DB_SAMPLE_PATH)) {
            const sampleData = fs.readFileSync(DB_SAMPLE_PATH, 'utf-8');
            fs.writeFileSync(DB_PATH, sampleData, 'utf-8');
        } else {
            console.error('Core failure: db.sample.json not found!');
            fs.writeFileSync(DB_PATH, JSON.stringify({ accounts: [], loans: [], householdMembers: [] }, null, 2), 'utf-8');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

app.use(cors());
app.use(bodyParser.json());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - from ${req.ip}`);
    next();
});

// Helper to read DB
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { accounts: [], loans: [], accountTypes: [] };
    }
};

// Helper to write DB
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing database:', error);
    }
};

// API Endpoints
app.get('/api/data', (req, res) => {
    try {
        const data = readDB();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

app.post('/api/save', (req, res) => {
    try {
        const newData = req.body;
        writeDB(newData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save database' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${PORT}`);
});
