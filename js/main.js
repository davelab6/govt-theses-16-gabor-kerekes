



window.onload = function(){
    window.setInterval(flash, 150);
};


var on = true;
function flash(){
    console.log("hello");
    document.body.style.backgroundColor = on ? "white" : "black";
    document.querySelector('#title').style.color = on ? "black" : "white";
    on = !on;
}