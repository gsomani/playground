// Evolution of Concentration profile over time
var canvas =document.getElementById("canvas");
var ctx=canvas.getContext("2d");var max_size_x,max_size_y;
max_size_x=Math.floor(0.5*canvas.width);max_size_y=canvas.height;

// Create 2D array
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

var conc_A,conc_B;

// Converts concentration into color with c_max as red and c_min as blue (c_max as black and c_min as white)
function set_color(phaseField,con,c_max,c_min,gray,pos){
	var red,green,blue;
	if(gray==0)
	{
	var part=(c_max-c_min)/4;
	var parts=Math.floor((c_max-con)/part);
	switch(parts)
	{
	case 0:
		red=255;blue=0;
		green = ((c_max-con)/part)*255;
		break;
	case 1:  
		green=255;blue=0;
		red= ((con-(c_max-2*part))/part)*255;
		break;
	case 2:  
		red=0;green=255;
		blue = (((c_max-2*part)-con)/part)*255;
		break;	
	case 3: 
		red=0;blue=255;
		green =((con-c_min)/part)*255;
		break;
	default : if(parts<0) {red=255;green=blue=0;} 
			  if(parts>0) {red=green=0;blue=255;} 	
	}
	phaseField.data[pos]=Math.round(red);phaseField.data[pos+1]=Math.round(green);phaseField.data[pos+2]=Math.round(blue);
	}
	else 
	{	
		red=(c_max-con)*255/(c_max-c_min);
		phaseField.data[pos]=phaseField.data[pos+1]=phaseField.data[pos+2]=Math.round(Math.min(Math.max(0,red),255));
	}
}

// Colors the plane according to the color corresponding to concentration
function fill_rect(width,height,conc_a,conc_b,c_max,c_min,gray)
{
	var i,j,pos=0;
	for(j=1;j<=height;j++)
		for(i=1;i<=width;i++,pos+=4)
	{ set_color(conc_a,conc_A[i][j],c_max,c_min,gray,pos);set_color(conc_b,conc_B[i][j],c_max,c_min,gray,pos);}
	ctx.putImageData(conc_a,0,0);ctx.putImageData(conc_b,width+5,0);		
}

function periodic_boundary(conc,width,height)
{	var i;
	for (i=1;i<=width;i++) {conc[i][0]=conc[i][height];conc[i][height+1]=conc[i][1];}
	for (i=1;i<=height;i++) {conc[0][i]=conc[width][i];conc[width+1][i]=conc[1][i];}
}

// Sets up the initial concentration profile
function init_conc(width,height,conc_a,conc_b,color_scale,c_max,c_min,gray){
var i,j,pos=0;

for(i=0,pos=0;i<=1;i+=0.5/width,pos+=4){
		set_color(color_scale,i,c_max,c_min,gray,pos);
		color_scale.data[pos+3]=255;
	}

for(i=0;i<20;i++)
	ctx.putImageData(color_scale,4,i+height+35);	

for(j=1;j<=height;j++)
	for(i=1;i<=width;i++,pos+=4)
		conc_a.data[pos+3]=conc_b.data[pos+3]=255;
for(j=1;j<=height;j++)
	for(i=1;i<=width;i++)
		conc_A[i][j]=0.4+Math.random()*0.2;
for(j=1;j<=height;j++)
	for(i=1;i<=width;i++)
		conc_B[i][j]=0.4+Math.random()*0.2;
fill_rect(width,height,conc_a,conc_b,c_max,c_min,gray);
}

function laplace(conc,i,j){
return conc[i][j+1]+conc[i][j-1]+conc[i+1][j]+conc[i-1][j]-4*conc[i][j];
}

function Ra(a,b,alpha){
return a - a*a*a - b + alpha;
}

function Rb(a,b,beta){
return beta*(a-b);
}

// Updates Concentration	
function update_conc(width,height,conc_a,conc_b,Da,Db,alpha,beta,dt,c_max,c_min,gray,timeSteps){
	var i,j,t,mul_a=Da*dt,mul_b=Db*dt;
	for(t=0;t<timeSteps;t++){		
		periodic_boundary(conc_A,width,height);
        periodic_boundary(conc_B,width,height);
		for (i=1;i<=width;i++)
			for(j=1;j<=height;j++){
				conc_A[i][j]=conc_A[i][j]+mul_a*laplace(conc_A,i,j)+dt*Ra(conc_A[i][j],conc_B[i][j],alpha);
				conc_B[i][j]=conc_B[i][j]+mul_b*laplace(conc_B,i,j)+dt*Rb(conc_A[i][j],conc_B[i][j],beta);
			}
	}	
fill_rect(width,height,conc_a,conc_b,c_max,c_min,gray);	
}

// Runs Animation
function run_conc(width,height,Da,Db,alpha,beta,gray,timeSteps,timeGap)
{
	var dt=0.001,c_max=1,c_min=0;
    var conc_a= ctx.createImageData(width,height),color_scale=ctx.createImageData(2*width+1,1);
	var conc_b= ctx.createImageData(width,height);
	canvas.width=2*width+10;canvas.height=height+75;    
	conc_A= new2dArray(width+2,height+2);conc_B= new2dArray(width+2,height+2);
    init_conc(width,height,conc_a,conc_b,color_scale,c_max,c_min,gray);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("A", width/2, height+20);
	ctx.fillText("B", 1.5*width+5, height+20);
	ctx.fillText(0, 4, height+75);
	ctx.fillText(0.5, 3+width, height+75);
	ctx.fillText(1, 2*width+2,height+75);	
	setInterval(function(){update_conc(width,height,conc_a,conc_b,Da,Db,alpha,beta,dt,c_max,c_min,gray,timeSteps)},timeGap);
}
