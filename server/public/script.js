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


            document
                .getElementById(
                    `${page}-page`
                )
                .classList.add(
                    "active-page"
                );


            document.getElementById(
                "pageTitle"
            ).textContent =
                page === "dashboard"
                    ? "Dashboard"
                    : "SSH Connection";

        }
    );

});


/*
|--------------------------------------------------------------------------
| COPY SSH COMMAND
|--------------------------------------------------------------------------
*/

document
    .getElementById("copyButton")
    .addEventListener(
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


/*
|--------------------------------------------------------------------------
| INITIAL LOAD
|--------------------------------------------------------------------------
*/

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
