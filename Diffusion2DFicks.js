// Evolution of Concentration profile over time
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

var conc,constants,coeff_x,coeff_y,factor_x,factor_y,q_x,q_y,diff;


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
function fill_rect(width,height,phaseField,c_max,c_min,gray)
{
	var i,j,pos=0;
	for(j=1;j<=height;j++)
		for(i=1;i<=width;i++,pos+=4)
			set_color(phaseField,conc[i][j],c_max,c_min,gray,pos);
	ctx.putImageData(phaseField,6,0);		
}

function coeff_implicit(width,height)
{
	var i,mul=0.25;
	factor_x[1]=factor_y[1]=2*(2*mul+1);coeff_x[1]=coeff_y[1]=-mul/factor_x[1];
	for(i=2;i<width;i++)
		{
			factor_x[i]=1+2*mul+mul*coeff_x[i-1];	
			coeff_x[i]=-mul/factor_x[i];
		}
	factor_x[width]=1+2*mul+(mul*mul)/(1+2*mul)+mul*coeff_x[width-1];	
	coeff_x[width]=0;
	for(i=2;i<height;i++)
		{
			factor_y[i]=1+2*mul+mul*coeff_y[i-1];	
			coeff_y[i]=-mul/factor_y[i];	
		}
	factor_y[height]=1+2*mul+(mul*mul)/(1+2*mul)+mul*coeff_y[height-1];	
	coeff_y[height]=0;
	for(i=2;i<width;i++) q_x[i]=0;
	for(i=2;i<height;i++) q_y[i]=0;
	q_x[1]=q_y[1]=-0.5;q_x[width]=q_y[height]=-mul;
	for(i=2;i<=width;i++)
		q_x[i]=(q_x[i]+mul*q_x[i-1])/factor_x[i];
	for(i=2;i<=height;i++)
		q_y[i]=(q_y[i]+mul*q_y[i-1])/factor_y[i];
	for(i=width-1;i>0;i--)
		q_x[i]=q_x[i]-coeff_x[i]*q_x[i+1];
	for(i=height-1;i>0;i--)
		q_y[i]=q_y[i]-coeff_y[i]*q_y[i+1];									
	b_x=q_x[1]+(mul*q_x[width])/(1+2*mul);
	b_y=q_y[1]+(mul*q_y[height])/(1+2*mul);
	b_x++;b_y++;
}

function lod_implicit_x(length,row){
var i,mul=0.25,a; 
for(i=1;i<=length;i++)
	diff[i]=mul*(conc[i-1][row]-2*conc[i][row]+conc[i+1][row]);
for(i=1;i<=length;i++)
	conc[i][row]=conc[i][row]+diff[i];	
conc[1][row]=conc[1][row]/factor_x[1];
for(i=2;i<=length;i++)
	conc[i][row]=(conc[i][row]+mul*conc[i-1][row])/factor_x[i];
for(i=length-1;i>0;i--)
	conc[i][row]=conc[i][row]-coeff_x[i]*conc[i+1][row];
a=conc[1][row]+(conc[length][row]*mul)/(1+2*mul);
for(i=1;i<=length;i++)
	conc[i][row]=conc[i][row]-(a/b_x)*q_x[i];
}

function lod_implicit_y(length,row){
var i,mul=0.25,a;
for(i=1;i<=length;i++)
	diff[i]=mul*(conc[row][i-1]-2*conc[row][i]+conc[row][i+1]);
for(i=1;i<=length;i++)
	conc[row][i]=conc[row][i]+diff[i];	
conc[row][1]=conc[row][1]/factor_y[1];
for(i=2;i<=length;i++)
	conc[row][i]=(conc[row][i]+mul*conc[row][i-1])/factor_y[i];
for(i=length-1;i>0;i--)
	conc[row][i]=conc[row][i]-coeff_y[i]*conc[row][i+1];
a=conc[row][1]+(conc[row][length]*mul)/(1+2*mul);
for(i=1;i<=length;i++)
	conc[row][i]=conc[row][i]-(a/b_y)*q_y[i];
}

function periodic_boundary(width,height)
{	var i;
	for (i=1;i<=width;i++) {conc[i][0]=conc[i][height];conc[i][height+1]=conc[i][1];}
	for (i=1;i<=height;i++) {conc[0][i]=conc[width][i];conc[width+1][i]=conc[1][i];}
}

function update_conc_lod_implicit(width,height){
	var i;
	for (i=1;i<=height;i++) lod_implicit_x(width,i);
	periodic_boundary(width,height);
	for (i=1;i<=width;i++) lod_implicit_y(height,i);	
}

// Sets up the initial concentration profile
function init_conc(width,height,phaseField,color_scale,c_max,c_min,gray){
var i,j,pos=0;

for(i=0,pos=0;i<=1;i+=1/width,pos+=4){
		set_color(color_scale,i,c_max,c_min,gray,pos);
		color_scale.data[pos+3]=255;
	}

for(i=0;i<20;i++)
	ctx.putImageData(color_scale,4,i+height+35);	

for(j=1;j<=height;j++)
	for(i=1;i<=width;i++,pos+=4)
		phaseField.data[pos+3]=255;
for(j=1;j<=height;j++)
	for(i=1;i<=width;i++)
		conc[i][j]=Math.random();
fill_rect(width,height,phaseField,c_max,c_min,gray);		
}

// Updates Concentration	
function update_conc(width,height,phaseField,c_max,c_min,iterations,gray,timeSteps){
	var i,j,k,t,mul=0.25,f;f=1/(1+4*mul);
	for(t=0;t<timeSteps;t++){		
		periodic_boundary(width,height);
		for (i=1;i<=width;i++)
			for(j=1;j<=height;j++)
				constants[i][j]=conc[i][j]+mul*(conc[i][j+1]+conc[i][j-1]+conc[i+1][j]+conc[i-1][j]-4*conc[i][j]);
		update_conc_lod_implicit(width,height);
		for(k=0;k<iterations;k++){
		periodic_boundary(width,height);
			for(i=1;i<=width;i++)
				for(j=1;j<=height;j++)
				 conc[i][j]=f*(mul*(conc[i][j+1]+conc[i][j-1]+conc[i+1][j]+conc[i-1][j])+constants[i][j]);		 
		}
	}	
fill_rect(width,height,phaseField,c_max,c_min,gray);	
}

// Runs Animation
function run_conc(width,height,gray,timeSteps,timeGap)
{
	var c_max=1,c_min=0,iterations=5;
	var phaseField=ctx.createImageData(width,height),color_scale=ctx.createImageData(width+1,1);
	canvas.width=width+12;canvas.height=height+85;
	conc= new2dArray(width+2,height+2);constants= new2dArray(width+2,height+2);
    coeff_x=new Array(width+2);coeff_y=new Array(height+2);
	factor_x=new Array(width+2);factor_y=new Array(height+2);
	q_x=new Array(width+2);q_y=new Array(height+2);
    diff=new Array(Math.max(width,height)+2);
	init_conc(width,height,phaseField,color_scale,c_max,c_min,gray);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Phasefield", 5+width/2, height+20);
	ctx.fillText(0, 6, height+75);
	ctx.fillText(0.5, 6+0.5*width, height+75);
	ctx.fillText(1, width+6,height+75);
	coeff_implicit(width,height);
	setInterval(function(){update_conc(width,height,phaseField,c_max,c_min,iterations,gray,timeSteps)},timeGap);
    document.body.appendChild(canvas);
}
