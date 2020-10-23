// Evolution of Concentration profile over time
var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");

var conc,constants,f,solution,y;

// Solves linear pentadiagnol systems
function solve_pentadiagnol(coefficient,y,n){
	var i,a,b,c,d,e,mu,gamma;	
	a=coefficient[3];b=coefficient[4];c=coefficient[1];d=coefficient[2];e=coefficient[0];	
	var alpha= new Array(length);
	var beta= new Array(length);
	var x= new Array(length);
	alpha[0]=a/d;beta[0]=b/d;x[0]=y[0]/d;
	gamma=c;mu=d-alpha[0]*gamma;alpha[1]=(a-beta[0]*gamma)/mu;beta[1]=b/mu;x[1]=(y[1]-x[0]*gamma)/mu;
	for(i=2;i<(n-2);i++){
		gamma=c-alpha[i-2]*e;
		mu=d-beta[i-2]*e-alpha[i-1]*gamma;
		alpha[i]=(a-beta[i-1]*gamma)/mu;
		beta[i]=b/mu;
		x[i]=(y[i]-x[i-2]*e-x[i-1]*gamma)/mu;
	}
	gamma=c-alpha[n-4]*e;
	mu=d-beta[n-4]*e-alpha[n-3]*gamma;
	alpha[n-2]=(a-beta[n-3]*gamma)/mu;
	x[n-2]=(y[n-2]-x[n-4]*e-x[n-3]*gamma)/mu;
	gamma=c-alpha[n-3]*e;
	mu=d-beta[n-3]*e-alpha[n-2]*gamma;
	x[n-1]=(y[n-1]-x[n-3]*e-x[n-2]*gamma)/mu;
	x[n-2]=x[n-2]-alpha[n-2]*x[n-1];
	for(i=n-3;i>=0;i--)
		x[i]=x[i]-alpha[i]*x[i+1]-beta[i]*x[i+2];
	return x;
}

// Converts concentration into color with c_max as red and c_min as blue (c_max as black and c_min as white)
function set_color(phaseField,pos,conc,c_max,c_min,gray){
	var red,green,blue;
	if(gray==0)
	{
	var part=(c_max-c_min)/4;
	var parts=Math.floor((c_max-conc)/part);
	switch(parts)
	{
	case 0:
		red=255;blue=0;
		green = ((c_max-conc)/part)*255;
		break;
	case 1:  
		green=255;blue=0;
		red= ((conc-(c_max-2*part))/part)*255;
		break;
	case 2:  
		red=0;green=255;
		blue = (((c_max-2*part)-conc)/part)*255;
		break;	
	case 3: 
		red=0;blue=255;
		green =((conc-c_min)/part)*255;
		break;
	default : if(parts<0) {red=255;green=blue=0;} 
			  if(parts>0) {red=green=0;blue=255;} 	
	}
	}
	else 
	{	
		red=(c_max-conc)*255/(c_max-c_min);
		red=green=blue=Math.min(Math.max(0,red),255);
	}	
	phaseField.data[pos]=Math.round(red);phaseField.data[pos+1]=Math.round(green);phaseField.data[pos+2]=Math.round(blue);
}

// Colors the bar according to the color corresponding to concentration
function fill_rect(phaseField,length,height,c_max,c_min,gray)
{
    var i;
    for(i=2,pos=0;i<=length+1;i++,pos+=4)
	    set_color(phaseField,pos,conc[i],c_max,c_min,gray);
    for(i=0;i<height;i++)    
            ctx.putImageData(phaseField,6,i);	
}

function periodic_boundary(length)
{
	conc[0]=conc[length];conc[length+2]=conc[2];
	conc[1]=conc[length+1];conc[length+3]=conc[3];
	f[1]=f[length+1];f[length+2]=f[2];
}

// Sets up the initial concentration profile
function init_conc(phaseField,color_scale,length,height,gray){
var i,pos;

for(i=0,pos=0;i<=1;i+=1/length,pos+=4){
		set_color(color_scale,pos,i,1,0,gray);
		color_scale.data[pos+3]=255;
	}

for(i=0;i<20;i++)
	ctx.putImageData(color_scale,6,i+height+35);	

for(i=2,pos=0;i<=length+1;i++,pos+=4) phaseField.data[pos+3]=255;
for(i=2;i<=length+1;i++)
	conc[i]=i<length/4 || i>=(3*length)/4;
fill_rect(phaseField,length,height,1,0,gray);
}

// Updates Concentration by solving pentadiagnol linear system
function update_conc_pentadiagnol(coefficient,length,r){
	var i,r;	
	y[0]=y[0]+4*r*conc[1]-r*conc[0];
	y[1]=y[1]-r*conc[1];
	y[length-1]=y[length-1]+4*r*conc[length+2]-r*conc[length+3];
	y[length-2]=y[length-2]-r*conc[length+2];	
	solution=solve_pentadiagnol(coefficient,y,length);	 		
	for (i=0;i<length;i++) 
		conc[i+2]=solution[i];		 	 
}

// Updates Concentration	
function update_conc(phaseField,length,height,A,k,iterations,gray,timeSteps){
	var i,j,t,mul=0.1,r,f_laplace;r=k*mul;
	var coefficient=[r,-4*r,1+6*r,-4*r,r];
	for (t=0;t<timeSteps;t++){
	for (i=2;i<=length+1;i++)
		f[i]=2*A*conc[i]*(conc[i]-1)*(2*conc[i]-1);	
	periodic_boundary(length);
	for (i=2;i<=length+1;i++){	
				j=k*(conc[i+2]-4*conc[i+1]+6*conc[i]-4*conc[i-1]+conc[i-2]);
				f_laplace=f[i+1]-2*f[i]+f[i-1];y[i-2]=constants[i]=mul*(f_laplace-j)+conc[i];
	}
	update_conc_pentadiagnol(coefficient,length,r);
	for(j=0;j<iterations;j++){
		periodic_boundary(length);	 			
		for(i=2;i<=length+1;i++)
			conc[i]=(constants[i]-r*(conc[i+2]-4*conc[i+1]-4*conc[i-1]+conc[i-2]))/(1+6*r);
	}
} 	 	
	fill_rect(phaseField,length,height,1,0,gray);	
}

// Runs Animation
function run_conc(length,height,A,k,gray,timeSteps,timeGap)
{	
	var iterations=10;
	var phaseField=ctx.createImageData(length,1),color_scale=ctx.createImageData(length+1,1);
	canvas.width=length+12;canvas.height=height+85;
	conc= new Array(length+4);
	constants= new Array(length+4);
	f=new Array(length+4);
	solution=new Array(length);
	y=new Array(length);	
	init_conc(phaseField,color_scale,length,height,gray);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Phasefield", 5+length/2, height+20);
	ctx.fillText(0, 6, height+75);
	ctx.fillText(0.5, 6+0.5*length, height+75);
	ctx.fillText(1, length+6,height+75);	
	setInterval(function(){update_conc(phaseField,length,height,A,k,iterations,gray,timeSteps)},timeGap);
	document.body.appendChild(canvas);
}
