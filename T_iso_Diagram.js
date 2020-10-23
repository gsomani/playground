var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

function Regular_Solution_Decomposition(w,T){
	var R=8.3144598,x=0.5,x_max,x_min,f;
	T_c=Math.max(0,w/(2*R));
	if(T<T_c){
		x_max=0.5*(1-Math.sqrt(1-2*R*T/w));x_min=0;				
		while(x_max-x_min>=1E-5){
            x=(x_max+x_min)/2;
            f = 2*T_c*(2*x-1)/Math.log(x/(1-x));
            if(f>T) x_max=x; else x_min=x;
        }
    }
    return x;
}

function chemical_potential(G,T,x,w,c){
var R=8.3144598;
if(x>c && x<(1-c)) x=c;
return G+R*T*Math.log(x)+w*(1-x)*(1-x);
}

function GibbsEnergy(G_A,G_B,w,x,T,c){
	return chemical_potential(G_A,T,1-x,w,c)*(1-x) + chemical_potential(G_B,T,x,w,c)*x; 
}

function T_iso(T_A,T_B,S_A,S_B,w_s,w_l,x_iso){
		var R=8.3144598,w=Math.max(w_s,w_l),T_mg,T,c_l,c_s;	
		T_mg=(w/R)*(2*x_iso-1)/Math.log(x_iso/(1-x_iso));		
		T=((1-x_iso)*T_A*S_A+x_iso*T_B*S_B+x_iso*(1-x_iso)*(w_l-w_s))/((1-x_iso)*S_A+x_iso*S_B);		
        if(T>T_mg) return T; 
		var T_max=T_mg,T_min=0,d=0,G_A,G_B;		
		while(T_max-T_min>=1E-12){
			G_A=S_A*(T_A - T) ; G_B=S_B*(T_B - T);
			c_s=Regular_Solution_Decomposition(w_s,T);c_l=Regular_Solution_Decomposition(w_l,T); 			
			d = GibbsEnergy(0,0,w_s,x_iso,T,c_s)-GibbsEnergy(G_A,G_B,w_l,x_iso,T,c_l);
			if(d>0) T_max=T; else T_min=T;
			T=0.5*(T_max+T_min);
		}
        return T;			
}

function T_iso_list(T_A,T_B,S_A,S_B,w_s,w_l,n){
    var R=8.3144598,i,dx=1/n,x=new Array(n+1),T=new Array(n+1);   
    T[0]=T_A;T[n]=T_B; 
    x[0]=0;
    x[n]=1;
    T_max=Math.max(T_A,T_B);
    T_min=Math.min(T_A,T_B);
  
    for(i=1;i<n;i++){
            x[i]=x[i-1]+dx;
            T[i]=T_iso(T_A,T_B,S_A,S_B,w_s,w_l,x[i]);
	    T_max=Math.max(T[i],T_max);
	    T_min=Math.min(T[i],T_min);	
    }     
      
    return [x,T,T_max,T_min];    
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


function plot_T_iso(x,T,T_max,T_min,T_A,T_B,n,start_x,start_y,width,height,tick_T_distance,ticks_x){
    var i,scale_y,tick_T_distance;
	var length_number=20,length_tick=10,font_size=15,axis_label_length=50;    
	T_max=tick_T_distance*Math.ceil(T_max/tick_T_distance);T_min=tick_T_distance*Math.floor(T_min/tick_T_distance);
    scale_y=height/(T_max-T_min);
	plot_axes(T_max,T_min,start_x,start_y,width,height,tick_T_distance,ticks_x,length_number,length_tick,font_size,axis_label_length,scale_y); 
	ctx.setLineDash([]);
	ctx.moveTo(start_x+length_number+length_tick+axis_label_length,font_size/2+convert_to_y(T_A,start_y,scale_y,T_max));   
	for(i=1;i<n;i++)
    	ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x[i]*width),font_size/2+convert_to_y(T[i],start_y,scale_y,T_max));
    ctx.lineTo(start_x+axis_label_length+length_number+length_tick+width,font_size/2+convert_to_y(T_B,start_y,scale_y,T_max));
    
	ctx.stroke();
}

function run(n,width,height,tick_T_distance,ticks_x)
{
	 var T_A = +document.getElementById("T_A").value, T_B = +document.getElementById("T_B").value,S_A = +document.getElementById("S_A").value,S_B = +document.getElementById("S_B").value,
	  w_s = +document.getElementById("w_s").value,w_l = +document.getElementById("w_l").value;	
	  canvas.width=width+85;
	  canvas.height=height+65;
	  var x,T,T_max,T_min;
	  [x,T,T_max,T_min] = T_iso_list(T_A,T_B,S_A,S_B,w_s,w_l,n);	
	  var start_x=start_y=0;
      plot_T_iso(x,T,T_max,T_min,T_A,T_B,n,start_x,start_y,width,height,tick_T_distance,ticks_x);
	 document.body.appendChild(canvas);
}
