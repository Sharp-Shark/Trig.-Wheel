// Debugging
var debug = '';
function log(txt, breakLine=true, update=true) {
	console.log(txt);
	debug = debug + txt;
	if(breakLine) {debug = debug + '<br>';};
	if(update && HTMLconsoleVisible) {document.getElementById('debug').innerHTML = debug;};
};

// General functions
function range (start, end) {
    if(end <= 0) {
        return [];
    };
    return [...Array(end).keys()];
};

function len(array) {
    return array.length;
};
function tutorialPopup () {
    window.alert(`
    || Welcome to Dingus9000 -- Bem Vindo ao Dingus9000 ||
    WASD to Move Camera - WASD para Mover a Camera
    Q and E to Zoom - Q e E para Zoom
    R to Sine/Cossine - R para Seno/Cosseno
    H for Help Menu - H para Menu de Ajuda
    0 for Fullscreen - 0 para Tela Cheia
    `);
};

// Geometry and Math functions
function sortX (array) {
    let originalLen = len(array);
    let sorted = array;
    let otherCount = 0;
    let count = 0;
    while(count < originalLen) {
        current = array[count];
        for(otherCount in array) {
            if(sorted[otherCount].x < current.x) {
                break;
            };
        };
        sorted.splice(count, 1);
        sorted.splice(otherCount, 0, current);
        count = parseInt(count) + 1;
    };
    return sorted;
};
function sortY (array) {
    let originalLen = len(array);
    let sorted = array;
    let otherCount = 0;
    let count = 0;
    while(count < originalLen) {
        current = array[count];
        for(otherCount in array) {
            if(sorted[otherCount].y < current.y) {
                break;
            };
        };
        sorted.splice(count, 1);
        sorted.splice(otherCount, 0, current);
        count = parseInt(count) + 1;
    };
    return sorted;
};
function sort (array) {
    let originalLen = len(array);
    let sorted = array;
    let otherCount = 0;
    let count = 0;
    while(count < originalLen) {
        current = array[count];
        for(otherCount in array) {
            if(sorted[otherCount] >= current) {
                break;
            };
        };
        sorted.splice(count, 1);
        sorted.splice(otherCount, 0, current);
        count = parseInt(count) + 1;
    };
    return sorted;
};
function arrayAnd (arrA, arrB) {
    // Get Intersection
    let intersection = arrA.filter(x => arrB.includes(x));
    // Remove Repeats
    return [...new Set(intersection)];
};
function lerp (n, min=0, max=1) {
    return min*(1-n) + max*(n);
};
function average (array) {
    let toReturn = 0;
    for(let i in array) {
        toReturn = toReturn + parseInt(array[i]);
    };
    return toReturn/len(array);
};
function pointTowards (p1, p2) {
    // P1 is self, P2 is target.
    return Math.atan2( (p2[0] - p1[0]), (p2[1] - p1[1]) );
};

function distance (p1, p2) {
    // P1 is self, P2 is target.
    return Math.sqrt((p1[0] - p2[0])**2 + (p1[1]-p2[1])**2);
};

// Console HTML DiV Element
var HTMLdivElement = `
		<div class="debug">
            eval(<input placeholder="insert code here..." id="cheatInput" onchange="eval(document.getElementById('cheatInput').value);document.getElementById('cheatInput').value='';"></input>);
			<pre id="debug"></pre>
		</div>
`;
var HTMLconsoleVisible = false;
// Screen Vars
var screen = document.getElementById('screen');
//screen.width = document.body.clientWidth;
//screen.height = document.body.clientHeight;
var screenWidth = screen.width;
var screenHeight = screen.height;
var screenX = screen.getBoundingClientRect().left;
var screenY = screen.getBoundingClientRect().top;
var ctx = screen.getContext("2d");
// General Vars
var time = 0;
var lastTime = 0;
var frame = 0;
// Mouse vars
var oldMouseX = 0;
var oldMouseY = 0;
var mouseX = 0;
var mouseY = 0;
var mouseOffsetX = 0;
var mouseOffsetY = 0;
var mouseState = 0;
var mTransX = 0;
var mTransY = 0;
// Selection
var actionType = 'none';
var selected = -1;
// Camera vars
var camX = 0;
var camY = 0;
var camZoom = 1;
var camVelX = 0;
var camVelY = 0;
var camVelZoom = 0;
// objects
var objects = [];
var oldObjects = [];
var toRender = [];
var highestId = 0;
var intersections = [];

var angleOffset = Math.PI/2;
var targetAngleOffset = Math.PI/2;

// Drawing/screen functions
function resizeCanvas () {
    let WHICH = 2;
    if(WHICH == 1) {
        screen.width = HTMLconsoleVisible?800:document.body.clientWidth;
        screen.height = HTMLconsoleVisible?450:document.body.clientHeight;
    } else if(WHICH == 2) {
        screen.width = HTMLconsoleVisible?800:document.documentElement.clientWidth - 4;
        screen.height = HTMLconsoleVisible?450:document.documentElement.clientHeight - 4;
    } else if(WHICH == 3) {
        screen.width = HTMLconsoleVisible?800:window.innerWidth;
        screen.height = HTMLconsoleVisible?450:window.innerHeight;
    };
    document.getElementById('debugdiv').innerHTML = HTMLconsoleVisible?HTMLdivElement:'';
};

function circle (x, y, radius, color=null) {
    ctx.beginPath();
    if(color != null) {
        ctx.fillStyle = color;
    };
    ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.fill();
};

function xyToCam (x, y) {
    return [(x-camX)*camZoom, (y-camY)*camZoom];
};

function xToCam (x) {
    return ((x-camX)*camZoom) + screenWidth/2;
};

function yToCam (y) {
    return ((y-camY)*camZoom) + screenHeight/2;
};

function camToX (x) {
    return (((x - screenWidth/2)/camZoom)+camX);
};

function camToY (y) {
    return (((y - screenHeight/2)/camZoom)+camY);
};

function clearScreen () {
    ctx.clearRect(0, 0, screen.width, screen.height);
    ctx.beginPath();
};

// Misc Functions
function resetSelected () {
    // Reset Selection Vars
    actionType = 'none';
    selected = -1;
    // Reset Mouse Offset
    mouseOffsetX = 0;
    mouseOffsetY = 0;
};

// Main Loop Function
var FPS_average = 0;
var FPS_sample = [];
function main () {
    // Debug Clear
    debug = '';
    // If Selected Stack Doesn't Exist, Unselect
    if(selected > len(objects)-1) {resetSelected();};
    // Mouse Position Translated into World Position
    mTransX = camToX(mouseX);
    mTransY = camToY(mouseY);
    // Panning
    if(actionType != 'pan') {
        oldMouseX = mTransX;
        oldMouseY = mTransY;
    };
    // Add Zoom Velocty
    camZoom += camVelZoom;
    // Cap camZoom
    camZoom = Math.max(Math.min(camZoom, 1.5), 0.25);
    // Camera Panning
    camX = oldMouseX - ((mouseX - screenWidth/2)/camZoom);
    camY = oldMouseY - ((mouseY - screenHeight/2)/camZoom);
    //  Add Camera Velocity
    camX += camVelX;
    camY += camVelY;
    // Apply Friction
    camVelZoom = camVelZoom/1.2;
    camVelX = camVelX/1.2;
    camVelY = camVelY/1.2;

    // Clear Screen
    toRender = [];
    clearScreen();
    // Constant
    angleOffset = Math.abs(targetAngleOffset-angleOffset)<0.01?targetAngleOffset:angleOffset+((targetAngleOffset-angleOffset)/15);
    let textAngles = ['0', '√1/2', '√2/2', '√3/2', '1', '√3/2', '√2/2', '√1/2'];
    let a90 = Math.PI/2;
    let a270 = (Math.PI*3)/2;
    let a360 = Math.PI*2;
    // Setup
    let size = screenHeight*0.4;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = (24*camZoom)+'px "Lucida Console", "Courier New", monospace';

    ctx.lineWidth = 10*camZoom;
    // Sin Wave
    ctx.strokeStyle = targetAngleOffset==0?'#0f0f0f':'#1f1f1f';
    for(let i=100; i<500; i++) {
        ctx.beginPath();
        ctx.moveTo(xToCam((i-1)*-2-size), yToCam(Math.sin((frame+i-1)/10)*size));
        ctx.lineTo(xToCam(i*-2-size), yToCam(Math.sin((frame+i)/10)*size));
        ctx.stroke();
    };
    // Cos Wave
    ctx.strokeStyle = targetAngleOffset==0?'#1f1f1f':'#0f0f0f';
    for(let i=100; i<500; i++) {
        ctx.beginPath();
        ctx.moveTo(xToCam((i-1)*-2-size), yToCam(Math.cos((frame+i-1)/10)*size));
        ctx.lineTo(xToCam(i*-2-size), yToCam(Math.cos((frame+i)/10)*size));
        ctx.stroke();
    };

    // Setup (Again)
    ctx.lineWidth = 10*camZoom;
    ctx.strokeStyle = 'white';

    // Circle
    ctx.beginPath();
    ctx.arc(xToCam(0), yToCam(0), size*camZoom, 0, Math.PI*2);
    ctx.stroke();
    // All the lines
    let a = angleOffset;
    let b = 1;
    for(let i=0; i<16; i++) {
        ctx.fillStyle = Math.PI<(a-angleOffset)?'lightsalmon':'lightblue';
        ctx.beginPath();
        ctx.moveTo(xToCam(Math.sin(a)*size/1.5), yToCam(Math.cos(a)*size/1.5));
        ctx.lineTo(xToCam(Math.sin(a)*size), yToCam(Math.cos(a)*size));
        ctx.fillText((Math.PI<(a-angleOffset)?'- ':'') + textAngles[i%len(textAngles)], xToCam(Math.sin(a)*(size+65)), yToCam(Math.cos(a)*(size+65)));
        ctx.fillText((Math.round(180*(a/Math.PI))-90<0?360+(Math.round(180*(a/Math.PI))-90):Math.round(180*(a/Math.PI))-90)+'º', xToCam(Math.sin(a)*(size+120)), yToCam(Math.cos(a)*(size+120)));
        ctx.stroke();
        if(b < 2) {
            a += Math.PI/6;
        } else {
            a += Math.PI/12;
        };
        b = b<3?b+1:0;
    };

    // Actions
    if(mouseState && actionType == 'none') {
        actionType = 'pan';
    } else if(!mouseState && actionType == 'pan') {
        actionType = 'none';
    };

    // Cursor
    if(selected == -1) {circle(mouseX, mouseY, 5, 'black');};

    // Get FPS
    time = parseInt(Date.now());
    FPS_sample.push( time - lastTime );
    if(len(FPS_sample)>29) {
        FPS_average = 1/(average(FPS_sample)/1000);
        FPS_sample = [];
    };
    lastTime = parseInt(Date.now());

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.font = '24px "Lucida Console", "Courier New", monospace';
    ctx.fillText(String(Math.round(FPS_average)), 5, 20);
    ctx.textAlign = 'center';
    ctx.font = (36*camZoom)+'px "Lucida Console", "Courier New", monospace';
    ctx.fillText(targetAngleOffset==0?'Cosine':'Sine', xToCam(0), yToCam(20));
    ctx.fillText(targetAngleOffset==0?'Cosseno':'Seno', xToCam(0), yToCam(-20));
    ctx.beginPath();

    frame += 1;
    frame = frame * (frame < 9999);

    screenWidth = screen.width;
    screenHeight = screen.height;
    camX = 0;
    camY = 0;
    camZoom = 0.7;
};

// User Input
window.addEventListener('click', (event) => {
});

window.addEventListener('contextmenu', (event) => {
});

window.addEventListener('keypress', (event) => {
    if(event.key == 'z') {
        for(let countObject in objects) {
            objects[countObject].x = mTransX + objects[countObject].x/100;
            objects[countObject].y = mTransY + objects[countObject].y/100;
        };
    };
    if(event.key == 'r') {
        targetAngleOffset = targetAngleOffset==Math.PI/2?0:Math.PI/2;
    };
    if(event.key == 'b') {
        camX = 0; camY = 0; camZoom = 1;
    };
    if(event.key == '0') {
        HTMLconsoleVisible = !HTMLconsoleVisible;
        resizeCanvas();
    };
    if(event.key == 'h') {
        tutorialPopup();
    };
});

window.onresize = () => {
    resizeCanvas();
};

window.addEventListener('keydown', (event) => {
    if(event.key == 'd' || event.key == 'a') {
        camVelX += (5/camZoom) * ((event.key=='d') - (event.key=='a'));
    };
    if(event.key == 'w' || event.key == 's') {
        camVelY -= (5/camZoom) * ((event.key=='w') - (event.key=='s'));
    };
    if(event.key == 'q' || event.key == 'e') {
        camVelZoom += (camZoom/25) * ((event.key=='q') - (event.key=='e'));
    };
});

window.addEventListener('keyup', (event) => {
});

window.addEventListener('wheel', (event) => {
    camVelZoom += event.deltaY * -0.0002;
});

onmousemove = function (e) {
    screenX = screen.getBoundingClientRect().left;
    screenY = screen.getBoundingClientRect().top;
    mouseX = e.clientX - screenX - mouseOffsetX;
    mouseY = e.clientY - screenY - mouseOffsetY;
};

onmousedown = function (e) {
    mouseState = 1;
    targetAngleOffset = targetAngleOffset==Math.PI/2?0:Math.PI/2;
};

onmouseup = function (e) {
    mouseState = 0;
    resetSelected();
    screenX = screen.getBoundingClientRect().left;
    screenY = screen.getBoundingClientRect().top;
    mouseX = e.clientX - screenX - mouseOffsetX;
    mouseY = e.clientY - screenY - mouseOffsetY;
};

// Pre-Loop
resizeCanvas();
//objects.push(new cell);

// Tutorial
tutorialPopup();

// Loop
//ctx.transform(0, 0, 0, 0, 0, 0);
setInterval(main, 5);