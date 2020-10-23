var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");

class Complex { 
	
	constructor(a, b, form){
		if(typeof form == 'undefined') {
			this.real = a;
			this.im = b;
		}
		else if(form == 'p') {
			this.real = a * Math.cos(b);
			this.im = a * Math.sin(b);
		}
	}

	multiply(z){
		var a = this.real, b = this.im;		
		if(typeof z == 'number') 
		return new Complex(a*z,b*z);
		return new Complex(
			z.real * a - z.im * b,
			b * z.real + z.im * a
		);
	}

	add(z){
		return new Complex(this.real + z.real, this.im + z.im);
	}

	subtract(z){
		return new Complex(this.real - z.real, this.im - z.im);
	}
	
};

var complex_one=new Complex(1,0);

function newComplexArray(n)
{ var i,x;
  x=new Array(n);
  for(i=0;i<n;i++)
  	x[i]=new Complex(0,0);
  return x;		
}

// Create 2D array
function newComplex2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=newComplexArray(columns);
  return x;		
}

function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

var X,I;

function omega(n){
	var i,w=newComplexArray(n);
	w[0]=complex_one;
	w[1]=new Complex(1,(-2*Math.PI)/n,'p');
	for(i=2;i<n;i++)
		w[i]=w[i-1].multiply(w[1]);
	return w;
}
  
function set_color(image,con,c_max,c_min,pos){
	var r;
	r=(con-c_min)*255/(c_max-c_min);
	image.data[pos]=image.data[pos+1]=image.data[pos+2]=Math.round(r);
	image.data[pos+3]=255;
}

function fill_aperture(aperture,width,height)
{
	var i,j,pos=0;
	for(i=0;i<height;i++)
		for(j=0;j<width;j++,pos+=4)
            set_color(aperture,X[i][j].real,1,0,pos);
	ctx.putImageData(aperture,0,0);
}

function fill_diffraction(diffraction,width,height)
{
	var i,j,pos=0,d_max=0;
	for(i=0;i<height;i++)
		for(j=0;j<width;j++)
			d_max = Math.max(I[i][j],d_max);
	for(i=0;i<height;i++)
		for(j=0;j<width;j++,pos+=4)
	        set_color(diffraction,Math.log(I[i][j]),Math.log(d_max),Math.log(d_max)-10,pos);
    ctx.putImageData(diffraction,width+5,0);
}

function fill_scale(color_scale,width,height)
{
	var i,pos=0;
	for(i=0,pos=0;i>=-10;i-=10/width,pos+=4)
	        set_color(color_scale,i,0,-10,pos);

    for(i=0;i<20;i++)
		ctx.putImageData(color_scale,width+5,i+height+40);

	ctx.textAlign = 'right';
	for(i=0,pos=width+5;i>=-10;i--,pos+=0.1*width)
		ctx.fillText("10", pos, height+75);

	ctx.font = "10px Arial";
	ctx.textAlign = 'center';	
	for(i=0,pos=width+5;i>=-10;i--,pos+=0.1*width)
		ctx.fillText(i, pos+7, height+68);				
}

// FFT of 1-D Array
function fft(A,size){
	var y=newComplexArray(size);
	if(size==1) { y[0]=A[0]; return y;}
	var A_0=newComplexArray(size/2),A_1=newComplexArray(size/2),y_0=newComplexArray(size/2),y_1=newComplexArray(size/2);
	var i,sqrt_2=Math.sqrt(2);
	var w = omega(size);	
	for(i=0;i<size;i+=2){
		A_0[i/2]=A[i];
		A_1[i/2]=A[i+1];
	}
	y_0=fft(A_0,size/2);y_1=fft(A_1,size/2);
	var k;	
	for(i=0,w=complex_one;i<size/2;i++){
		k=w[i].multiply(y_1[i]);
		y[i] = y_0[i].add(k);
		y[i+size/2] = y_0[i].subtract(k);
	}
	for(i=0;i<size;i++) y[i]=y[i].multiply(1/sqrt_2);
	return y;		
}


// FFT of 2-D Matrix
function fft2d(A,width,height){
	var i,j,w_i,w_j,max_size=Math.max(width,height);var a=newComplexArray(max_size),y=newComplexArray(max_size);
	var f=newComplex2dArray(height,width);	
	if(height==1) {
		for(i=0;i<width;i++)
			a[i]=A[0][i];
		y=fft(a,width);
		for(i=0;i<width;i++)
			f[0][i]=y[i];
		return f;
	}
	if(width==1) {
		for(i=0;i<height;i++)
			a[i]=A[i][0];
		y=fft(a,height);
		for(i=0;i<height;i++)
			f[i][0]=y[i];
		return f;
	}
	var w = omega(max_size);
	var A_0=newComplex2dArray(height/2,width/2),A_1=newComplex2dArray(height/2,width/2),A_2=newComplex2dArray(height/2,width/2),A_3=newComplex2dArray(height/2,width/2),
	y_0=newComplex2dArray(height/2,width/2),y_1=newComplex2dArray(height/2,width/2),y_2=newComplex2dArray(height/2,width/2),y_3=newComplex2dArray(height/2,width/2);
	for(i=0;i<height;i+=2)
		for(j=0;j<width;j+=2){
			A_0[i/2][j/2]=A[i][j];
			A_1[i/2][j/2]=A[i+1][j];
			A_2[i/2][j/2]=A[i][j+1];
			A_3[i/2][j/2]=A[i+1][j+1];
	}
	y_0=fft2d(A_0,width/2,height/2),y_1=fft2d(A_1,width/2,height/2),y_2=fft2d(A_2,width/2,height/2),y_3=fft2d(A_3,width/2,height/2);
	var a_i,a_j,a_ij;
    	for(i=0,w_i=complex_one;i<height/2;i++)
		for(j=0,w_j=complex_one;j<width/2;j++){
			a_i = w[i].multiply(y_1[i][j]);
			a_j = w[j].multiply(y_2[i][j]);
			a_ij = w[i].multiply(w[j]).multiply(y_3[i][j]);
			f[i][j] = y_0[i][j].add(a_i).add(a_j).add(a_ij);
			f[i+height/2][j]=y_0[i][j].subtract(a_i).add(a_j).subtract(a_ij);
			f[i][j+width/2]=y_0[i][j].add(a_i).subtract(a_j).subtract(a_ij);
			f[i+height/2][j+width/2]=y_0[i][j].subtract(a_i).subtract(a_j).add(a_ij);
	}	
	for(i=0;i<height;i++)
		for(j=0;j<width;j++) 
			f[i][j]=f[i][j].multiply(0.5);
	return f;
}

function shift_to_center(A,width,height){
	var x,y;var B=newComplex2dArray(height,width);
	for(x=0;x<height/2;x++)
		for(y=0;y<width/2;y++)
		{	
			B[x+height/2][y+width/2]=A[x][y];
			B[x][y+width/2]=A[x+height/2][y];
			B[x+height/2][y]=A[x][y+width/2];
			B[x][y]=A[x+height/2][y+width/2];
		}
	return B;
}

function init(size,aperture_type,aperture_width,aperture_height){
	var i,j,cur_x,cur_y;
	switch(aperture_type)
	{ case 'ellipse':
		for(i=0;i<size;i++){
			cur_x = (i-size/2) / aperture_height ;
			for(j=0;j<size;j++){	
				cur_y = (j-size/2) / aperture_width ;
			if( cur_x*cur_x + cur_y*cur_y < 1)
				X[i][j].real= 1; 					
			}
		}
		break;
	  case 'rectangle':
		for(i=0,cur_x=Math.round(0.5*(size-aperture_height));i<aperture_height;i++,cur_x++)
			for(j=0,cur_y=Math.round(0.5*(size-aperture_width));j<aperture_width;j++,cur_y++)	
				X[cur_x][cur_y].real= 1; 					
		break;
	}			
}

function fftshift(A,width,height){
	var Y=newComplex2dArray(height,width);
	Y=fft2d(A,width,height);	
	return shift_to_center(Y,width,height);		
}

function diffracted_intensity(A,width,height){
	var i;	var D=newComplex2dArray(height,width);
	D = fftshift(A,width,height);
	for(i=0;i<height;i++)
		for(j=0;j<width;j++)
			I[i][j] = D[i][j].real * D[i][j].real + D[i][j].im * D[i][j].im ;
}

function run(size)
{
var aperture_type = document.getElementById("aperture_type").value,aperture_width = +document.getElementById("aperture_width").value,aperture_height = +document.getElementById("aperture_height").value;
X=newComplex2dArray(size,size);
I=new2dArray(size,size);
var aperture = ctx.createImageData(size,size);
var diffraction = ctx.createImageData(size,size),color_scale=ctx.createImageData(size+1,1);
canvas.width=2*size+35;canvas.height=size+100;
init(size,aperture_type,aperture_width,aperture_height);
fill_aperture(aperture,size,size);
diffracted_intensity(X,size,size);
fill_diffraction(diffraction,size,size);
ctx.font = "20px Arial";	
ctx.textAlign = 'center';
ctx.fillText("Aperture", 0.5*size,size+20);
ctx.fillText("Diffraction", 1.5*size+5,size+20);
fill_scale(color_scale,size,size);
document.body.appendChild(canvas);
}	
