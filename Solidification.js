var canvas = document.createElement('canvas');
var ctx=canvas.getContext("2d");

// Create 2D array
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

var p,T,e,e_prime,diff_p,diff_T,diff,coeff_x,coeff_y,factor_x,factor_y;

function set_color(Field,value,gray,pos){
	var red,green,blue;
	if(gray==0)
	{
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
	}
	else 
	{	
		red=value*255;
		red=green=blue=Math.round(Math.min(Math.max(0,red),255));
	}
	Field.data[pos]=red;Field.data[pos+1]=green;Field.data[pos+2]=blue;
}

function fill_rect(phaseField,Temperature,size_x,size_y,gray)
{
	var x,y,pos=0;
	for(y=1;y<=size_y;y++)
		for(x=1;x<=size_x;x++,pos+=4)
	{ set_color(phaseField,p[x][y],gray,pos);set_color(Temperature,T[x][y],gray,pos);}
	ctx.putImageData(phaseField,5,0);ctx.putImageData(Temperature,size_x+10,0);		
}

function fill_matrix(c,s,size_x,size_y,epsilon_bar,delta,j,theta_0)
{
	var i,x,y,g,gx,gy,cosTheta_0=Math.cos(theta_0),sinTheta_0=Math.sin(theta_0);
	c[0]=1;s[0]=0;
	for(x=1;x<=size_x;x++)
		for(y=1;y<=size_y;y++)
	{
	gx=0.5*(p[x+1][y]-p[x-1][y]);gy=0.5*(p[x][y+1]-p[x][y-1]);
	g=Math.sqrt(gx*gx+gy*gy);
	if(g==0) {e[x][y]=epsilon_bar;e_prime[x][y]=0;continue;}
	c[1]=-gx/g;s[1]=-gy/g;
	c[1]=c[1]*cosTheta_0+s[1]*sinTheta_0;
	s[1]=s[1]*cosTheta_0-c[1]*sinTheta_0;
	for(i=2;i<=j;i++)
		c[i]=2*c[1]*c[i-1]-c[i-2];
	for(i=2;i<=j;i++)
		s[i]=2*c[1]*s[i-1]-s[i-2];
	e[x][y]=epsilon_bar*(1+delta*c[j]);e_prime[x][y]=-epsilon_bar*delta*j*s[j];	
	}			
}

function coeff_implicit(dt,dx,size_x,size_y,temp_boundary)
{
	var i,mul=0.5*dt/(dx*dx);
	if(temp_boundary==0) factor_x[1]=factor_y[1]=mul+1;
	else if(temp_boundary==1) factor_x[1]=factor_y[1]=2*mul+1;
	else if(temp_boundary==2) {factor_x[1]=2*mul+1;factor_y[1]=1+mul;}
	coeff_x[1]=-mul/factor_x[1];coeff_y[1]=-mul/factor_y[1];
	for(i=2;i<size_x;i++)
		{
			factor_x[i]=1+2*mul+mul*coeff_x[i-1];	
			coeff_x[i]=-mul/factor_x[i];
		}
	if(temp_boundary==0 || temp_boundary==2) factor_x[size_x]=1+mul+mul*coeff_x[size_x-1];
	else factor_x[size_x]=1+2*mul+mul*coeff_x[size_x-1];
	coeff_x[size_x]=0;
	for(i=2;i<size_y;i++)
		{
			factor_y[i]=1+2*mul+mul*coeff_y[i-1];	
			coeff_y[i]=-mul/factor_y[i];	
		}
	if(temp_boundary==0 || temp_boundary==2) factor_y[size_y]=1+mul+mul*coeff_y[size_y-1];
	else factor_y[size_y]=1+2*mul+mul*coeff_y[size_y-1]; 
	coeff_y[size_y]=0;
}

function boundary_p(size_x,size_y){
	var i;
	for(i=1;i<=size_x;i++) {p[i][0]=p[i][1];p[i][size_y+1]=p[i][size_y];}
	for(i=1;i<=size_y;i++) {p[0][i]=p[1][i];p[size_x+1][i]=p[size_x][i];}
}

function boundary_T(size_x,size_y,temp_boundary){
	var i;
	if(temp_boundary==0) {
	for(i=1;i<=size_x;i++) {T[i][0]=T[i][1];T[i][size_y+1]=T[i][size_y];}
	for(i=1;i<=size_y;i++) {T[0][i]=T[1][i];T[size_x+1][i]=T[size_x][i];}
	}
	else if(temp_boundary==1){
	for(i=1;i<=size_x;i++) T[i][0]=T[i][size_y+1]=0;
	for(i=1;i<=size_y;i++) T[0][i]=T[size_x+1][i]=0;
	}
	else if(temp_boundary==2) {
	for(i=1;i<=size_y;i++) T[0][i]=0;
	for(i=1;i<=size_x;i++) {T[i][0]=T[i][1];T[i][size_y+1]=T[i][size_y];}
	for(i=1;i<=size_y;i++) T[size_x+1][i]=T[size_x][i];
	}
}

function lod_implicit_x(K,dt,dx,length,row,temp_boundary){
var i,mul=0.5*dt/(dx*dx); 
for(i=1;i<=length;i++)
	diff[i]=mul*(T[i-1][row]-2*T[i][row]+T[i+1][row])+0.5*K*diff_p[i][row];
for(i=1;i<=length;i++)
	T[i][row]=T[i][row]+diff[i];
if(temp_boundary==1) {T[length][row]+=mul*T[length+1][row];T[1][row]+=mul*T[0][row];}		
else if(temp_boundary==2) T[1][row]+=mul*T[0][row]; 		
T[1][row]=T[1][row]/factor_x[1];
for(i=2;i<=length;i++)
	T[i][row]=(T[i][row]+mul*T[i-1][row])/factor_x[i];
for(i=length-1;i>0;i--)
	T[i][row]=T[i][row]-coeff_x[i]*T[i+1][row];
}

function lod_implicit_y(K,dt,dx,length,row,temp_boundary){
var i,mul=0.5*dt/(dx*dx);
for(i=1;i<=length;i++)
	diff[i]=mul*(T[row][i-1]-2*T[row][i]+T[row][i+1])+0.5*K*diff_p[row][i];
for(i=1;i<=length;i++)
	T[row][i]=T[row][i]+diff[i];
if(temp_boundary==1) {T[row][length]+=mul*T[row][length+1];T[row][1]+=mul*T[row][0];}	
T[row][1]=T[row][1]/factor_y[1];
for(i=2;i<=length;i++)
	T[row][i]=(T[row][i]+mul*T[row][i-1])/factor_y[i];
for(i=length-1;i>0;i--)
	T[row][i]=T[row][i]-coeff_y[i]*T[row][i+1];
}

function update_T_lod_implicit(size_x,size_y,K,dt,dx,temp_boundary){
	var i;
	for (i=1;i<=size_y;i++) lod_implicit_x(K,dt,dx,size_x,i,temp_boundary);
	boundary_T(size_x,size_y,temp_boundary);
	for (i=1;i<=size_x;i++) lod_implicit_y(K,dt,dx,size_y,i,temp_boundary);	
}

function update_temp(K,dt,dx,temp_boundary,size_x,size_y,iterations)
{
	var x,y,k,mul=0.5*dt/(dx*dx),factor;factor=1/(1+4*mul);
	boundary_T(size_x,size_y,temp_boundary);
	for(x=1;x<=size_x;x++)
		for(y=1;y<=size_y;y++)
			diff_T[x][y]=mul*(T[x+1][y]+T[x-1][y]+T[x][y+1]+T[x][y-1]-4*T[x][y])+K*diff_p[x][y]+T[x][y];
	update_T_lod_implicit(size_x,size_y,K,dt,dx,temp_boundary);
	for(k=0;k<iterations;k++){
	boundary_T(size_x,size_y,temp_boundary);
		for(x=1;x<=size_x;x++)
			for(y=1;y<=size_y;y++)
				T[x][y]=factor*(mul*(T[x][y+1]+T[x][y-1]+T[x+1][y]+T[x-1][y])+diff_T[x][y]);
	}						
}

function update_p(c,s,dt,dx,size_x,size_y,tau,epsilon_bar,gamma,alpha,T_e,a,delta,j,theta_0)
{
	var x,y,laplace,ep,eprime,gx_eprime,gx_ep,gy_eprime,gy_ep,phase,noise,gx,gy;
	var mul=new Array(3);
	mul[0]=dt/tau;mul[1]=1/(dx*dx);mul[2]=alpha/Math.PI;
	boundary_p(size_x,size_y);
	fill_matrix(c,s,size_x,size_y,epsilon_bar,delta,j,theta_0);
	for(x=1;x<=size_x;x++)
		for(y=1;y<=size_y;y++)
	{
		phase=p[x][y];ep=e[x][y];eprime=e_prime[x][y];m=mul[2]*Math.atan(gamma*(T_e-T[x][y]));
		gx_ep=0.5*(e[x+1][y]-e[x-1][y]);gx_eprime=0.5*(e_prime[x+1][y]-e_prime[x-1][y]);
		gy_ep=0.5*(e[x][y+1]-e[x][y-1]);gy_eprime=0.5*(e_prime[x][y+1]-e_prime[x][y-1]);
		gx=0.5*(p[x+1][y]-p[x-1][y]);gy=0.5*(p[x][y+1]-p[x][y-1]);
		noise=a*(Math.random()-0.5);
		laplace=p[x+1][y]+p[x-1][y]+p[x][y+1]+p[x][y-1]-4*phase;
		diff_p[x][y]=ep*ep*laplace+ep*(2*gx*gx_ep+gy*gy_ep+gx*gy_eprime-gy*gx_eprime)+eprime*(gx*gy_ep-gy*gx_ep);
		diff_p[x][y]=mul[0]*(mul[1]*diff_p[x][y]+phase*(1-phase)*(phase-0.5+m+noise));
	}
	for(x=1;x<=size_x;x++)
		for(y=1;y<=size_y;y++)
			p[x][y]=p[x][y]+diff_p[x][y];				
}

function init(phase_profile,initial_temp,phaseField,Temperature,color_scale,size_x,size_y,gray)
{
	var x,y,r=1,pos=0;
	
	for(x=0,pos=0;x<=1;x+=0.5/size_x,pos+=4){
		set_color(color_scale,x,gray,pos);
		color_scale.data[pos+3]=255;
	}

	for(x=0;x<20;x++)
		ctx.putImageData(color_scale,4,x+size_y+35);	

	for(x=1;x<=size_x;x++)
		for(y=1;y<=size_y;y++,pos+=4)
			{p[x][y]=0;T[x][y]=initial_temp;phaseField.data[pos+3]=Temperature.data[pos+3]=255;}	
	
	switch(phase_profile)
	{
	case 'center': // Nucleus at center
	     	for(x=-r;x<=r;x++)
		   for(y=-r;y<=r;y++)
			if(x*x+y*y<=r) {p[x+size_x/2][size_y/2+y]=1;T[x+size_x/2][size_y/2+y]=1;}
	 	break;						
	case 'bottom':// Nucleus at bottom center	
		for(x=-r;x<=r;x++)
			{p[x+size_x/2][size_y]=T[x+size_x/2][size_y]=1;}
		break;
	case 'left': // Nucleus at left wall
		for(x=1;x<=r;x++)
			for(y=1;y<=size_y;y++)
				{p[x][y]=T[x][y]=1;}
		break;							
	case 'boundary': //Nucleus in boundary
		for(y=1;y<=size_y;y++)	{p[1][y]=p[size_x][y]=1;T[1][y]=T[size_x][y]=1;}					 		
		for(x=1;x<=size_x;x++)  {p[x][1]=p[x][size_y]=1;T[x][1]=T[x][size_y]=1;}
		break;
	case 'deformed': //Initial deformed interface
		pos=size_x/20;r=size_x/25;var period=size_y/5;	
		for(y=1;y<=size_y;y++)
			for(x=1;x<=pos+r*Math.cos((2*Math.PI*y)/period);x++)
				{p[x][y]=1;T[x][y]=1;}
	}
	fill_rect(phaseField,Temperature,size_x,size_y,gray);
}

function solidify(phaseField,Temperature,dt,dx,size_x,size_y,tau,epsilon_bar,gamma,alpha,T_e,a,delta,j,theta_0,K,temp_boundary,iterations,timeSteps,gray)
{
	var i,t;var s=new Array(j+1);var c=new Array(j+1);
	for(i=1;i<=size_x;i++) {e[i][size_y+1]=e[i][0]=epsilon_bar;e_prime[i][size_y+1]=e_prime[i][0]=0;}
	for(i=1;i<=size_y;i++) {e[size_x+1][i]=e[0][i]=epsilon_bar;e_prime[size_x+1][i]=e_prime[0][i]=0;}
	for(t=0;t<timeSteps;t++){
	update_p(c,s,dt,dx,size_x,size_y,tau,epsilon_bar,gamma,alpha,T_e,a,delta,j,theta_0);
	update_temp(K,dt,dx,temp_boundary,size_x,size_y,iterations);
	}
	fill_rect(phaseField,Temperature,size_x,size_y,gray);
}

function run(size_x,size_y,theta_0,initial_temp,timeSteps,timeGap,gray)
{	
	var initial_temp = +document.getElementById("T_i").value,delta= +document.getElementById("delta").value,j= +document.getElementById("j").value,temp_boundary = +document.getElementById("T_b").value,K = +document.getElementById("K").value,phase_profile = document.getElementById("phase_profile").value;
	var dt=0.0002,dx=0.03,tau=0.0003,epsilon_bar=0.01,gamma=10,alpha=0.9,a=0.01,T_e=1,iterations=5;
	var phaseField= ctx.createImageData(size_x,size_y);
	var Temperature= ctx.createImageData(size_x,size_y),color_scale=ctx.createImageData(2*size_x+1,1);
    p= new2dArray(size_x+2,size_y+2); T= new2dArray(size_x+2,size_y+2);
    e= new2dArray(size_x+2,size_y+2);e_prime= new2dArray(size_x+2,size_y+2);
    diff_p=new2dArray(size_x+2,size_y+2); diff_T=new2dArray(size_x+2,size_y+2);
    diff=new Array(Math.max(size_x,size_y)+2);
    coeff_x=new Array(size_x+2);coeff_y=new Array(size_y+2);
    factor_x=new Array(size_x+2);factor_y=new Array(size_y+2);
    canvas.width=2*size_x+15;canvas.height=size_y+85;
	init(phase_profile,initial_temp,phaseField,Temperature,color_scale,size_x,size_y,gray);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Phasefield", size_x/2, size_y+20);
	ctx.fillText("Temperature", 1.5*size_x+5, size_y+20);
	ctx.fillText(0, 5, size_y+75);
	ctx.fillText(0.5, 5+size_x, size_y+75);
	ctx.fillText(1, 2*size_x+5,size_y+75);	
	coeff_implicit(dt,dx,size_x,size_y,temp_boundary);
	setInterval(function(){solidify(phaseField,Temperature,dt,dx,size_x,size_y,tau,epsilon_bar,gamma,alpha,T_e,a,delta,j,theta_0,K,temp_boundary,iterations,timeSteps,gray);},timeGap);
	document.body.appendChild(canvas);
}
