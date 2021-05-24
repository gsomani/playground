var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var pi = Math.PI;

function  great_circle(theta){
    return [-Math.cos(theta)/Math.sin(theta),1/Math.abs(Math.sin(theta))];
}

function small_circle(theta){
    return [1/Math.sin(theta),Math.abs(Math.cos(theta)/Math.sin(theta))];
 }

function scale(arr,factor){
	var i;
	for(i=0;i<arr.length;i++){
		arr[i]*=factor;
	}
}

function add_inputs(){
	var x = document.createElement("input");
	x.innerHTML = "x";
	var y = document.createElement("input");
	y.innerHTMl = "y";
	var z = document.createElement("input");
	z.innerHTML = "z";
	x.type = "number";
	y.type = "number";
	z.type = "number";

	document.body.appendChild(x);
	document.body.appendChild(y);
	document.body.appendChild(z);
}

function wulff_net(){
    var th,pad=2;
    var st  = new Array(2);
    var gt  = new Array(2);
    var g  = new Array(2);
    var s  = new Array(2);
    
	size = document.getElementById("size").value;
	var factor = 0.5*size,cx,cy;
       cx = cy = 0.5*size + pad;
       canvas.width = canvas.height = size + 2*pad;
	var delta = pi/36;
	for(i=0, th = -0.5*pi ; th <= 0.5*pi; i++,th+=delta){
    	g = great_circle(th);
    	s = small_circle(th);
	st = [0.5*pi + th, 0.5*pi - th];
	gt = [pi + th, pi - th];
    	if(th>0){
    		st = [-st[0],-st[1]];
    		gt = [-th,th];
	}
	scale(g,factor);
        scale(s,factor);
	if(i % 3 == 0)
		ctx.lineWidth = 2;
	else 
		ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(g[0]+cx, cy , g[1], gt[0], gt[1]);
	ctx.stroke();
	ctx.beginPath();
   	ctx.arc(cx, s[0]+cy, s[1], st[0], st[1]);
        ctx.stroke();
	}

	ctx.beginPath();
	ctx.moveTo(cx - 0.5*size, cy);
        ctx.lineTo(cx + 0.5*size, cy);
        ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(cx, cy - 0.5*size);
        ctx.lineTo(cx, cy + 0.5*size);
        ctx.stroke();

	document.body.appendChild(canvas);
	add_inputs();
}

function norm(X){
	var i,sum;
	for(i=0,sum=0;i<X.length;i++)
		sum += X[i]*X[i];
	return Math.sqrt(sum);
}

function stereo_cartesian(x,y,z){
    var m = norm([x,y,z]); 
    return [x/(m+z),y/(m+z)];
}

function draw_point(x,size,color){
 ctx.fillstyle = color;	
 ctx.beginPath();
 ctx.arc(x[0],x[1], size, 0, 2*pi);
 ctx.fill();
}

function add_point(){
	x = document.getElementById("x").value;
	y = document.getElementById("y").value;
        z = document.getElementById("z").value;
       var point = new Array(2);
       point = stereo_cartesian(x,y,z);
       draw_point(point,2,"blue");
}
