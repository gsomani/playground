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

var conc,diff,f,constants;

// Converts concentration into color with c_max as red and c_min as blue (c_max as black and c_min as white)
function set_color(con,c_max,c_min,phaseField,gray,pos){
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
function fill_rect(c_max,c_min,width,height,phaseField,gray)
{
	var i,j,pos=0;
	for(j=2;j<=height+1;j++)
		for(i=2;i<=width+1;i++,pos+=4)
			set_color(conc[i][j],c_max,c_min,phaseField,gray,pos);
	ctx.putImageData(phaseField,6,0);		
}

function periodic_boundary(width,height)
{
	var i,j;
	for (i=2;i<=width+1;i++) {
	conc[i][0]=conc[i][height];conc[i][1]=conc[i][height+1];conc[i][height+2]=conc[i][2];conc[i][height+3]=conc[i][3];
	f[i][1]=f[i][height+1];f[i][height+2]=f[i][2];
	}
	for(j=2;j<=height+1;j++) {
	f[1][j]=f[width+1][j];f[width+2][j]=f[2][j];
	conc[0][j]=conc[width][j];conc[1][j]=conc[width+1][j];conc[width+2][j]=conc[2][j];conc[width+3][j]=conc[3][j];
	}
	conc[1][1]=conc[width+1][height+1];conc[width+2][height+2]=conc[2][2];
	conc[width+2][1]=conc[2][height+1];conc[1][height+2]=conc[width+1][2];			
}

// Sets up the initial concentration profile
function init_conc(width,height,x_b,phaseField,color_scale,gray){
var i,j,pos=0;

for(i=0,pos=0;i<=1;i+=1/width,pos+=4){
		set_color(i,1,0,color_scale,gray,pos);
		color_scale.data[pos+3]=255;
	}

for(i=0;i<20;i++)
	ctx.putImageData(color_scale,6,i+height+35);	

for(j=2;j<=height+1;j++)
	for(i=2;i<=width+1;i++,pos+=4)
		phaseField.data[pos+3]=255;
for(j=2;j<=height+1;j++)
	for(i=2;i<=width+1;i++)
		{conc[i][j]=x_b+(Math.min(x_b,1-x_b)/5)*(Math.random()-0.5);}
fill_rect(1,0,width,height,phaseField,gray);		
}

function diff_conc(i,j)
{
	var sum=new Array(3);
	sum[0]=conc[i+2][j]+conc[i][j-2]+conc[i-2][j]+conc[i][j+2];
	sum[1]=conc[i+1][j]+conc[i-1][j]+conc[i][j+1]+conc[i][j-1];
	sum[2]=conc[i+1][j+1]+conc[i-1][j+1]+conc[i+1][j-1]+conc[i-1][j-1];
	return sum[0]-8*sum[1]+2*sum[2]+20*conc[i][j];
}

// Updates Concentration	
function update_conc(A,k,width,height,iterations,phaseField,gray,timeSteps){
	var i,j,t,mul=0.01,laplace_f;
	for(t=0;t<timeSteps;t++){
	for (i=2;i<=width+1;i++)
		for(j=2;j<=height+1;j++)
			f[i][j]=2*A*conc[i][j]*(conc[i][j]-1)*(2*conc[i][j]-1);
	periodic_boundary(width,height);
	for (i=2;i<=width+1;i++)
		for(j=2;j<=height+1;j++)
			{
				diff[i][j]=k*diff_conc(i,j);laplace_f=f[i+1][j]+f[i-1][j]+f[i][j+1]+f[i][j-1]-4*f[i][j];
				constants[i][j]=conc[i][j]+mul*(laplace_f-diff[i][j]);
				diff[i][j]=mul*(laplace_f-2*diff[i][j]);
			}
	for (i=2;i<=width+1;i++)
		for (j=2;j<=height+1;j++)
		 	conc[i][j]=conc[i][j]+diff[i][j];
	while(iterations){
		periodic_boundary(width,height);
		for (i=2;i<=width+1;i++)
			for (j=2;j<=height+1;j++)
			conc[i][j]=(constants[i][j]-mul*k*(diff_conc(i,j)-20*conc[i][j]))/(1+20*mul*k);
		iterations--;
	}		 		 	
}		
fill_rect(1,0,width,height,phaseField,gray);	
}

// Runs Animation
function run_conc(x_b,A,k,width,height,gray,timeSteps,timeGap)
{
	var iterations=10;
	var phaseField=ctx.createImageData(width,height),color_scale=ctx.createImageData(width+1,1);
	canvas.width=width+12;canvas.height=height+85;
	conc= new2dArray(width+4,height+4);diff= new2dArray(width+4,height+4);
    f= new2dArray(width+4,height+4);constants= new2dArray(width+4,height+4);
	init_conc(width,height,x_b,phaseField,color_scale,gray);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Phasefield", 5+width/2, height+20);
	ctx.fillText(0, 6, height+75);
	ctx.fillText(0.5, 6+0.5*width, height+75);
	ctx.fillText(1, width+6,height+75);	
	setInterval(function(){update_conc(A,k,width,height,iterations,phaseField,gray,timeSteps)},timeGap);
	document.body.appendChild(canvas);
}
