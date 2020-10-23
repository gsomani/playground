var canvas=document.getElementById("canvas");
var ctx=canvas.getContext("2d");
var t=0,deltaE=0;

// Create 2D array
function new2dArray(rows,columns)
{ var i,x;
  x=new Array(rows);
  for(i=0;i<rows;i++)
  	x[i]=new Array(columns);
  return x;		
}

var grain,boundary_energy;var prob=new2dArray(5,5);

function set_color(microstructure,pos,color,value)
{	
	microstructure.data[pos]=255*value;
	microstructure.data[pos+1]=(1-color)*microstructure.data[pos];
	microstructure.data[pos+2]=(1-2*color)*microstructure.data[pos]+255*color;
}

function set_boundary(width,height,grain_size,microstructure,color)
{
	var i,j,k,cur=0,pos,g;var value=new Array(3);grain[width+1][height+1]=grain[1][1];
	for(j=1;j<=height;j++,cur+=(grain_size-1)*grain_size*4*width)
		for(i=1;i<=width;i++,cur+=grain_size*4){
			g=grain[i][j];
			value[0]=(g==grain[i+1][j]);value[1]=(g==grain[i][j+1]);value[2]=(value[0]==1 && value[1]==1 && g==grain[i+1][j+1]);
			pos=cur+(grain_size-1)*4;
			for(k=1;k<grain_size;k++,pos+=grain_size*4*width) set_color(microstructure,pos,color,value[0]);
			set_color(microstructure,pos,color,value[2]); pos-=4;
			for(k=1;k<grain_size;k++,pos-=4) set_color(microstructure,pos,color,value[1]);
		}
	ctx.putImageData(microstructure,0,0);		
}

function set_grain(microstructure,grain_size,pos,width,color)
{
	var i,j,cur;
	for(j=1;j<grain_size;j++,pos+=grain_size*4*width)
		for(i=1,cur=pos;i<grain_size;i++,cur+=4)
			set_color(microstructure,cur,color,1);
}

function set_opaque(microstructure,grain_size,pos,width,color)
{
	var i,j,cur;
	for(j=1;j<=grain_size;j++,pos+=grain_size*4*width)
		for(i=1,cur=pos;i<=grain_size;i++,cur+=4)
			microstructure.data[cur+3]=255;
}

function generate_microstructure(width,height,randomness)
{
	var i,j,cur,N=width*height;
	if(randomness==1) {
	for(i=1;i<=width;i++)
	for(j=1;j<=height;j++)
		grain[i][j]=Math.floor(Math.random()*N);
	}
	else {
	for(i=1,cur=0;i<=width;i++)
	for(j=1;j<=height;j++,cur++)
		grain[i][j]=cur;
	}
	for(i=1;i<=width;i++) {grain[i][height+1]=grain[i][1];grain[i][0]=grain[i][height];}
	for(i=1;i<=height;i++) {grain[width+1][i]=grain[1][i];grain[0][i]=grain[width][i];}		
}

function init(width,height,grain_size,E_k,randomness,microstructure,color){
var i,j,g,cur,E_k;					
generate_microstructure(width,height,randomness);
for(j=1,cur=0;j<=height;j++,cur+=(grain_size-1)*grain_size*4*width)
	for(i=1;i<=width;i++,cur+=grain_size*4)	
	{
		g=grain[i][j];
		boundary_energy[i][j]=(g!=grain[i][j+1])+(g!=grain[i][j-1])+(g!=grain[i+1][j])+(g!=grain[i-1][j]);
		set_opaque(microstructure,grain_size,cur,width,color);
		set_grain(microstructure,grain_size,cur,width,color);
	}
	for(i=0;i<=4;i++)
		for(j=0;j<=4;j++) 
		{
			cur=Math.min(0,(i-j)/E_k);
			prob[i][j]=Math.exp(cur);			
		}								
	set_boundary(width,height,grain_size,microstructure,color);
}

function grow(width,height,grain_size,microstructure,color,timeSteps)
{
	var i,j,x,y,nx,ny,diff,p,bi,bj,time,N=width*height;
	for(time=0;time<timeSteps;time++){
	for(i=0;i<N;i++)
			{
				x=Math.floor(Math.random()*width)+1;
				y=Math.floor(Math.random()*height)+1;
				j=Math.floor(Math.random()*4);
				switch(j)
				{
					case 0:nx=x+1;ny=y;break;
					case 1:nx=x;ny=y-1;break;
					case 2:nx=x-1;ny=y;break;
					case 3:nx=x;ny=y+1;break;
				}
				diff=grain[nx][ny]-grain[x][y];
				if(diff==0) continue; 
				bi=boundary_energy[x][y];diff=grain[nx][ny];
				bj=(diff!=grain[x][y+1])+(diff!=grain[x][y-1])+(diff!=grain[x+1][y])+(diff!=grain[x-1][y]);
				p=prob[bi][bj];j=Math.random();
				if(j<p) 
				{	deltaE+=bj-bi;grain[x][y]=diff;
					grain[x][0]=grain[x][height];grain[x][height+1]=grain[x][1];
					grain[0][y]=grain[width][y];grain[width+1][y]=grain[1][y];
					boundary_energy[x][y]=bj;
				}			
			}
	t++;			
	}		
	set_boundary(width,height,grain_size,microstructure,color);
}

function run(width,height,grain_size,E_k,randomness,color,timeSteps,timeGap)
{	
	var microstructure=ctx.createImageData(grain_size*width,grain_size*height);
    canvas.width=grain_size*width;canvas.height=grain_size*height+35;
    grain= new2dArray(width+2,height+2);boundary_energy=new2dArray(width+2,height+2);
	init(width,height,grain_size,E_k,randomness,microstructure,color);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Grain growth in microstructure",canvas.width/2, canvas.height - 10);
	setInterval(function(){grow(width,height,grain_size,microstructure,color,timeSteps)},timeGap);
}
