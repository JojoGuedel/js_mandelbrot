function createVertexShader(gl) {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShader, [
        "attribute vec2 a_pos;",
        "attribute vec2 a_scale;",
        "attribute vec2 a_offset;",
        "",
        "varying vec2 v_scale;",
        "varying vec2 v_offset;",
        "void main() {",
        "   gl_Position = vec4(a_pos, 0.0, 1.0);",
        "   v_scale = a_scale;",
        "   v_offset = a_offset;",
        "}"
    ].join('\n'));
    gl.compileShader(vertexShader);

    return vertexShader;
}

function createFragmentShader(gl) {
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShader, [
        "precision highp float;",
        "varying vec2 v_scale;",
        "varying vec2 v_offset;",
        "",
        "vec2 z;",
        "vec2 c;",
        "",
        "int get_iterations(int max_iterations) {",
        "   z = vec2(0.0, 0.0);",
        "   c = gl_FragCoord.xy / v_scale.xy + v_offset.xy;",
        "   ",
        "   for(int i = 0; i < 1000000; i++) {",
        "       float zX = z.x * z.x - z.y * z.y + c.x;",
        "       z.y = 2.0 * z.x * z.y + c.y;",
        "       z.x = zX;",
        "       ",
        "       if (z.x * z.x + z.y * z.y >= 4.0) {",
        "           return i;",
        "       }",
        "       if (i >= max_iterations) {",
        "           return max_iterations;",
        "       }",
        "   }",
        "   return max_iterations;",
        "}",
        "",
        "void main() {",
        "   float iterations = float(get_iterations(300));",
        "   float col = sin(iterations / 300.0);",
        "   gl_FragColor = vec4(0.0, col, col, 1.0);",
        "}",
    ].join("\n"));
    gl.compileShader(fragmentShader);

    return fragmentShader;
}


//var debug_fps = document.getElementById("debug-info-render-time");

var canvas = document.getElementById("render-canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var draging = false;
var mouse = [];
var p_mouse = [];
var offset = [0, 0];
var scale = [400.0, 400.0];

var last_update = Date.now();

offset = to_world([-canvas.width / 2, 1.5 * canvas.height]);

var gl = canvas.getContext('webgl');
var program = gl.createProgram();
var vertexShader = createVertexShader(gl);
var fragmentShader = createFragmentShader(gl);

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);


var vertices = new Float32Array([
    -1.0, 1.0,
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0,
    1.0, -1.0
]);

var posID = gl.getAttribLocation(program, "a_pos");
gl.enableVertexAttribArray(posID);

var posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.vertexAttribPointer(posID, 2, gl.FLOAT, false, 0, 0);

var scaleID = gl.getAttribLocation(program, "a_scale");
var offsetID = gl.getAttribLocation(program, "a_offset");

window.onwheel = on_mousewheel;
window.onmousedown = on_mousedown;
window.onmousemove = on_mousemove;
window.onmouseup = on_mouseup;

window.requestAnimationFrame(render);

function on_mousedown(event) {
    if (event.button == 0) {
        draging = true;
    }
}

function on_mouseup(event) {
    if (event.button == 0 && draging == true) {
        draging = false;
    }
}

function on_mousemove(event) {
    mouse = [event.pageX, event.pageY]

    if (draging) {
        offset[0] -= (mouse[0] - p_mouse[0]) / scale[0];
        offset[1] += (mouse[1] - p_mouse[1]) / scale[1];
    }

    p_mouse = mouse;
}

function on_mousewheel(event) {
    let factor = 1;
    if (event.deltaY < 0)
        factor = 1.1;
    else
        factor = 1 / 1.1;
    
    let pre_mouse = to_world(mouse);
    scale = [scale[0] * factor, scale[1] * factor];
    let post_mouse = to_world(mouse);

    offset[0] += pre_mouse[0] - post_mouse[0];
    offset[1] += pre_mouse[1] - post_mouse[1];

    console.log(scale);
}

function to_world(vec) {
    let world = [];
    world[0] = vec[0] / scale[0] + offset[0];
    world[1] = (canvas.height - vec[1]) / scale[1] + offset[1];
    return world;
}

function to_screen(vec) {
    let screen = [];
    screen[0] = (vec[0] - offset[0]) * scale[0];
    screen[1] = canvas.height - (vec[1] - offset[1]) * scale[1];
    return screen;
}

function render() {
    var delta = Date.now() - last_update;
    last_update = Date.now();

    //debug_fps.innerHTML = "Time to Render: " + delta + "ms";

    gl.vertexAttrib2fv(offsetID, offset);
    gl.vertexAttrib2fv(scaleID, scale);

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

    window.requestAnimationFrame(render);
}
