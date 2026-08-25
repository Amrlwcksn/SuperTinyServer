const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

/*
|--------------------------------------------------------------------------
| FORMAT BYTES
|--------------------------------------------------------------------------
*/
function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(1)} ${units[index]}`;
}

/*
|--------------------------------------------------------------------------
| FORMAT UPTIME
|--------------------------------------------------------------------------
*/
function formatUptime(seconds) {
    seconds = Math.floor(seconds || 0);

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);

    let result = "";
    if (days > 0) {
        result += days + "d ";
    }

    result += String(hours).padStart(2, "0") + "h ";
    result += String(minutes).padStart(2, "0") + "m";

    return result;
}

/*
|--------------------------------------------------------------------------
| LOAD SERVER INFO
|--------------------------------------------------------------------------
*/
async function loadServerInfo() {
    try {
        const response = await fetch("/api/server-info");
        if (!response.ok) return;

        const data = await response.json();

        const hostnameEl = document.getElementById("hostname");
        if (hostnameEl) hostnameEl.textContent = data.hostname || "-";

        const platformEl = document.getElementById("platform");
        if (platformEl) platformEl.textContent = data.platform || "-";

        const nodeVerEl = document.getElementById("nodeVersion");
        if (nodeVerEl) nodeVerEl.textContent = data.nodeVersion || "-";

        const uptimeEl = document.getElementById("uptime");
        if (uptimeEl) uptimeEl.textContent = formatUptime(data.uptime);

        const usernameEl = document.getElementById("username");
        if (usernameEl) usernameEl.textContent = data.username || "-";

        const ipEl = document.getElementById("ip");
        if (ipEl) ipEl.textContent = data.ip || "-";

        const portEl = document.getElementById("port");
        if (portEl) portEl.textContent = data.port || "8022";

        const sshCmdEl = document.getElementById("sshCommand");
        if (sshCmdEl) sshCmdEl.textContent = data.sshCommand || "-";
    } catch (error) {
        console.error("Failed to load server info", error);
    }
}

/*
|--------------------------------------------------------------------------
| LOAD SYSTEM STATS
|--------------------------------------------------------------------------
*/
async function loadSystemStats() {
    try {
        const response = await fetch("/api/system-stats");
        if (!response.ok) return;

        const data = await response.json();

        /* CPU */
        const cpuLoad = data.cpu.load1;
        const cpuPercent = Math.min(
            Math.round((cpuLoad / (data.cpu.cores || 1)) * 100),
            100
        );

        const cpuCoresEl = document.getElementById("cpuCores");
        if (cpuCoresEl) cpuCoresEl.textContent = (data.cpu.cores || "-") + " CORES";

        const cpuLoadEl = document.getElementById("cpuLoad");
        if (cpuLoadEl) cpuLoadEl.textContent = cpuLoad.toFixed(2);

        const cpuBarEl = document.getElementById("cpuBar");
        if (cpuBarEl) cpuBarEl.style.width = cpuPercent + "%";

        /* MEMORY */
        const memPercentEl = document.getElementById("memoryPercent");
        if (memPercentEl) memPercentEl.textContent = data.memory.usage + "%";

        const memUsedEl = document.getElementById("memoryUsed");
        if (memUsedEl) memUsedEl.textContent = formatBytes(data.memory.used);

        const memTotalEl = document.getElementById("memoryTotal");
        if (memTotalEl) memTotalEl.textContent = formatBytes(data.memory.total) + " total";

        const memBarEl = document.getElementById("memoryBar");
        if (memBarEl) memBarEl.style.width = data.memory.usage + "%";

        /* STORAGE */
        const storagePercentEl = document.getElementById("storagePercent");
        if (storagePercentEl) storagePercentEl.textContent = data.storage.usage + "%";

        const storageUsedEl = document.getElementById("storageUsed");
        if (storageUsedEl) storageUsedEl.textContent = formatBytes(data.storage.used);

        const storageTotalEl = document.getElementById("storageTotal");
        if (storageTotalEl) storageTotalEl.textContent = formatBytes(data.storage.total) + " total";

        const storageBarEl = document.getElementById("storageBar");
        if (storageBarEl) storageBarEl.style.width = data.storage.usage + "%";

    } catch (error) {
        console.error("Failed to load system stats", error);
    }
}

/*
|--------------------------------------------------------------------------
| NAVIGATION
|--------------------------------------------------------------------------
*/
menuItems.forEach(item => {
    if (item.classList.contains("disabled")) {
        return;
    }

    item.addEventListener("click", () => {
        const page = item.dataset.page;

        menuItems.forEach(menu => menu.classList.remove("active"));
        item.classList.add("active");

        pages.forEach(pageElement => pageElement.classList.remove("active-page"));

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

        const pageTitleEl = document.getElementById("pageTitle");
        if (pageTitleEl) pageTitleEl.textContent = pageTitle;
    });
});

/*
|--------------------------------------------------------------------------
| COPY SSH COMMAND
|--------------------------------------------------------------------------
*/
const copyBtn = document.getElementById("copyButton");
if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
        const sshCommandEl = document.getElementById("sshCommand");
        const command = sshCommandEl ? sshCommandEl.textContent : "";

        try {
            await navigator.clipboard.writeText(command);
            copyBtn.textContent = "COPIED!";
            setTimeout(() => {
                copyBtn.textContent = "COPY COMMAND";
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    });
}

/*
|--------------------------------------------------------------------------
| FILE DROP LOGIC
|--------------------------------------------------------------------------
*/
let currentSubpath = "";

function getFileIcon(filename) {
    const ext = (filename || "").split(".").pop().toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
        return `<svg class="file-svg image-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    }
    if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) {
        return `<svg class="file-svg video-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
    }
    if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext)) {
        return `<svg class="file-svg audio-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    }
    if (["pdf"].includes(ext)) {
        return `<svg class="file-svg doc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) {
        return `<svg class="file-svg archive-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`;
    }
    if (["js", "json", "html", "css", "py", "sh", "c", "cpp", "java", "ts"].includes(ext)) {
        return `<svg class="file-svg code-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    }
    return `<svg class="file-svg file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
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

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, match => {
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
    if (!str) return "";
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function updateBreadcrumbs(subpath) {
    const container = document.getElementById("folderBreadcrumbs");
    if (!container) return;

    const parts = subpath ? subpath.split("/").filter(Boolean) : [];
    
    let html = `<span class="breadcrumb-item ${parts.length === 0 ? 'active' : ''}" onclick="navigateToPath('')">Root</span>`;

    let accumulatedPath = "";
    parts.forEach((part, index) => {
        accumulatedPath += (accumulatedPath ? "/" : "") + part;
        const isLast = index === parts.length - 1;
        
        html += ` <span class="breadcrumb-separator">/</span> `;
        if (isLast) {
            html += `<span class="breadcrumb-item active">${escapeHtml(part)}</span>`;
        } else {
            const pathArg = escapeJsString(accumulatedPath);
            html += `<span class="breadcrumb-item" onclick="navigateToPath('${pathArg}')">${escapeHtml(part)}</span>`;
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
        if (!response.ok) throw new Error("Gagal mengambil data file");
        
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

        const folderSvg = `<svg class="file-svg folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
        const openSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
        const downloadSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        const deleteSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

        tableBody.innerHTML = items.map(item => {
            const isDir = item.isDirectory;
            const icon = isDir ? folderSvg : getFileIcon(item.name);
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
                                ${openSvg} <span>Buka</span>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteItem('${escapedName}', true)">
                                ${deleteSvg} <span>Hapus</span>
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
                            ${downloadSvg} <span>Download</span>
                        </a>
                        <button class="btn-action btn-delete" onclick="deleteItem('${escapedName}', false)">
                            ${deleteSvg} <span>Hapus</span>
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
        if (uploadStatusText) uploadStatusText.textContent = "Terjadi kesalahan jaringan saat upload.";
    };

    xhr.send(formData);
}

/*
|--------------------------------------------------------------------------
| DOM LISTENERS FOR FILE DROP
|--------------------------------------------------------------------------
*/
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
        dropzone.addEventListener("click", () => {
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
});

/*
|--------------------------------------------------------------------------
| THEME TOGGLE (LIGHT MODE DEFAULT & DARK MODE)
|--------------------------------------------------------------------------
*/
function applyTheme(theme) {
    const themeBtn = document.getElementById("themeToggleBtn");
    const themeText = document.getElementById("themeToggleText");
    const isDark = theme === "dark";
    
    if (isDark) {
        document.body.setAttribute("data-theme", "dark");
        if (themeText) themeText.textContent = "Light Mode";
        if (themeBtn) {
            const iconEl = themeBtn.querySelector(".theme-icon");
            if (iconEl) {
                iconEl.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
            }
        }
    } else {
        document.body.removeAttribute("data-theme");
        if (themeText) themeText.textContent = "Dark Mode";
        if (themeBtn) {
            const iconEl = themeBtn.querySelector(".theme-icon");
            if (iconEl) {
                iconEl.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
            }
        }
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
| INITIAL LOAD & AUTO REFRESH
|--------------------------------------------------------------------------
*/
initTheme();
loadServerInfo();
loadSystemStats();

setInterval(loadSystemStats, 3000);
setInterval(loadServerInfo, 10000);
