// Evolution of temperature profile over time 
var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");
var T,coeff,factor,diff;

// Converts Temperature into color with T_max as red and T_min as blue
function set_color(T_Field,pos,Temp,T_max,T_min){
	var red,green,blue;	
	var part=(T_max-T_min)/4;
	var parts=Math.floor((T_max-Temp)/part);
	switch(parts)
	{
	case 0:
		red=255;blue=0;
		green = ((T_max-Temp)/part)*255;
		break;
	case 1:  
		green=255;blue=0;
		red= ((Temp-(T_max-2*part))/part)*255;
		break;
	case 2:  
		red=0;green=255;
		blue = (((T_max-2*part)-Temp)/part)*255;
		break;	
	case 3: 
		red=0;blue=255;
		green =((Temp-T_min)/part)*255;
		break;
	default : if(parts<0) {red=255;green=blue=0;} 
			  if(parts>0) {red=green=0;blue=255;} 		
	}
	T_Field.data[pos]=Math.round(red);T_Field.data[pos+1]=Math.round(green);T_Field.data[pos+2]=Math.round(blue);
}

// Colors the bar according to the color corresponding to Temperature
function fill_rect(T_Field,T_max,T_min,length,height)
{
	var i,pos;
	for(i=0,pos=0;i<=length+1;i++,pos+=4)
		set_color(T_Field,pos,T[i],T_max,T_min);
	for(i=0;i<height;i++)
		ctx.putImageData(T_Field,15,i);	
}

// Sets up the initial temperature profile
function init_temp(T_Field,T_left,T_bar,T_right,T_max,T_min,color_scale,length,height){
var i;

for(i=0,pos=0;i<=1;i+=1/length,pos+=4){
		set_color(color_scale,pos,i,1,0);
		color_scale.data[pos+3]=255;
	}

for(i=0;i<20;i++)
	ctx.putImageData(color_scale,15,i+height+60);	

for(i=0,pos=0;i<=length+1;i++,pos+=4) T_Field.data[pos+3]=255;
T[0]=T_left;T[length+1]=T_right;
for(i=1;i<=length;i++)
	T[i]=T_bar;
fill_rect(T_Field,T_max,T_min,length,height);
}

//Create coefficient array for Implicit Method
function create_coeff_implicit(length){
	var i,mul=0.5;
	coeff[0]=0;factor[0]=1;
	for(i=1;i<length;i++)
		{
			factor[i]=1+2*mul+mul*coeff[i-1];	
			coeff[i]=-mul/factor[i];
		}
	factor[length]=1+2*mul+mul*coeff[length-1];coeff[length]=0;				
}

// Implicit Method
function update_temp_implicit(T_Field,length,T_max,T_min,height,timeSteps){
var i,t,mul=0.5;
for(t=0;t<timeSteps;t++){
for(i=1;i<=length;i++)
	diff[i]=mul*(T[i-1]-2*T[i]+T[i+1]);
diff[length]+=mul*T[length+1];
for(i=1;i<=length;i++)
	T[i]=T[i]+diff[i];	
for(i=1;i<=length;i++)
	T[i]=(T[i]+mul*T[i-1])/factor[i];
for(i=length-1;i>0;i--)
	T[i]=T[i]-coeff[i]*T[i+1];
}	
fill_rect(T_Field,T_max,T_min,length,height);		
}

// Runs Animation
function run_temp(length,height,timeSteps,timeGap)
{
	var T_min,T_max,T_left,T_bar,T_right;
	T_left = +document.getElementById('T_l').value; T_bar = +document.getElementById('T_b').value; T_right = +document.getElementById('T_r').value;	
	T_min=Math.min(T_left,T_bar,T_right);T_max=Math.max(T_left,T_bar,T_right);
	var T_Field=ctx.createImageData(length+2,1),color_scale=ctx.createImageData(length+1,1);
    canvas.width=length+50;canvas.height=height+150;
	T= new Array(length+2);
	coeff= new Array(length+2);factor=new Array(length+2);
	diff=new Array(length+2);
	init_temp(T_Field,T_left,T_bar,T_right,T_max,T_min,color_scale,length,height);
	create_coeff_implicit(length);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Temperature in bar", 5+length/2, height+20);
	ctx.fillText("Temperature Scale", 5+length/2, height+130);
	ctx.fillText(T_min, 15, height+100);
	ctx.fillText(0.5*(T_min+T_max), 6+0.5*length, height+100);
	ctx.fillText(T_max, length+15,height+100);
	setInterval(function(){update_temp_implicit(T_Field,length,T_max,T_min,height,timeSteps)},timeGap);
	document.body.appendChild(canvas);
}
