// app.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// =====================================
// MY HOMELAB - MAIN APPLICATION
// =====================================


// Real-time clock

function updateClock(){

    const clock = document.getElementById("clock");

    if(clock){

        const now = new Date();

        clock.innerHTML = now.toLocaleTimeString("fr-FR");

    }

}


// Update every second

setInterval(updateClock,1000);

updateClock();




// =====================================
// Light animation of the statistics
// =====================================


function randomValue(min,max){

    return Math.floor(
        Math.random() * (max - min + 1) + min
    );

}




function updateDashboard(){


    const cpu = document.querySelector(".cpu-value");

    const ram = document.querySelector(".ram-value");



    if(cpu){

        cpu.innerHTML =
        randomValue(30,75) + "%";

    }



    if(ram){

        ram.innerHTML =
        randomValue(40,85) + "%";

    }


}



// Refresh every 10 seconds

setInterval(updateDashboard,10000);





// =====================================
// Message console
// =====================================


console.log(
"MY HOMELAB Dashboard loaded successfully"
);

console.log(
"Mode HTTPS actif"
);
