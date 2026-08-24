const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { execSync } = require("child_process");

const app = express();
const PORT = 3000;

app.use(express.static("public"));


/*
|--------------------------------------------------------------------------
| FILE STORAGE SETUP (ANDROID DOWNLOAD / LOCAL FALLBACK)
|--------------------------------------------------------------------------
*/

function getUploadDir() {
    const androidDownload = "/sdcard/Download";
    const termuxStorageDownload = path.join(os.homedir(), "storage", "downloads");
    const localUploads = path.join(__dirname, "uploads");

    if (fs.existsSync(androidDownload)) {
        try {
            fs.accessSync(androidDownload, fs.constants.R_OK | fs.constants.W_OK);
            return androidDownload;
        } catch (e) {}
    }

    if (fs.existsSync(termuxStorageDownload)) {
        try {
            fs.accessSync(termuxStorageDownload, fs.constants.R_OK | fs.constants.W_OK);
            return termuxStorageDownload;
        } catch (e) {}
    }

    if (!fs.existsSync(localUploads)) {
        fs.mkdirSync(localUploads, { recursive: true });
    }

    return localUploads;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = getUploadDir();
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Safe filename handling
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, ext);
        const sanitizedBase = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, "_");
        const finalName = `${sanitizedBase}${ext}`;
        cb(null, finalName || `file_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 * 5 } // 5GB max limit
});


/*
|--------------------------------------------------------------------------
| NETWORK
|--------------------------------------------------------------------------
*/

function getLocalIP() {

    const interfaces =
        os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {

        for (const iface of interfaces[name]) {

            if (
                iface.family === "IPv4" &&
                !iface.internal
            ) {
                return iface.address;
            }

        }

    }

    return "Tidak ditemukan";

}


/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

function getStorageInfo() {

    try {

        const output = execSync(
            "df -k /data/data/com.termux/files/home | tail -1"
        )
        .toString()
        .trim();

        const parts =
            output.split(/\s+/);

        const total =
            parseInt(parts[1]) * 1024;

        const used =
            parseInt(parts[2]) * 1024;

        const available =
            parseInt(parts[3]) * 1024;

        const usage =
            parseInt(
                parts[4].replace("%", "")
            );

        return {
            total,
            used,
            available,
            usage
        };

    } catch (error) {

        return {
            total: 0,
            used: 0,
            available: 0,
            usage: 0
        };

    }

}


/*
|--------------------------------------------------------------------------
| SERVER INFO
|--------------------------------------------------------------------------
*/

app.get("/api/server-info", (req, res) => {

    const username =
        os.userInfo().username;

    const ip =
        getLocalIP();

    res.json({

        hostname:
            os.hostname(),

        username,

        ip,

        port:
            8022,

        nodeVersion:
            process.version,

        platform:
            "Android / Termux",

        uptime:
            os.uptime(),

        sshCommand:
            `ssh -p 8022 ${username}@${ip}`

    });

});


/*
|--------------------------------------------------------------------------
| SYSTEM STATS
|--------------------------------------------------------------------------
*/

app.get("/api/system-stats", (req, res) => {

    const totalMemory =
        os.totalmem();

    const freeMemory =
        os.freemem();

    const usedMemory =
        totalMemory - freeMemory;

    const memoryUsage =
        Math.round(
            (usedMemory / totalMemory) * 100
        );


    const cpus =
        os.cpus();

    const load =
        os.loadavg();


    const cpuCount =
        cpus.length;


    const storage =
        getStorageInfo();


    res.json({

        cpu: {

            cores:
                cpuCount,

            load1:
                load[0],

            load5:
                load[1],

            load15:
                load[2]

        },

        memory: {

            total:
                totalMemory,

            used:
                usedMemory,

            free:
                freeMemory,

            usage:
                memoryUsage

        },

        storage

    });

});


/*
|--------------------------------------------------------------------------
| FILE SHARING (FILE DROP) API
|--------------------------------------------------------------------------
*/

// GET file list
app.get("/api/files", (req, res) => {
    const uploadDir = getUploadDir();

    try {
        const filenames = fs.readdirSync(uploadDir);
        const files = [];

        for (const filename of filenames) {
            // Ignore hidden files like .DS_Store or .gitkeep
            if (filename.startsWith(".")) continue;

            const filePath = path.join(uploadDir, filename);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    files.push({
                        name: filename,
                        size: stat.size,
                        mtime: stat.mtime
                    });
                }
            } catch (e) {
                // skip if unreadable
            }
        }

        // Sort files by newest first
        files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

        res.json({
            uploadDir,
            files
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal membaca direktori file" });
    }
});

// POST upload files
app.post("/api/files/upload", upload.array("files"), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Tidak ada file yang diunggah" });
    }

    const uploadedFiles = req.files.map(f => f.filename);
    res.json({
        success: true,
        message: `${req.files.length} file berhasil diunggah`,
        files: uploadedFiles
    });
});

// GET download file
app.get("/api/files/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File tidak ditemukan");
    }

    res.download(filePath, filename);
});

// DELETE file
app.delete("/api/files/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File tidak ditemukan" });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: "File berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus file" });
    }
});


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("==============================");
        console.log(" SUPERTINYSERVER DASHBOARD");
        console.log("==============================");
        console.log(
            `Running on port ${PORT}`
        );
        console.log("");

    }
);

