var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

class Vector { 
	
	constructor(n){
        this.size=n;
        this.array=new Array(n);
	}

	multiply(B){		
        var i,A;
           A=new Vector(this.size);
           for(i=0;i<this.size;i++)
                       A.array[i]=this.array[i]*B;
                return A;
	}

	add(B){		
        var i,A;
        A=new Vector(this.size);
            for(i=0;i<this.size;i++)
                       A.array[i]=this.array[i]+B.array[i];
        return A;
	}

	subtract(B){
        var i,A;		
		A=new Vector(this.size);
            for(i=0;i<this.size;i++)
                       A.array[i]=this.array[i]-B.array[i];
        return A;
	}
	
};

function Regular_Solution_Decomposition(w,T){
	var R=8.3144598,x=0.5,x_max,x_min,f;
	T_c=Math.max(0,w/(2*R));
	if(T<T_c){
		x_max=0.5*(1-Math.sqrt(1-2*R*T/w));x_min=0;				
		while(x_max-x_min>=1E-9){
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

function GibbsEnergy(mu,x){
	return mu.array[0]*(1-x) + mu.array[1]*x; 
}

function GibbsEnergyDerivative(G_A,G_B,w,x,T,c){
	return chemical_potential(G_B,T,x,w,c) - chemical_potential(G_A,T,1-x,w,c); 
}

function T_iso(T_A,T_B,S_A,S_B,w_s,w_l,x_iso){
		var R=8.3144598,w=Math.max(w_s,w_l),T_mg,T,c_l,c_s;	
		T_mg=(w/R)*(2*x_iso-1)/Math.log(x_iso/(1-x_iso));		
		T=((1-x_iso)*T_A*S_A+x_iso*T_B*S_B+x_iso*(1-x_iso)*(w_l-w_s))/((1-x_iso)*S_A+x_iso*S_B);		
        if(T>T_mg) return T; 
		var T_max=T_mg,T_min=0,d=0,G_A,G_B;		
		var mu_l=new Vector(2),mu_s=new Vector(2);
		while(T_max-T_min>=1E-12){
			G_A=S_A*(T_A - T) ; G_B=S_B*(T_B - T);
			c_s=Regular_Solution_Decomposition(w_s,T);c_l=Regular_Solution_Decomposition(w_l,T);
			mu_l.array = [chemical_potential(G_A,T,1-x_iso,w_l,c_l) , chemical_potential(G_B,T,x_iso,w_l,c_l) ];
			mu_s.array = [chemical_potential(0,T,1-x_iso,w_s,c_s) , chemical_potential(0,T,x_iso,w_s,c_s) ];   			
			d = GibbsEnergy(mu_s,x_iso)-GibbsEnergy(mu_l,x_iso);
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

function Energy_minimisation(T_A,T_B,S_A,S_B,w_s,w_l,T,x_iso){
	var epsilon=1E-6,delta=0.01,d,x,factor,last,cur,y,G_A,G_B;
	var c_s=Regular_Solution_Decomposition(w_s,T),c_l=Regular_Solution_Decomposition(w_l,T);
	var delta_mu_a,delta_mu_b,slope_diff,flag=0;        
    G_A=S_A*(T_A-T);G_B=S_B*(T_B-T);
	slope_diff=GibbsEnergyDerivative(0,0,w_s,x_iso,T,c_s)-GibbsEnergyDerivative(G_A,G_B,w_l,x_iso,T,c_l);
	var x_s_min=0,x_l_min=0,x_l_max=1,x_s_max=1;	
	if(slope_diff>0) {x_s_max=x_l_min=x_iso;
		if(x_iso>c_s && x_iso<1-c_s) x_s_max=c_s;
		if(x_iso>c_l && x_iso<1-c_l) x_l_min=1-c_l;		
	    x_s=x_s_max-delta*Math.min(x_s_max,1-x_s_max);	
	    x_l=x_l_min+delta*Math.min(x_l_min,1-x_l_min);
	}
	else {x_s_min=x_l_max=x_iso;	
		  if(x_iso>c_s && x_iso<1-c_s) x_s_min=1-c_s;
		  if(x_iso>c_l && x_iso<1-c_l) x_l_max=c_l;		
		  x_s=x_s_min+delta*Math.min(x_s_min,1-x_s_min);
		  x_l=x_l_max-delta*Math.min(x_l_max,1-x_l_max);
	}  		  
			
	var d=new Vector(2),x=new Vector(2),diff=new Vector(2),y=new Vector(2),mu_l=new Vector(2),mu_s=new Vector(2),delta_mu;
    x.array=[x_l,x_s];
while(1){
		mu_l.array = [chemical_potential(G_A,T,1-x_l,w_l,c_l) , chemical_potential(G_B,T,x_l,w_l,c_l) ];
		mu_s.array = [chemical_potential(0,T,1-x_s,w_s,c_s) , chemical_potential(0,T,x_s,w_s,c_s) ];   			
		delta_mu = mu_s.subtract(mu_l);        
		cur=(GibbsEnergy(mu_l,x_l)*(x_iso-x_s) +  GibbsEnergy(mu_s,x_s)*(x_l-x_iso))/(x_l-x_s);
		diff.array=[
                        (delta_mu.array[0]*(1-x_s)+delta_mu.array[1]*x_s)*(x_iso-x_s)/((x_l-x_s)*(x_l-x_s)),
                        (delta_mu.array[0]*(1-x_l)+delta_mu.array[1]*x_l)*(x_l-x_iso)/((x_l-x_s)*(x_l-x_s))
                ] ;            
		factor=0.1;
		last=cur;y=x; 
		while(cur>=last){
			d=diff.multiply(factor);
			x=y.subtract(d);
			factor=factor/2;
            [x_l,x_s]=x.array; 
    	    if(x_l<x_l_min || x_l>x_l_max || x_s<x_s_min || x_s>x_s_max) continue;
			mu_l.array = [chemical_potential(G_A,T,1-x_l,w_l,c_l) , chemical_potential(G_B,T,x_l,w_l,c_l) ];
			mu_s.array = [chemical_potential(0,T,1-x_s,w_s,c_s) , chemical_potential(0,T,x_s,w_s,c_s) ];   				
			delta_mu = mu_s.subtract(mu_l);        
			cur=(GibbsEnergy(mu_l,x_l)*(x_iso-x_s) +  GibbsEnergy(mu_s,x_s)*(x_l-x_iso))/(x_l-x_s);  
	}
    if( Math.abs(d.array[0])<epsilon && Math.abs(d.array[1])<epsilon)  break;	       
}   
		if(x_s>c_s && x_s<1-c_s)
		{	if(x_s>0.5) x_s=1-c_s;
			else x_s=c_s;
		}
		if(x_l>c_l && x_l<1-c_l)
		{	if(x_l>0.5) x_l=1-c_l;
			else x_l=c_l;
		}
	
    return [x_l,x_s];
}

function T_mg(w,x){
		var R=8.3144598,T;	
		T=(w/R)*(2*x-1)/Math.log(x/(1-x));		
        return T;			
}

function phase_diagram(T_A,T_B,S_A,S_B,w_s,w_l,n){
    var R=8.3144598,i,j=0,k=0,dx=1/n,x_s=new Array(n+1),x_iso=new Array(n+1),x_l=new Array(n+1),T=new Array(n+1);
    var T_max,T_min,T_l,T_s,T_mgl=new Array(n+1),T_mgs=new Array(n+2),x_mgl=new Array(n+1),x_mgs=new Array(n+2);
    x_s[0]=x_l[0]=x_iso[0]=0;
    x_s[n]=x_l[n]=x_iso[n]=1; 
  
	[x_iso,T,T_max,T_min] = T_iso_list(T_A,T_B,S_A,S_B,w_s,w_l,n);
    
	for(i=1;i<n;i++)
		[x_l[i],x_s[i]]=Energy_minimisation(T_A,T_B,S_A,S_B,w_s,w_l,T[i],x_iso[i]);

	T_max=Math.max(T_max,w_l/(2*R));

	for(i=0;i<=n;i++)
		if(x_l[i]>0.5)
			break;
	T_l=(T[i]*(0.5-x_l[i-1])+T[i-1]*(x_l[i]-0.5))/(x_l[i]-x_l[i-1]);
	
	x_mgl[0] = Regular_Solution_Decomposition(w_l,T_l);
	if(x_mgl[0]<0.5) 
	{	dx=(1-2*x_mgl[0])/n;	
		T_mgl[0]=T_mgl[n]=T_l;
		x_mgl[n]=1-x_mgl[0];
		for(k=1;k<n/2;k++){
				x_mgl[k] = x_mgl[k-1] + dx;
				x_mgl[n-k]=1-x_mgl[k];
				T_mgl[k]=T_mgl[n-k]=T_mg(w_l,x_mgl[k]);  
		}
		x_mgl[n/2]=0.5;
		T_mgl[n/2]=w_l/(2*R);
		k=n+1;
	}

	for(i=0;i<=n;i++)
		if(x_s[i]>0.5)
			break;
	T_s=(T[i]*(0.5-x_s[i-1])+T[i-1]*(x_s[i]-0.5))/(x_s[i]-x_s[i-1]);
	
	T_min=Math.min(T_min,300);	

	x_mgs[n/2]=Regular_Solution_Decomposition(w_s,T_s);j=0;
	T_mgs[n/2]=T_mgs[n/2+1]=T_mg(w_s,x_mgs[n/2]);
	x_mgs[n/2+1]=1-x_mgs[n/2];
	x_mgs[0]=Regular_Solution_Decomposition(w_s,T_min);
	dx=2*(x_mgs[n/2]-x_mgs[0])/n;	
	T_mgs[0]=T_mgs[n+1]=T_min;
	x_mgs[n+1]=1-x_mgs[0];
	if(x_mgs[0]<0.5){
		for(j=1;j<n/2;j++){
				x_mgs[j]=x_mgs[j-1]+dx;
				x_mgs[n+1-j]=1-x_mgs[j];
				T_mgs[j]=T_mgs[n+1-j]=T_mg(w_s,x_mgs[j]);  
		}
		j=n+2;
	}

    return [x_l,x_s,T,T_max,T_min,T_mgl,T_mgs,x_mgl,x_mgs,k,j];    
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

function plot_phase_diagram(x_l,x_s,T,T_max,T_min,T_mgl,T_mgs,x_mgl,x_mgs,l,s,T_A,T_B,n,start_x,start_y,width,height,tick_T_distance,ticks_x){
    var i,scale_y,tick_T_distance;
	var length_number=20,length_tick=10,font_size=15,axis_label_length=50;   
	T_max=tick_T_distance*Math.ceil(T_max/tick_T_distance);T_min=tick_T_distance*Math.floor(T_min/tick_T_distance);    		
	scale_y=height/(T_max-T_min);
	plot_axes(T_max,T_min,start_x,start_y,width,height,tick_T_distance,ticks_x,length_number,length_tick,font_size,axis_label_length,scale_y); 
	ctx.beginPath();	
	ctx.setLineDash([]);
	ctx.moveTo(start_x+length_number+length_tick+axis_label_length,font_size/2+convert_to_y(T_A,start_y,scale_y,T_max));   
	for(i=1;i<n;i++)
    	ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x_l[i]*width),font_size/2+convert_to_y(T[i],start_y,scale_y,T_max));
    ctx.lineTo(start_x+axis_label_length+length_number+length_tick+width,font_size/2+convert_to_y(T_B,start_y,scale_y,T_max));
	
	ctx.fillStyle="rgba(0, 0, 255, 0.5)";
	for(i=n-1;i>=1;i--)
    	ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x_s[i]*width),font_size/2+convert_to_y(T[i],start_y,scale_y,T_max));
	ctx.lineTo(start_x+length_number+length_tick+axis_label_length,font_size/2+convert_to_y(T_A,start_y,scale_y,T_max));   
	ctx.rect(canvas.width-80,height/2,10,10);
	ctx.textAlign = 'start';		
	ctx.fillText("S+L", canvas.width-65, 10+height/2);
	ctx.stroke();
	ctx.fill();
	ctx.beginPath();
	ctx.fillStyle="rgba(255, 0, 0, 0.5)";		
	if(l){

		ctx.moveTo(start_x+axis_label_length+length_number+length_tick+Math.round(x_mgl[0]*width),font_size/2+convert_to_y(T_mgl[0],start_y,scale_y,T_max));   
		for(i=1;i<l;i++)
    		ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x_mgl[i]*width),font_size/2+convert_to_y(T_mgl[i],start_y,scale_y,T_max));
		ctx.rect(canvas.width-80,20,10,10);
		ctx.fillText("L1+L2", canvas.width-65, 30);
	}	
	ctx.stroke();	
	ctx.fill();
	ctx.beginPath();
	ctx.fillStyle="rgba(0, 255, 0, 0.5)";	
	if(s){
		ctx.moveTo(start_x+axis_label_length+length_number+length_tick+Math.round(x_mgs[0]*width),font_size/2+convert_to_y(T_mgs[0],start_y,scale_y,T_max));   
		for(i=1;i<s;i++)
    		ctx.lineTo(start_x+axis_label_length+length_number+length_tick+Math.round(x_mgs[i]*width),font_size/2+convert_to_y(T_mgs[i],start_y,scale_y,T_max));
		ctx.rect(canvas.width-80,height-10,10,10);
		ctx.fillText("S1+S2", canvas.width-65,height);
	}		
	ctx.stroke();	
	ctx.fill();
}

function run(n,width,height,tick_T_distance,ticks_x)
{
  var T_A = document.getElementById("T_A").value, T_B = document.getElementById("T_B").value,S_A = document.getElementById("S_A").value,S_B = document.getElementById("S_B").value,
	w_s = 1000*document.getElementById("w_s").value,w_l = 1000*document.getElementById("w_l").value;
	canvas.width=width+170;
	canvas.height=height+100;
    var x_l,x_s,T,T_max,T_min,T_mgl,T_mgs,l,s,x_mgl,x_mgs;
	[x_l,x_s,T,T_max,T_min,T_mgl,T_mgs,x_mgl,x_mgs,l,s]=phase_diagram(T_A,T_B,S_A,S_B,w_s,w_l,n);
	var start_x=start_y=0;
    plot_phase_diagram(x_l,x_s,T,T_max,T_min,T_mgl,T_mgs,x_mgl,x_mgs,l,s,T_A,T_B,n,start_x,start_y,width,height,tick_T_distance,ticks_x);	
	document.body.appendChild(canvas);
}
