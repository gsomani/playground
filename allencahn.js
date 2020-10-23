// Evolution of order parameter profile over time
var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");

// Create 2D array
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

var eta,diff,constants,f;

function set_color(eta_cur,eta_max,eta_min,phaseField,gray,pos){
	var red,green,blue;
	if(gray==0)
	{
	var part=(eta_max-eta_min)/4;
	var parts=Math.floor((eta_max-eta_cur)/part);
	switch(parts)
	{
	case 0:
		red=255;blue=0;
		green = ((eta_max-eta_cur)/part)*255;
		break;
	case 1:  
		green=255;blue=0;
		red= ((eta_cur-(eta_max-2*part))/part)*255;
		break;
	case 2:  
		red=0;green=255;
		blue = (((eta_max-2*part)-eta_cur)/part)*255;
		break;	
	case 3: 
		red=0;blue=255;
		green =((eta_cur-eta_min)/part)*255;
		break;
	default : if(parts<0) {red=255;green=blue=0;} 
			  if(parts>0) {red=green=0;blue=255;} 	
	}
	phaseField.data[pos]=Math.round(red);phaseField.data[pos+1]=Math.round(green);phaseField.data[pos+2]=Math.round(blue);
	}
	else 
	{	
		red=(eta_max-eta_cur)*255/(eta_max-eta_min);
		phaseField.data[pos]=phaseField.data[pos+1]=phaseField.data[pos+2]=Math.round(Math.min(Math.max(0,red),255));
	}
}

function fill_rect(eta_max,eta_min,width,height,phaseField,gray)
{
	var i,j,pos=0;
	for(j=1;j<=height;j++)
		for(i=1;i<=width;i++,pos+=4)
			set_color(eta[i][j],eta_max,eta_min,phaseField,gray,pos);
	ctx.putImageData(phaseField,6,0);		
}

function init_eta(width,height,eta_max,eta_min,phaseField,color_scale,gray){
var i,j,pos=0;

for(i=-1,pos=0;i<=1;i+=2/width,pos+=4){
		set_color(i,eta_max,eta_min,color_scale,gray,pos);
		color_scale.data[pos+3]=255;
	}

for(i=0;i<20;i++)
	ctx.putImageData(color_scale,6,i+height+35);	

for(j=1;j<=height;j++)
	for(i=1;i<=width;i++,pos+=4)
		{eta[i][j]=(Math.random()-0.5)*0.01;phaseField.data[pos+3]=255;}
fill_rect(eta_max,eta_min,width,height,phaseField,gray);		
}

function periodic_boundary(width,height){
	var j;
	for (j=1;j<=width;j++) {eta[j][0]=eta[j][height];eta[j][height+1]=eta[j][1];}
	for(j=1;j<=height;j++) {eta[0][j]=eta[width][j];eta[width+1][j]=eta[1][j];}
}

function update_eta(M,k,dt,width,height,iterations,eta_max,eta_min,phaseField,gray,timeSteps){
	var i,j,t,laplace_eta,mul=M*dt;
	for(t=0;t<timeSteps;t++){
	periodic_boundary(width,height);
	for (i=1;i<=width;i++)
		for(j=1;j<=height;j++)
			f[i][j]=eta[i][j]*(eta[i][j]*eta[i][j]-1);
	for (i=1;i<=width;i++)
		for(j=1;j<=height;j++)
			{	laplace_eta=eta[i+1][j]+eta[i-1][j]+eta[i][j+1]+eta[i][j-1]-4*eta[i][j];
				constants[i][j]=mul*(k*laplace_eta-f[i][j])+eta[i][j];				
				diff[i][j]=mul*(2*k*laplace_eta-f[i][j]);
			}
	for (i=1;i<=width;i++)
		for (j=1;j<=height;j++)
		 	eta[i][j]=eta[i][j]+diff[i][j];
	while(iterations){
	periodic_boundary(width,height);
	for (i=1;i<=width;i++)
		for (j=1;j<=height;j++)
		 	eta[i][j]=(constants[i][j]+k*mul*(eta[i+1][j]+eta[i-1][j]+eta[i][j+1]+eta[i][j-1]))/(1+4*k*mul);
	iterations--;	
	}	 		
}	
fill_rect(eta_max,eta_min,width,height,phaseField,gray);	
}

// Runs Animation
function run_AllenCahn(k,width,height,gray,timeSteps,timeGap)
{
	var M=1,dt=0.01,iterations=10,eta_max=1,eta_min=-1;
	var phaseField=ctx.createImageData(width,height),color_scale=ctx.createImageData(width+1,1);
    canvas.width=width+12;canvas.height=height+85;
    eta= new2dArray(width+2,height+2);diff= new2dArray(width+2,height+2);constants= new2dArray(width+2,height+2);f= new2dArray(width+2,height+2);
	init_eta(width,height,eta_max,eta_min,phaseField,color_scale,gray);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Orientation", 5+width/2, height+20);
	ctx.fillText(-1, 6, height+75);
	ctx.fillText(0, 6+0.5*width, height+75);
	ctx.fillText(1, 6+width,height+75);	
	setInterval(function(){update_eta(M,k,dt,width,height,iterations,eta_max,eta_min,phaseField,gray,timeSteps)},timeGap);
    document.body.appendChild(canvas);
}
