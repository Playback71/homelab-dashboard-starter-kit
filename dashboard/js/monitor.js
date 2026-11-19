// monitor.js : v2026.11.17-1 : English version (MY HOMELAB starter kit)
// =================================
// HOME LAB MONITOR SIMULATION
// =================================



function random(min,max){

return Math.floor(
Math.random()*(max-min+1)+min
);

}




function updateMonitor(){


let cpu=random(25,75);

let ram=random(40,85);

let temp=random(30,55);



document.getElementById("cpu").innerHTML=
cpu+"%";


document.getElementById("ram").innerHTML=
ram+"%";


document.getElementById("temp").innerHTML=
temp+"°C";




let docker=
document.getElementById("dockerStatus");


let prox=
document.getElementById("proxmoxStatus");




if(temp>50){


docker.innerHTML="WARNING";

docker.style.color="red";


}
else{


docker.innerHTML="ONLINE";

docker.style.color="#00ff88";


}





if(cpu>70){


prox.innerHTML="HIGH LOAD";

prox.style.color="orange";


}

else{


prox.innerHTML="ONLINE";

prox.style.color="#00ff88";


}





let event=document.getElementById("events");


let p=document.createElement("p");


let time=new Date()
.toLocaleTimeString();



p.innerHTML=

"🟢 "+time+
" CPU "+
cpu+
"% RAM "+
ram+
"%";



event.prepend(p);




}




setInterval(
updateMonitor,
5000
);


updateMonitor();
