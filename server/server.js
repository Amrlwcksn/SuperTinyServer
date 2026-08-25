const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { execSync } = require("child_process");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


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

function resolveSubpath(subpath = "") {
    const baseDir = getUploadDir();
    const safeSubpath = path.normalize(subpath).replace(/^(\.\.[\/\\])+/, "");
    const targetDir = path.resolve(baseDir, safeSubpath);

    if (!targetDir.startsWith(baseDir)) {
        return baseDir;
    }
    return targetDir;
}

function getRelativeSubpath(targetDir) {
    const baseDir = getUploadDir();
    const rel = path.relative(baseDir, targetDir);
    return (rel && !rel.startsWith("..")) ? rel : "";
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const reqPath = req.query.path || req.body.path || "";
        const targetDir = resolveSubpath(reqPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
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
| FILE SHARING (FILE DROP) API WITH SUBFOLDER SUPPORT
|--------------------------------------------------------------------------
*/

// GET file and folder list in directory
app.get("/api/files", (req, res) => {
    const reqPath = req.query.path || "";
    const targetDir = resolveSubpath(reqPath);
    const relativePath = getRelativeSubpath(targetDir);
    const baseDir = getUploadDir();

    try {
        if (!fs.existsSync(targetDir)) {
            return res.status(404).json({ error: "Direktori tidak ditemukan" });
        }

        const filenames = fs.readdirSync(targetDir);
        const items = [];

        for (const filename of filenames) {
            if (filename.startsWith(".")) continue;

            const itemPath = path.join(targetDir, filename);
            try {
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    items.push({
                        name: filename,
                        isDirectory: true,
                        size: 0,
                        mtime: stat.mtime
                    });
                } else if (stat.isFile()) {
                    items.push({
                        name: filename,
                        isDirectory: false,
                        size: stat.size,
                        mtime: stat.mtime
                    });
                }
            } catch (e) {
                // skip if unreadable
            }
        }

        // Directories first, then files by newest first
        items.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return new Date(b.mtime) - new Date(a.mtime);
        });

        res.json({
            baseDir,
            currentPath: relativePath,
            items
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal membaca direktori file" });
    }
});

// POST create folder
app.post("/api/files/mkdir", (req, res) => {
    const { path: reqPath, folderName } = req.body;
    if (!folderName || typeof folderName !== "string") {
        return res.status(400).json({ error: "Nama folder tidak valid" });
    }

    const safeFolderName = folderName.trim().replace(/[^a-zA-Z0-9._\s-]/g, "_");
    if (!safeFolderName) {
        return res.status(400).json({ error: "Nama folder tidak valid" });
    }

    const targetDir = resolveSubpath(reqPath || "");
    const newFolderPath = path.join(targetDir, safeFolderName);

    if (!newFolderPath.startsWith(getUploadDir())) {
        return res.status(403).json({ error: "Akses direktori ditolak" });
    }

    if (fs.existsSync(newFolderPath)) {
        return res.status(400).json({ error: "Folder dengan nama tersebut sudah ada" });
    }

    try {
        fs.mkdirSync(newFolderPath, { recursive: true });
        res.json({ success: true, message: `Folder "${safeFolderName}" berhasil dibuat` });
    } catch (error) {
        res.status(500).json({ error: "Gagal membuat folder" });
    }
});

// POST upload files (batch multi-file)
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
app.get("/api/files/download", (req, res) => {
    const reqPath = req.query.path || "";
    const filename = req.query.filename || "";

    if (!filename) {
        return res.status(400).send("Nama file tidak ditentukan");
    }

    const targetDir = resolveSubpath(reqPath);
    const filePath = path.join(targetDir, path.basename(filename));

    if (!filePath.startsWith(getUploadDir()) || !fs.existsSync(filePath)) {
        return res.status(404).send("File tidak ditemukan");
    }

    res.download(filePath, filename);
});

// DELETE file or folder
app.delete("/api/files", (req, res) => {
    const reqPath = req.query.path || req.body.path || "";
    const name = req.query.name || req.body.name || "";

    if (!name) {
        return res.status(400).json({ error: "Nama file atau folder tidak ditentukan" });
    }

    const targetDir = resolveSubpath(reqPath);
    const targetItemPath = path.join(targetDir, path.basename(name));

    if (!targetItemPath.startsWith(getUploadDir()) || !fs.existsSync(targetItemPath)) {
        return res.status(404).json({ error: "File atau folder tidak ditemukan" });
    }

    try {
        const stat = fs.statSync(targetItemPath);
        if (stat.isDirectory()) {
            fs.rmSync(targetItemPath, { recursive: true, force: true });
            res.json({ success: true, message: "Folder berhasil dihapus" });
        } else {
            fs.unlinkSync(targetItemPath);
            res.json({ success: true, message: "File berhasil dihapus" });
        }
    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus item" });
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


