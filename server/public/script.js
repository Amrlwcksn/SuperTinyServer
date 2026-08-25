const menuItems =
    document.querySelectorAll(".menu-item");

const pages =
    document.querySelectorAll(".page");


/*
|--------------------------------------------------------------------------
| FORMAT BYTES
|--------------------------------------------------------------------------
*/

function formatBytes(bytes) {

    if (!bytes) {
        return "0 MB";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    const value =
        bytes /
        Math.pow(1024, index);

    return (
        value.toFixed(1) +
        " " +
        units[index]
    );

}


/*
|--------------------------------------------------------------------------
| FORMAT UPTIME
|--------------------------------------------------------------------------
*/

function formatUptime(seconds) {

    seconds =
        Math.floor(seconds);

    const days =
        Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours =
        Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes =
        Math.floor(seconds / 60);


    let result = "";

    if (days > 0) {
        result += days + "d ";
    }

    result +=
        String(hours)
            .padStart(2, "0")
        +
        "h ";

    result +=
        String(minutes)
            .padStart(2, "0")
        +
        "m";

    return result;

}


/*
|--------------------------------------------------------------------------
| LOAD SERVER INFO
|--------------------------------------------------------------------------
*/

async function loadServerInfo() {

    try {

        const response =
            await fetch(
                "/api/server-info"
            );

        const data =
            await response.json();


        document.getElementById(
            "hostname"
        ).textContent =
            data.hostname;


        document.getElementById(
            "platform"
        ).textContent =
            data.platform;


        document.getElementById(
            "nodeVersion"
        ).textContent =
            data.nodeVersion;


        document.getElementById(
            "uptime"
        ).textContent =
            formatUptime(
                data.uptime
            );


        document.getElementById(
            "username"
        ).textContent =
            data.username;


        document.getElementById(
            "ip"
        ).textContent =
            data.ip;


        document.getElementById(
            "port"
        ).textContent =
            data.port;


        document.getElementById(
            "sshCommand"
        ).textContent =
            data.sshCommand;


    } catch (error) {

        console.error(
            "Failed to load server info",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| LOAD SYSTEM STATS
|--------------------------------------------------------------------------
*/

async function loadSystemStats() {

    try {

        const response =
            await fetch(
                "/api/system-stats"
            );

        const data =
            await response.json();


        /*
        | CPU
        */

        const cpuLoad =
            data.cpu.load1;

        const cpuPercent =
            Math.min(
                Math.round(
                    (cpuLoad /
                    data.cpu.cores)
                    * 100
                ),
                100
            );


        document.getElementById(
            "cpuCores"
        ).textContent =
            data.cpu.cores +
            " CORES";


        document.getElementById(
            "cpuLoad"
        ).textContent =
            cpuLoad.toFixed(2);


        document.getElementById(
            "cpuBar"
        ).style.width =
            cpuPercent + "%";



        /*
        | MEMORY
        */

        document.getElementById(
            "memoryPercent"
        ).textContent =
            data.memory.usage + "%";


        document.getElementById(
            "memoryUsed"
        ).textContent =
            formatBytes(
                data.memory.used
            );


        document.getElementById(
            "memoryTotal"
        ).textContent =
            formatBytes(
                data.memory.total
            ) + " total";


        document.getElementById(
            "memoryBar"
        ).style.width =
            data.memory.usage + "%";



        /*
        | STORAGE
        */

        document.getElementById(
            "storagePercent"
        ).textContent =
            data.storage.usage + "%";


        document.getElementById(
            "storageUsed"
        ).textContent =
            formatBytes(
                data.storage.used
            );


        document.getElementById(
            "storageTotal"
        ).textContent =
            formatBytes(
                data.storage.total
            ) + " total";


        document.getElementById(
            "storageBar"
        ).style.width =
            data.storage.usage + "%";


    } catch (error) {

        console.error(
            "Failed to load system stats",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| NAVIGATION
|--------------------------------------------------------------------------
*/

menuItems.forEach(item => {

    if (
        item.classList.contains(
            "disabled"
        )
    ) {
        return;
    }


    item.addEventListener(
        "click",
        () => {

            const page =
                item.dataset.page;


            menuItems.forEach(
                menu =>
                    menu.classList.remove(
                        "active"
                    )
            );


            item.classList.add(
                "active"
            );


            pages.forEach(
                pageElement =>
                    pageElement.classList.remove(
                        "active-page"
                    )
            );


            const targetPage = document.getElementById(`${page}-page`);
            if (targetPage) {
                targetPage.classList.add("active-page");
            }


            let pageTitle = "Dashboard";
            if (page === "dashboard") {
                pageTitle = "Dashboard";
            } else if (page === "ssh") {
                pageTitle = "SSH Connection";
            } else if (page === "filedrop") {
                pageTitle = "File Sharing (File Drop)";
                loadFileList();
            } else if (page === "credits") {
                pageTitle = "Credits & About";
            }

            document.getElementById("pageTitle").textContent = pageTitle;

        }
    );

});



/*
|--------------------------------------------------------------------------
| COPY SSH COMMAND
|--------------------------------------------------------------------------
*/

const copyBtn = document.getElementById("copyButton");
if (copyBtn) {
    copyBtn.addEventListener(
        "click",
        async () => {

            const command =
                document.getElementById(
                    "sshCommand"
                ).textContent;


            await navigator.clipboard.writeText(
                command
            );


            const button =
                document.getElementById(
                    "copyButton"
                );

            button.textContent =
                "COPIED!";


            setTimeout(() => {

                button.textContent =
                    "COPY COMMAND";

            }, 2000);

        }
    );
}


/*
|--------------------------------------------------------------------------
| FILE DROP / FILE SHARING LOGIC WITH SUBFOLDER SUPPORT
|--------------------------------------------------------------------------
*/

let currentSubpath = "";

function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
        return "🖼️";
    }
    if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) {
        return "🎬";
    }
    if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext)) {
        return "🎵";
    }
    if (["pdf"].includes(ext)) {
        return "📕";
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) {
        return "📦";
    }
    if (["js", "json", "html", "css", "py", "sh", "c", "cpp", "java"].includes(ext)) {
        return "💻";
    }
    if (["txt", "md", "doc", "docx"].includes(ext)) {
        return "📝";
    }
    return "📄";
}

function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function updateBreadcrumbs(subpath) {
    const container = document.getElementById("folderBreadcrumbs");
    if (!container) return;

    const parts = subpath ? subpath.split("/").filter(Boolean) : [];
    
    let html = `<span class="breadcrumb-item ${parts.length === 0 ? 'active' : ''}" onclick="navigateToPath('')">🏠 Root</span>`;

    let accumulatedPath = "";
    parts.forEach((part, index) => {
        accumulatedPath += (accumulatedPath ? "/" : "") + part;
        const isLast = index === parts.length - 1;
        
        html += ` <span class="breadcrumb-separator">/</span> `;
        if (isLast) {
            html += `<span class="breadcrumb-item active">📁 ${escapeHtml(part)}</span>`;
        } else {
            const pathArg = escapeJsString(accumulatedPath);
            html += `<span class="breadcrumb-item" onclick="navigateToPath('${pathArg}')">📁 ${escapeHtml(part)}</span>`;
        }
    });

    container.innerHTML = html;
}

function navigateToPath(subpath) {
    currentSubpath = subpath || "";
    loadFileList(currentSubpath);
}

function openFolder(folderName) {
    const newPath = currentSubpath ? `${currentSubpath}/${folderName}` : folderName;
    navigateToPath(newPath);
}

async function loadFileList(subpath = currentSubpath) {
    const tableBody = document.getElementById("fileTableBody");
    if (!tableBody) return;

    try {
        const queryPath = encodeURIComponent(subpath || "");
        const response = await fetch(`/api/files?path=${queryPath}`);
        const data = await response.json();

        if (data.baseDir) {
            const storagePathEl = document.getElementById("storagePath");
            if (storagePathEl) {
                const fullPath = data.currentPath ? `${data.baseDir}/${data.currentPath}` : data.baseDir;
                storagePathEl.textContent = fullPath;
            }
        }

        currentSubpath = data.currentPath || "";
        updateBreadcrumbs(currentSubpath);

        const items = data.items || [];
        
        // Update summary cards
        const countEl = document.getElementById("totalFilesCount");
        const sizeEl = document.getElementById("totalFilesSize");
        
        if (countEl) countEl.textContent = items.length;
        
        const totalSizeBytes = items.reduce((acc, item) => acc + (item.size || 0), 0);
        if (sizeEl) sizeEl.textContent = formatBytes(totalSizeBytes);

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        Folder ini kosong. Silakan buat folder baru atau drag & drop file.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = items.map(item => {
            const isDir = item.isDirectory;
            const icon = isDir ? "📁" : getFileIcon(item.name);
            const formattedSize = isDir ? "-" : formatBytes(item.size);
            const formattedTime = formatDate(item.mtime);
            const escapedName = escapeJsString(item.name);
            const htmlName = escapeHtml(item.name);

            if (isDir) {
                return `
                    <tr class="folder-row">
                        <td>
                            <div class="file-name-cell">
                                <span class="file-icon">${icon}</span>
                                <span class="folder-link" onclick="openFolder('${escapedName}')">${htmlName}</span>
                            </div>
                        </td>
                        <td>-</td>
                        <td>${formattedTime}</td>
                        <td style="text-align: right;">
                            <button class="btn-action btn-open" onclick="openFolder('${escapedName}')">
                                📂 Buka
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteItem('${escapedName}', true)">
                                🗑 Hapus
                            </button>
                        </td>
                    </tr>
                `;
            }

            const downloadUrl = `/api/files/download?path=${encodeURIComponent(currentSubpath)}&filename=${encodeURIComponent(item.name)}`;

            return `
                <tr>
                    <td>
                        <div class="file-name-cell">
                            <span class="file-icon">${icon}</span>
                            <span>${htmlName}</span>
                        </div>
                    </td>
                    <td>${formattedSize}</td>
                    <td>${formattedTime}</td>
                    <td style="text-align: right;">
                        <a href="${downloadUrl}" class="btn-action btn-download" download>
                            ⬇ Download
                        </a>
                        <button class="btn-action btn-delete" onclick="deleteItem('${escapedName}', false)">
                            🗑 Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Failed to load file list:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state" style="color: #f87171;">
                    Gagal memuat daftar file dari server.
                </td>
            </tr>
        `;
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeMap[match];
    });
}

function escapeJsString(str) {
    return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function createFolder() {
    const input = document.getElementById("newFolderNameInput");
    if (!input) return;

    const folderName = input.value.trim();
    if (!folderName) {
        alert("Masukkan nama folder terlebih dahulu");
        return;
    }

    try {
        const response = await fetch("/api/files/mkdir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: currentSubpath,
                folderName
            })
        });

        const data = await response.json();
        if (response.ok) {
            input.value = "";
            const newFolderBar = document.getElementById("newFolderBar");
            if (newFolderBar) newFolderBar.style.display = "none";
            loadFileList(currentSubpath);
        } else {
            alert(data.error || "Gagal membuat folder");
        }
    } catch (error) {
        console.error("Failed to create folder:", error);
        alert("Gagal terhubung ke server untuk membuat folder.");
    }
}

async function deleteItem(name, isDirectory) {
    const typeLabel = isDirectory ? "folder beserta isinya" : "file";
    if (!confirm(`Apakah Anda yakin ingin menghapus ${typeLabel} "${name}"?`)) {
        return;
    }

    try {
        const response = await fetch("/api/files", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: currentSubpath,
                name
            })
        });

        const data = await response.json();

        if (response.ok) {
            loadFileList(currentSubpath);
        } else {
            alert(data.error || `Gagal menghapus ${typeLabel}`);
        }
    } catch (error) {
        console.error("Failed to delete item:", error);
        alert("Gagal terhubung ke server untuk menghapus item.");
    }
}

function uploadFiles(files) {
    if (!files || files.length === 0) return;

    const uploadStatus = document.getElementById("uploadStatus");
    const uploadStatusText = document.getElementById("uploadStatusText");
    const uploadPercent = document.getElementById("uploadPercent");
    const uploadBar = document.getElementById("uploadBar");

    if (uploadStatus) uploadStatus.style.display = "block";
    if (uploadStatusText) uploadStatusText.textContent = `Mengunggah ${files.length} file...`;
    if (uploadPercent) uploadPercent.textContent = "0%";
    if (uploadBar) uploadBar.style.width = "0%";

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    const uploadUrl = `/api/files/upload?path=${encodeURIComponent(currentSubpath)}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            if (uploadPercent) uploadPercent.textContent = `${percent}%`;
            if (uploadBar) uploadBar.style.width = `${percent}%`;
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            if (uploadStatusText) uploadStatusText.textContent = `✓ ${files.length} file berhasil diunggah!`;
            if (uploadPercent) uploadPercent.textContent = "100%";
            if (uploadBar) uploadBar.style.width = "100%";

            const fileInput = document.getElementById("fileInput");
            if (fileInput) fileInput.value = "";

            loadFileList(currentSubpath);

            setTimeout(() => {
                if (uploadStatus) uploadStatus.style.display = "none";
            }, 3000);
        } else {
            let errorMsg = "Upload gagal";
            try {
                const res = JSON.parse(xhr.responseText);
                errorMsg = res.error || errorMsg;
            } catch (e) {}

            if (uploadStatusText) uploadStatusText.textContent = `❌ ${errorMsg}`;
        }
    };

    xhr.onerror = () => {
        if (uploadStatusText) uploadStatusText.textContent = "❌ Terjadi kesalahan jaringan saat upload.";
    };

    xhr.send(formData);
}

// Event Listeners for File Drop
document.addEventListener("DOMContentLoaded", () => {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const browseBtn = document.getElementById("browseBtn");
    const refreshBtn = document.getElementById("refreshFilesBtn");
    const newFolderBtn = document.getElementById("newFolderBtn");
    const newFolderBar = document.getElementById("newFolderBar");
    const confirmCreateFolderBtn = document.getElementById("confirmCreateFolderBtn");
    const cancelCreateFolderBtn = document.getElementById("cancelCreateFolderBtn");
    const newFolderNameInput = document.getElementById("newFolderNameInput");

    if (newFolderBtn && newFolderBar) {
        newFolderBtn.addEventListener("click", () => {
            const isHidden = newFolderBar.style.display === "none";
            newFolderBar.style.display = isHidden ? "flex" : "none";
            if (isHidden && newFolderNameInput) {
                newFolderNameInput.focus();
            }
        });
    }

    if (cancelCreateFolderBtn && newFolderBar) {
        cancelCreateFolderBtn.addEventListener("click", () => {
            newFolderBar.style.display = "none";
            if (newFolderNameInput) newFolderNameInput.value = "";
        });
    }

    if (confirmCreateFolderBtn) {
        confirmCreateFolderBtn.addEventListener("click", createFolder);
    }

    if (newFolderNameInput) {
        newFolderNameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                createFolder();
            } else if (e.key === "Escape") {
                if (newFolderBar) newFolderBar.style.display = "none";
                newFolderNameInput.value = "";
            }
        });
    }

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", (e) => {
            fileInput.click();
        });

        if (browseBtn) {
            browseBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                uploadFiles(fileInput.files);
            }
        });

        ["dragenter", "dragover"].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "dragend", "drop"].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove("dragover");
            }, false);
        });

        dropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                uploadFiles(files);
            }
        }, false);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadFileList(currentSubpath);
        });
    }
/*
|--------------------------------------------------------------------------
| THEME TOGGLE (LIGHT MODE DEFAULT & DARK MODE)
|--------------------------------------------------------------------------
*/

function applyTheme(theme) {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (theme === "dark") {
        document.body.setAttribute("data-theme", "dark");
        if (themeBtn) themeBtn.innerHTML = "☀️ Light Mode";
    } else {
        document.body.removeAttribute("data-theme");
        if (themeBtn) themeBtn.innerHTML = "🌙 Dark Mode";
    }
    localStorage.setItem("sts_theme", theme);
}

function initTheme() {
    const savedTheme = localStorage.getItem("sts_theme") || "light";
    applyTheme(savedTheme);

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
        });
    }
}


/*
|--------------------------------------------------------------------------
| INITIAL LOAD
|--------------------------------------------------------------------------
*/

initTheme();
loadServerInfo();
loadSystemStats();


/*
|--------------------------------------------------------------------------
| AUTO REFRESH
|--------------------------------------------------------------------------
*/

setInterval(
    loadSystemStats,
    3000
);

setInterval(
    loadServerInfo,
    10000
);

