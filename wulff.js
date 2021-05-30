var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var pi = Math.PI,size,factor,cx,cy;

function  great_circle(theta){
    return [-Math.cos(theta)/Math.sin(theta),1/Math.abs(Math.sin(theta))];
}

function small_circle(theta){
    return [1/Math.sin(theta),Math.abs(Math.cos(theta)/Math.sin(theta))];
 }


function add_number(){
	document.body.appendChild(document.createElement("br"));	
	document.body.appendChild(document.createTextNode(" Number of points "));
	var i,j, x;
	
            var input = document.createElement("input");
	    input.type = "number";
	    input.id = "points";
	    document.body.appendChild(input);
	
	var btn = document.createElement("input");
	btn.type = "submit";
	btn.name = "btn";
	btn.value = "Add points [ direction (x y z)]";
	document.body.appendChild(btn);
	btn.onclick = function(){add_inputs()}; 
}


function add_inputs(){
	var n = document.getElementById("points").value;
	var i,j,x;
	for(j = 0; j <= n ; j++){
                document.body.appendChild(document.createElement("br"));
		if(j==0)
			document.body.appendChild(document.createTextNode(" Zone Axis"));
		else
			document.body.appendChild(document.createTextNode(j+")"));
		for(i = 0; i<3;i++){
			x = document.createElement("input");
			x.type = "number";
	        	x.id = "x" + i + j;
			document.body.appendChild(x);
		}
	}
	var btn = document.createElement("input");
	btn.type = "submit";
	btn.name = "btn";
	btn.value = "Draw points";
	document.body.appendChild(btn);
	btn.onclick = function(){add_points(n)}; 
}

function wulff_net(){
    var i;
    var st  = new Array(2);
    var gt  = new Array(2);
    var g  = new Array(2);
    var s  = new Array(2);
    
	size = document.getElementById("size").value;
	factor = 0.5*size; pad=20;
	cx = cy = 0.5*size + pad;

	var deg = "\u00B0";
	var font_size = 1/16, pos = new Array(2);
	canvas.width = canvas.height = 2*cx;
	canvas.width += 4*pad;
	ctx.transform(0.5*size,0,0,-0.5*size,cx,cy);
	var delta = pi/36,th_d;
	ctx.font = font_size + "px Comic Sans MS";
	
	var vert=new Array(2);
	for(i=0, th = -0.5*pi ; th <= 0.5*pi; i++,th+=delta){
    	
	th_d = -90 + i*5;
	g = great_circle(th);
    	s = small_circle(th);
	st = [0.5*pi + th, 0.5*pi - th];
	gt = [pi + th, pi - th];
	ctx.globalAlpha = 1;
    	if(th>0){
    		st = [-st[0],-st[1]];
    		gt = [-th,th];
	}
	
	
	pos = [Math.cos(th),Math.sin(th)];
	
		if(i % 3 == 0){
		ctx.lineWidth = 1/512;
		
		if(pos[1]<0)
			vert = [0,0.5*font_size]; 
		else
			vert = [0.5*font_size,0];

		if(th_d != 90 &&  th_d != -90  && th_d)
		{
			ctx.save();
			ctx.scale(1,-1);
			ctx.textAlign = "right";
			ctx.fillText(-th_d + deg, -pos[0], pos[1] + vert[0]);
			ctx.textAlign = "left";
			ctx.fillText(th_d + deg, pos[0], -pos[1] + vert[1]);
			ctx.restore();
		}
	}
	else 
		ctx.lineWidth = 1/1024;
	
	ctx.beginPath();
	ctx.arc(g[0], 0, g[1], gt[0], gt[1]);
	ctx.stroke();
	ctx.beginPath();
   	ctx.arc(0, s[0], s[1], st[0], st[1]);
        ctx.stroke();

	}

	ctx.save();
	ctx.scale(1,-1);
	ctx.textAlign = "right";
	ctx.fillText(0 + deg, -1, 0.25*font_size);
	ctx.textAlign = "left";
	ctx.fillText(0 + deg, 1, 0.25*font_size);
	ctx.textAlign = "center";
	ctx.fillText(90 + deg, 0, -1);
	ctx.fillText(-90 + deg, 0, 1 + 0.5*font_size);	
	ctx.restore();
	
	ctx.beginPath();
	ctx.moveTo(-1 , 0);
        ctx.lineTo(1, 0);
        ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(0, -1);
        ctx.lineTo(0, 1);
        ctx.stroke();

	add_number();
}

// Create 2D array
function new2dArray(rows,columns)
{ var i,j,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

class Matrix{
	
	constructor(m,n){
        var i,j;
	if(arguments.length==1){
		this.rows=1;
		this.cols=m.length;
		this.matrix=new2dArray(this.rows,this.cols);
		for(i=0;i<this.cols;i++)
			this.matrix[0][i]=m[i];
	}

	else {		
	this.rows=m;
	this.cols=n;
        this.matrix = new2dArray(m,n);
	for(i=0;i<m;i++)
		for(j=0;j<n;j++)
			this.matrix[i][j]=0;
	}
	}
	transpose(){
	var i,j,A;
        A=new Matrix(this.cols,this.rows);
            for(i=0;i<this.rows;i++)
		for(j=0;j<this.cols;j++)
                       A.matrix[j][i] = this.matrix[i][j];
        return A;
	}

	dot(B){
	var i,j,k,A;
        A=new Matrix(this.rows,B.cols);
            for(i=0;i<this.rows;i++)
		for(j=0;j<B.cols;j++)
			for(k=0;k<this.cols;k++)
                       		A.matrix[i][j]+=this.matrix[i][k]*B.matrix[k][j];
        return A;
	}

	transform(v){
	var V = new Matrix(v), M; 
	M = this.dot(V.transpose());
	return M.transpose().matrix[0];
	}
};

function dot(a,b){
	var i,sum;
	for(i=0,sum=0;i<a.length;i++){
		sum += a[i]*b[i];
	}
	return sum;
}

function norm(X){
	return Math.sqrt(dot(X,X));
}

function transform_matrix(X){
 var R = new Matrix(3,3), a, r = new Array(2);
 a = Math.sqrt(1-X[1]*X[1]);
 r = [X[0]/a,X[2]/a]; 
 R.matrix[0] = [r[1],0,-r[0]];
 R.matrix[1] = [-X[1]*r[0],a,-X[1]*r[1]];
 R.matrix[2] = X;
 return R;
}

function stereo_cartesian(x){
    var xx = new Array(2);
    for(i=0;i<2;i++)
	xx[i] = x[i]/(1+x[2]);
    return xx;
}

function add_color_point(ctx,X,size,color){
 ctx.beginPath();
 ctx.fillStyle = 'rgb('+color[0]+','+color[1]+','+color[2]+')';	
ctx.arc(X[0],X[1], size, 0, 2*pi);
 ctx.fill();
}

function draw_point(x,size,color){
  var X= new Array(2);
  X = stereo_cartesian(x);
add_color_point(ctx,X,size,color);
} 

function set_color(value){
	var red,green,blue;
	var parts=Math.floor(4*(1-value));
	switch(parts)
	{
	case 0:
		red=255;blue=0;
		green =(1-value)*1020;
		break;
	case 1:  
		green=255;blue=0;
		red = (value-0.5)*1020;
		break;
	case 2:  
		red=0;green=255;
		blue = (0.5-value)*1020;
		break;	
	case 3: 
		red=0;blue=255;
		green = value*1020;
		break;
	default : if(parts<0) {red=255;green=blue=0;} 
			  if(parts>0) {red=green=0;blue=255;} 	
	}
	red=Math.round(red);green=Math.round(green);blue=Math.round(blue);
	return [red,green,blue];
}

function normalise(x){
	var i,y = new Array(x.length),m;
	m = norm(x);
	for(i=0;i<x.length;i++)
		y[i] = x[i]/m;
	return y;
}

function add_points(n){	
	var pos_y,x,y,z,i,max = 255, color = new Array(3), axis = new Array(3);
	var m, vec = new Array(3),R = new Matrix(3,3);
	for(i=0;i<=n;i++){
	x = document.getElementById("x0"+i).value;
	y = document.getElementById("x1"+i).value;
        z = document.getElementById("x2"+i).value;	

	vec = normalise([x,y,z]);

        if(i==0){
		axis = [vec[0],vec[1],vec[2]];
		R = transform_matrix(axis);
		console.log(R);
	}
	color = set_color(i/n);
		
	vec = R.transform(vec);
	
	draw_point(vec,1/64,color);
	
	ctx.save();
	ctx.scale(1,-1);
	pos_y = -1 + (i+1)/16;

	if(vec[2]>=0){
		add_color_point(ctx,[1+3*pad/size, pos_y],1/64,color);

		ctx.fillText( "("+x+" "+y+" "+z+")", 1+ 4*pad/size , pos_y + 1/64);
	}
	ctx.restore();

	}
}
