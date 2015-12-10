



window.onload = function(){
    window.setInterval(flash, 100);
};


var on = true;
function flash(){
    console.log("hello");
    document.body.style.backgroundColor = on ? "white" : "black";
    document.querySelector('#hello').style.color = on ? "black" : "white";
    on = !on;
}