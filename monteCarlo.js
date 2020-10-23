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

var lattice,b;var prob=new2dArray(5,5);

function set_color(width,height,latticeData,color)
{
	var i,j,cur=0;
	for(j=0;j<height;j++)
		for(i=0;i<width;i++,cur+=4){
			latticeData.data[cur]=255*lattice[i][j];
			latticeData.data[cur+1]=(1-color)*latticeData.data[cur];
			latticeData.data[cur+2]=(1-2*color)*latticeData.data[cur]+255*color;
		}
	ctx.putImageData(latticeData,0,0);		
}

function generate_random_lattice(width,height,x_B)
{
	var i,j,n_a=0,n_b=0,flag=3,x,y,N=width*height,N_A,N_B;
	N_B=Math.round(x_B*N);N_A=N-N_B;
	for(i=0;;i++){		
		for(j=0;j<height && flag==3;j++,n_a++)
		{
		 	lattice[i][j]=(Math.random()<x_B);
		 	n_b+=lattice[i][j];n_a-=lattice[i][j];
		 	flag=(n_b<N_B);
		 	flag+=2*(n_a<N_A) ;
		}
		if(flag<3) break;
	}	
	if (flag==2) flag=0;
	else flag=1;
	
	for(;i<width;i++){	
		for(;j<height;j++) {
			x=Math.floor(Math.random()*width);
			y=Math.floor(Math.random()*height);
			lattice[i][j]=lattice[x][y];
			lattice[x][y]=flag;
		}
		j=0;
	}
}

function populate_lattice(width,height,latticeData,x_B,w,E_k,color){
	var i,j,cur,K=w/E_k;							
	generate_random_lattice(width,height,x_B);
	for(j=0,cur=0;j<height;j++)
		for(i=0;i<width;i++,cur+=4)	
			{
				b[i][j]=lattice[(i+width-1)%width][j]+lattice[(i+1)%width][j]+lattice[i][(j-1+height)%height]+lattice[i][(j+1)%height];
				latticeData.data[cur+3]=255;
			}		
	for(i=0;i<=4;i++)
		for(j=0;j<=4;j++) 
			{
				cur=Math.min(0,(i-j-1)*K);
				prob[i][j]=Math.exp(cur);
			}		
	set_color(width,height,latticeData,color);					
}

function swap_ab(width,height,xi,yi,xj,yj)
{
	lattice[xi][yi]=1;lattice[xj][yj]=0;
	b[(xi+width-1)%width][yi]++;b[(xi+1)%width][yi]++;b[xi][(yi+height-1)%height]++;b[xi][(yi+1)%height]++;
	b[(xj+width-1)%width][yj]--;b[(xj+1)%width][yj]--;b[xj][(yj+height-1)%height]--;b[xj][(yj+1)%height]--;	
}

function diffuse(width,height,latticeData,w,color,timeSteps)
{
	var i,j,x,y,nx,ny,diff,p,bi,bj,time,N=width*height;
	for(time=0;time<timeSteps;time++){
	for(i=0;i<N;i++)
			{
				x=Math.floor(Math.random()*width);
				y=Math.floor(Math.random()*height);
				j=Math.floor(Math.random()*4);
				switch(j)
				{
					case 0:nx=(x+1)%width;ny=y;break;
					case 1:nx=x;ny=(y+height-1)%height;break;
					case 2:nx=(x+width-1)%width;ny=y;break;
					case 3:nx=x;ny=(y+1)%height;break;
				}
				diff=lattice[nx][ny]-lattice[x][y];
				if(diff==0) continue; 
				if(diff==-1) 
				{
				j=x;x=nx;nx=j;
				j=y;y=ny;ny=j;
				}
				bi=b[x][y];bj=b[nx][ny];
				p=prob[bi][bj];
				j=Math.random();if(j<p) {swap_ab(width,height,x,y,nx,ny);deltaE+=(bj+1-bi)*w;}			
			}
	t++;			
	}		
	set_color(width,height,latticeData,color);	
}

function run(width,height,color,timeSteps,timeGap)
{	
	var x_B = +document.getElementById("x_b").value, w = +document.getElementById("w").value,E_k = +document.getElementById("E_k").value;
	var latticeData=ctx.createImageData(width,height);
	lattice= new2dArray(width,height);b=new2dArray(width,height);
    canvas.width=width;canvas.height=height+50; 	
	populate_lattice(width,height,latticeData,x_B,w,E_k,color);
	ctx.font = "20px Arial";	
	ctx.textAlign = 'center';
	ctx.fillText("Diffusion in square lattice",canvas.width/2, canvas.height - 25);	
	ctx.beginPath();	
	ctx.rect(width/4,height+30,10,10);
	if(color==1) ctx.fillStyle="blue";	
	ctx.textAlign = 'left';
	ctx.fillText("A",15+width/4, height+42);
	ctx.fill();	
	ctx.beginPath();	
	ctx.rect(0.75*width,height+30,10,10);
	if(color==1) {ctx.fillStyle="red";ctx.fill();}	
	else
	{ctx.textAlign = 'left';
	ctx.stroke();
	}
	ctx.fillText("B",15+3*width/4, height+42);
	setInterval(function(){diffuse(width,height,latticeData,w,color,timeSteps)},timeGap);
}
