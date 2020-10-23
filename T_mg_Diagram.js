var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

function T_mg(w,x){
		var R=8.3144598,T;	
		T=(w/R)*(2*x-1)/Math.log(x/(1-x));		
        return T;			
}

function T_sp(w,x){
		var R=8.3144598,T;	
		T=(2*w/R)*x*(1-x);		
        return T;			
}

function T_list(w,n){
    var R=8.3144598,i,dx=1/n,x=new Array(n+1),T_misc=new Array(n+1),T_spin=new Array(n+1);   
    T_misc[0]=T_misc[n]=T_spin[0]=T_spin[n]=0; 
    x[0]=0;
    x[n]=1;
    T_min=0;
  
    for(i=1;i<n/2;i++){
            x[i]=x[i-1]+dx;
            T_misc[n-i]=T_misc[i]=T_mg(w,x[i]);
			T_spin[n-i]=T_spin[i]=T_sp(w,x[i]);
			x[n-i]=1-x[i];
    }     
    T_max=T_misc[n/2]=T_spin[n/2]=w/(2*R);  
    return [x,T_misc,T_spin,T_max,T_min];    
}

function convert_to_y(T,start_y,scale_y,T_max){
 return start_y+Math.round((T_max-T)*scale_y);
}

function plot_axes(T_max,T_min,start_x,start_y,width,height,tick_T_distance,ticks_x,length_number,length_tick,font_size,axis_label_length,scale_y){
    var i,scale_y,tick_T_distance,y,T_tick;
    ctx.rect(start_x+length_number+length_tick+axis_label_length, start_y+font_size/2, width, height);
    ctx.font = "10px Arial";
	ctx.fillText("b", start_x+axis_label_length+length_number+length_tick+width/2+5, font_size/2+start_y+height+length_tick+2*length_number+5);	
	ctx.font = "16px Arial";      
	ctx.fillText("T(K)", start_x, start_y+(height+font_size)/2);
	ctx.textAlign = 'center';	
    ctx.fillText("x", start_x+axis_label_length+length_number+length_tick+width/2, font_size/2+start_y+height+length_tick+2*length_number);	
	ctx.stroke();
    for(T_tick=T_min;T_tick<=T_max;T_tick+=tick_T_distance){
		y=convert_to_y(T_tick,start_y,scale_y,T_max);
		ctx.beginPath();	
		ctx.setLineDash([]);	
		ctx.moveTo(start_x+axis_label_length+length_number+length_tick,y+font_size/2);
		ctx.lineTo(start_x+axis_label_length+length_number,y+font_size/2);
		ctx.fillText(T_tick, start_x+axis_label_length, y+font_size);
		ctx.stroke();
		ctx.beginPath();		
		ctx.setLineDash([1, 3]);
		ctx.moveTo(start_x+axis_label_length+length_number+length_tick,y+font_size/2);
		ctx.lineTo(start_x+axis_label_length+length_number+length_tick+width,y+font_size/2);
		ctx.stroke();
	}
    var tick_x_distance=width/ticks_x;
    for(i=0,cur_x=start_x+length_number+length_tick+axis_label_length;i<=ticks_x;i++,cur_x+=tick_x_distance){
		ctx.beginPath();	
		ctx.setLineDash([]);		
		ctx.moveTo(cur_x,font_size/2+start_y+height);
		ctx.lineTo(cur_x,font_size/2+start_y+height+length_tick);
		ctx.fillText(i/ticks_x, cur_x,font_size+start_y+height+2*length_tick);	
		ctx.stroke();		
		ctx.beginPath();		
		ctx.setLineDash([1, 3]);
		ctx.moveTo(cur_x,font_size/2+start_y+height);
		ctx.lineTo(cur_x,font_size/2+start_y);
		ctx.stroke();
	}       
}


function plot_T(x,T_misc,T_spin,T_max,T_min,n,start_x,start_y,width,height,tick_T_distance,ticks_x){
    var i,scale_y,tick_T_distance;
	var length_number=20,length_tick=10,font_size=15,axis_label_length=50;  
	T_max=tick_T_distance*Math.ceil(T_max/tick_T_distance);T_min=tick_T_distance*Math.floor(T_min/tick_T_distance);
    scale_y=height/(T_max-T_min);
	plot_axes(T_max,T_min,start_x,start_y,width,height,tick_T_distance,ticks_x,length_number,length_tick,font_size,axis_label_length,scale_y); 
	ctx.setLineDash([]);
	ctx.moveTo(start_x+length_number+length_tick+axis_label_length,font_size/2+start_y+height);   
	for(i=1;i<n;i++)
    	ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x[i]*width),font_size/2+convert_to_y(T_misc[i],start_y,scale_y,T_max));
    ctx.lineTo(start_x+axis_label_length+length_number+length_tick+width,font_size/2+start_y+height);
	
	ctx.moveTo(start_x+length_number+length_tick+axis_label_length,font_size/2+start_y+height);   
	for(i=1;i<n;i++)
    	ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x[i]*width),font_size/2+convert_to_y(T_spin[i],start_y,scale_y,T_max));
    ctx.lineTo(start_x+axis_label_length+length_number+length_tick+width,font_size/2+start_y+height);
    
	ctx.stroke();
}

function run(n,width,height,tick_T_distance,ticks_x)
{	
	var w = +document.getElementById("w").value;
	  canvas.width=width+85;
	  canvas.height=height+65;
	  var x,T_misc,T_spin,T_max,T_min;
	  [x,T_misc,T_spin,T_max,T_min] = T_list(w,n);	
	  var start_x=start_y=0;
      plot_T(x,T_misc,T_spin,T_max,T_min,n,start_x,start_y,width,height,tick_T_distance,ticks_x);
	  document.body.appendChild(canvas);
}
