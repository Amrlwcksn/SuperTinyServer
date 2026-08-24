const express = require("express");
const os = require("os");
const { execSync } = require("child_process");

const app = express();
const PORT = 3000;

app.use(express.static("public"));


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
