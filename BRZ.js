var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");

// Create 2D array
function new2dArray(rows,columns)
{ var i,j,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

var f,cur,d,done,timer;

function set_color(zone,field,pos,max_zone){
	var red,green,blue,color;
    color=zone%6;	
    switch(color)
	{
	case 0:red=255;blue=0;green=0;
		    break;
	case 1:  green=128;blue=0;red=127;
		    break;
	case 2:  red=0;green=255;blue=0;
		    break;	
    case 3:red=0;blue=128;green=127;
		    break;
	case 4:  green=0;blue=255;red=0;
		    break;
	case 5:  red=128;green=0;blue=127;
		    break;	
	}
	field.data[pos]=red;field.data[pos+1]=green;field.data[pos+2]=blue;
    if(zone>max_zone && done==1)  field.data[pos+3]=0; else field.data[pos+3]=255; 
}

// Colors the plane according to the color corresponding to Brillouin Zone
function fill_rect(width,height,field)
{
	var i,j,pos=0,max_zone=f[0][0];
    if(done==1){
    for(i=0;i<=height+1;i++)
	    max_zone=Math.min(max_zone,Math.min(f[0][i],f[width+1][i]));
    for(i=0;i<=width+1;i++)
	    max_zone=Math.min(max_zone,Math.min(f[i][0],f[i][height+1]));
    max_zone--;
    }    
    for(j=1;j<=height;j++)
		for(i=1;i<=width;i++,pos+=4)
			set_color(f[i][j],field,pos,max_zone);
	ctx.putImageData(field,0,0);		
}

function init(width,height,field){
var i,j,pos=0;
for(j=1;j<=height;j++)
	for(i=1;i<=width;i++,pos+=4)
		field.data[pos+3]=255;
for(j=0;j<=height+1;j++)
	for(i=0;i<=width+1;i++)
		f[i][j]=0;
fill_rect(width,height,field);		
}

function transform(scale,size){
    var i;
    for(i=0;i<=size+1;i++)
         cur[i]=(i-0.5*(size+1))/scale;
}

function update(size,alpha,beta,x,y,d,scale,field){
    var z;    
    for(i=0;i<=size+1;i++)
        for(j=0;j<=size+1;j++)
        {   
          z = 2*alpha*cur[i]*x + 2*beta*cur[j]*y;
          if(z>d) f[i][j]++;   
        }
}


function update_d(size,lattice,alpha,beta,a,b,d,scale,field){
var x,y;
    for(y=0;b*y*y<=d;y++)   
    { x=Math.round(Math.sqrt((d-b*y*y)/a));
     if(lattice=="hexagonal")
            if((x+y)%2==1)
                continue;  
            if(a*x*x + b*y*y == d)
            {
                update(size,alpha,beta,x,y,d,scale,field);
                if(y) update(size,alpha,beta,x,-y,d,scale,field);
                if(x) update(size,alpha,beta,-x,y,d,scale,field);
                if(x && y) update(size,alpha,beta,-x,-y,d,scale,field);
            }
    }
}

function update_zone(size,lattice,alpha,beta,a,b,scale,field){
    if(done==1) {clearTimeout(timer);return;}    
    update_d(size,lattice,alpha,beta,a,b,d,scale,field);
    if(d>=8*cur[size+1]*cur[size+1]) done=1;    
    fill_rect(size,size,field);
    d++;
}

// Runs Animation
function run(size,scale,timeGap)
{
	d=1;done=0;	
	var lattice = document.getElementById("lattice").value;
    var field=ctx.createImageData(size,size);
    var alpha,beta,a,b;
    canvas.width=canvas.height=size;
	f = new2dArray(size+2,size+2);cur = new Array(size+2);
    switch(lattice)
    {
        case 'square': alpha=beta=1;a=b=1;break;
        case 'hexagonal': alpha=0.5;beta=0.5*Math.sqrt(3);a=0.25;b=0.75;break;
    }      
    transform(scale,size);
    init(size,size,field);
    timer=setInterval(function(){update_zone(size,lattice,alpha,beta,a,b,scale,field)},timeGap);
    document.body.appendChild(canvas);
}
