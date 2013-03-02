/**
Copyright (c) 2013 Erik Onarheim
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software
   must display the following acknowledgement:
   This product includes software developed by the GameTS Team.
4. Neither the name of the creator nor the
   names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE GAMETS TEAM ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE GAMETS TEAM BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


/// <reference path="Algebra.ts" />
/// <reference path="Drawing.ts" />
/// <reference path="Camera.ts" />

module Core {
	
	var Keys : {[key:string]:number;} = 
				{"up": 38, "down": 40, "left": 37, "right": 39,
				 "space": 32, "a": 65, "s": 83, "d": 68, "w": 87,
				 "shift": 16};
	

	export class Sound {
		sound : HTMLAudioElement;
		constructor(public path: string){
			this.sound = new Audio(path);
			this.sound.preload = "false";
		}


		play() {
			//document.body.appendChild(this.sound);
			this.sound.play();
			//this.sound.play();
		}
	}


	export interface Actor {
		update(engine: SimpleGame, delta: number);
		draw(ctx: CanvasRenderingContext2D, delta: number);
	}

	export class Color {
		constructor(public r: number, public g: number, public b: number){

		}

		toString(){
			return "rgb(" + String(this.r.toFixed(0)) + ", " + String(this.g.toFixed(0)) + ", " + String(this.b.toFixed(0)) + ")";
		}
	}

	export class Player implements Actor {
		
		box : Box;
		gravity : number = 4;

		// Initial velocity is 0
		dx: number = 0;
		dy: number = 0;
		
		// Initial acceleartion is 0;
		ax: number = 0;
		ay: number = 0;
		onGround : bool;

		// Current animation
		currentAnimation: Drawing.Animation = null;

		// List of key handlers for a player
		handlers : {[key:string]: { (player:Player): void; };} = {};

		// List of animations for a player
		animations : {[key:string]:Drawing.Animation;} = {};

		constructor (public x: number, public y: number, public width : number, public height:number){
			this.onGround = false;
			this.box = new Box(x,y,width,height);
			
			this.ay = this.gravity;
		}

		setGravity(gravity: number){
			this.gravity = gravity;
			this.ay = this.gravity;
		}

		/*
		addKeyHandler(key:string, handler: (player:Player) => void){
			this.handlers[key] = handler;
		}*/

		addKeyHandler(key:string[], handler: (player:Player) => void){
			for(var i in key){
				var k = key[i];
				this.handlers[k] = handler;
			}
		}

		addAnimation(key:string, animation: Drawing.Animation){
			this.animations[key] = animation;
		}

		playAnimation(key){
			this.currentAnimation = this.animations[key];
		}

		update(engine: SimpleGame, delta: number){
			
			// Key Input
			var keys = engine.keys;

			for(var key in this.handlers){
				var pressedKey = engine.keyMap[key];
				if(keys.indexOf(pressedKey)>-1){
					this.handlers[key](this);
				}
			}

			// Update placements based on physics
			this.box.x += this.dx;
			this.box.y += this.dy;

			this.dx += this.ax;
			this.dy += this.ay;

			this.onGround = false;

			// Pseudo-Friction
			this.dx = 0;

			// Test Collision
			for(var i = 0; i < engine.level.length; i++){
				var levelBox = engine.level[i].boundingBox;
				
				if(this.box.collides(levelBox)){

					var overlap = this.box.getOverlap(levelBox);
					if(Math.abs(overlap.y) < Math.abs(overlap.x)){ 
						this.box.y += overlap.y; 
						this.dy = 0;
						this.onGround = true;
					} else { 
						this.box.x += overlap.x; 
						this.dx = 0;
					}
				}
			}

		}
		
		draw(ctx : CanvasRenderingContext2D, delta: number){
			if(this.currentAnimation){
				this.currentAnimation.draw(ctx, this.box.x, this.box.y);
			}else{
				ctx.fillStyle = "rgb(" + String(245) + ", " + String(110) + ", " + String(148) + ")";
				ctx.fillRect(this.box.x,this.box.y,this.box.width,this.box.height);				
			}

		}
	}


	export class Block implements Actor {
		color : Color;
		boundingBox : Box;
		constructor(public x:number, public y: number, public width: number, public height:number, color: Color){
			this.color = color;	
			this.boundingBox = new Box(this.x,this.y,this.width,this.height);
		}
		
		toString(){
			return "[x:" + this.boundingBox.x + ", y:" + this.boundingBox.y + ", w:" + this.boundingBox.width + ", h:" + this.boundingBox.height +"]";
		}
		
		update(engine: SimpleGame, delta: number){
			
		}
		draw(ctx: CanvasRenderingContext2D, delta: number){
			
			ctx.fillStyle = this.color.toString();			
			ctx.fillRect(this.boundingBox.x,this.boundingBox.y,this.boundingBox.width,this.boundingBox.height);
		}
	}

	export class Overlap {
		constructor(public x: number, public y: number){

		}
	}

	export class Box {
		
		constructor (public x: number, public y: number, public width : number, public height:number){
			
		}

		getLeft() {
			return this.x;
		}

		setLeft(left: number){
			this.x = left;
		}

		getRight(){
			return this.x + this.width;
		}

		setRight(right: number){
			this.width = right - this.x;
		}

		getTop(){
			return this.y;
		}

		setTop(top: number){
			this.y = top;
		}

		getBottom(){
			return this.y + this.height;
		}

		setBottom(bottom: number){
			this.height = bottom - this.y;
		}

		getOverlap(box: Box): Overlap{
			var xover = 0;
			var yover = 0;
			if(this.collides(box)){
				if(this.getLeft() < box.getRight()){
					xover = box.getRight() - this.getLeft();
				}
				if(box.getLeft() < this.getRight()){
					var tmp =  box.getLeft() - this.getRight();
					if(Math.abs(xover) > Math.abs(tmp)){
						xover = tmp;
					}
				}

				if(this.getBottom() > box.getTop()){
					yover = box.getTop() - this.getBottom();
				}

				if(box.getBottom() > this.getTop()){
					var tmp = box.getBottom() - this.getTop();
					if(Math.abs(yover) > Math.abs(tmp)){
						yover = tmp;
					}
				}

			}
			return new Overlap(xover,yover);
		}
		
		collides(box : Box){
			var w = 0.5 * (this.width + box.width);
			var h = 0.5 * (this.height + box.height);

			var dx = (this.x + this.width/2.0) - (box.x + box.width/2.0);
			var dy = (this.y + this.height/2.0) - (box.y + box.height/2.0);

			if (Math.abs(dx) < w && Math.abs(dy) < h)
			{
			    return true;
			}
		}
			
	}

	export class Game {
		constructor(){

		}
	}

	export class TopDownGame extends Game {
		constructor(){
			super();
		}
	}

	export class SimpleGame extends Game {
		
		debugFontSize = 50;
		actors: Actor[] = [];
		level: Block[] = [];

		// key buffer
		keys = [];
		// key mappings
		keyMap : {[key:string]:number;} = Keys;
		
		// internal canvase
		canv = <HTMLCanvasElement>document.createElement("canvas");
		ctx : CanvasRenderingContext2D;

		// internal camera
		camera : Camera.SideCamera = null;

		constructor(public width : number, public height : number, public fullscreen? : bool, public backgroundColor?: Color){
			super();
			this.actors = [];
		}
		
		update(engine: SimpleGame, delta: number){
			for(var i = 0; i< this.actors.length; i++){
				this.actors[i].update(engine, delta);
			}
		}

		addCamera(camera : Camera.SideCamera){
			this.camera = camera;
		}
		
		draw(ctx, delta: number){
			if(!this.backgroundColor){
				this.backgroundColor = new Color(0,0,0);
			}
			// Draw Background color
			this.ctx.fillStyle = this.backgroundColor.toString();
			this.ctx.fillRect(0,0,this.width,this.height);

			// Draw debug information
			this.ctx.fillStyle = new Color(250,0,0).toString();
			for (var j = 0; j < this.keys.length; j++){
				this.ctx.fillText(this.keys[j],10, 10*j+10)
			}

			ctx.save();

			if(this.camera){
				this.camera.applyTransform(ctx, delta);	
			}
			
			// Draw level
			for(var k = 0; k< this.level.length; k++){
				this.level[k].draw(ctx, delta);
			}

			// Draw actors
			for(var i = 0; i< this.actors.length; i++){
				this.actors[i].draw(ctx, delta);
			}
			ctx.restore();
		}
		
		addActor(actor: Actor){
			this.actors.push(actor);
		}
		
		addBlock(block: Block){
			this.level.push(block);
		}
		
		start(){
			// Mainloop
			window.setInterval(()=> {
				this.update(this, 20); 
				this.draw(this.ctx,20);
			},20);

			// Capture key events
			window.onkeydown = (ev)=>{if(this.keys.indexOf(ev.keyCode)<0){this.keys.push(ev.keyCode)}};
			window.onkeyup = (ev)=>{var key = this.keys.indexOf(ev.keyCode); this.keys.splice(key,1);};

			// Setup canvas drawing surface in DOM
			this.canv.width = this.width;
	    	this.canv.height = this.height;
	    	if(this.fullscreen){
		    	document.body.style.margin = "0";
		    	this.canv.style.width = "100%";
		    	this.canv.style.height = "100%";
	    	}
	    	document.body.appendChild(this.canv);
	    	this.ctx = this.canv.getContext("2d");
		}
		
	}

}