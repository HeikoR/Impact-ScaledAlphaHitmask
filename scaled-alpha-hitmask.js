// Description: Hitmask plugin for the ImpactJS game engine
// Author     : Heiko W. Risser
// Created    : May 2012
// SourceLink : https://github.com/HeikoR/Impact-ScaledAlphaHitmask
// Revision   : 1.0

ig.module (
	'plugins.scaled-alpha-hitmask'
)
.requires (
	'impact.impact',
	'impact.image',
	'impact.animation',
	'impact.entity'
)
.defines( function () {
	
	// ig scaling not supported yet (where everything is scaled up)
	ig.ScaledAlphaHitmask = ig.Class.extend({
		hitmask: null,									// stores hitmask pixels (hitmask[frameIdx][xScaledDown][yScaledDown])
		isLoaded: false,								// true once hitmask has been loaded
		scale: 1,										// create hitmask scaled down to 'scale' (thus scale == 1 implies no scaling, scale == 4 implies hitmask 4 times smaller than image)
		verticalFrames: 1,								// how many frames do we have in image (e.g. for buttons we have 4 -> normal, hover, down, disabled)
		drawHitmask: true,								// if true, then we overwrite ig.image with image of hitmask we created
		useOnlyFirstFrame: true,						// only use 1st image frame (if multiple frames in image) as the hitmask (creates smaller hitmask)
														// if you got multiple frames we expect frame '0' to be the default frame used for hittest
		
		createDebugImage: function() {
			if (this.isLoaded == false)					// we require hitmask to be loaded for us to create hitmask debug image
				return false;
			if (!this.hitmask)							// double check that we have hitmask
				return false;
			var x, y, w, h, offset;
			
			w = this.image.data.width;
			h = this.image.data.height;
			
			// (bit of duplication here - creating temp canvas again - but we don't expect to call this in release)
			var canvas = ig.$new('canvas');
			canvas.width = w;
			canvas.height = h;
			var ctx = canvas.getContext('2d');
			var rowsToSamplePerFrame = h / this.verticalFrames;

			ctx.drawImage(this.image.data, 0, 0);
			imgData = ctx.getImageData(0, 0, w, h);
			var pixels = imgData.data;
			var frameIdx = 0;
			var xScaledDown = 0;
			var yScaledDown = 0;
			
			// create semi-transparent hitmask image data, with white for 'miss' pixels, and black for 'hit' pixels
			for (y = 0; y < h; y++) {
				yScaledDown = parseInt(y/this.scale);
				frameIdx = parseInt(y/rowsToSamplePerFrame);
				if (this.useOnlyFirstFrame && (frameIdx > 0))			// if we only use first frame for hitmask, then don't draw hitmask into remaining frames
					break;
				
				for (x = 0; x < w; x++) {
					offset = x*4 + w*4 * y;
					xScaledDown = parseInt(x/this.scale);
					pixels[offset] = this.hitmask[frameIdx][xScaledDown][yScaledDown] ? 0 : 255;
					pixels[offset + 1] = this.hitmask[frameIdx][xScaledDown][yScaledDown] ? 0 : 255;
					pixels[offset + 2] = this.hitmask[frameIdx][xScaledDown][yScaledDown] ? 0 : 255;
					pixels[offset + 3] = 180;
				}
			}
			
			ctx.putImageData(imgData, 0,0);
			this.image.data = canvas;				// save modified image (containing debug hitmask image) over original image (thus when original image is drawn it will draw hitmask)
			
			return true;
		},
		// xHitOffset 	- the x offset from left,top corner of hittest object (normally an entity)
		//				- xHitOffset = ig.input.mouse.x - entity/object.pos.x
		// yHitOffset 	- the y offset from left,top corner of hittest object (normally an entity)
		//				- yHitOffset = ig.input.mouse.y - entity/object.pos.y
		hittest: function(xHitOffset, yHitOffset, frameIdx) {
			if (!this.isLoaded || !this.hitmask)						// if hitmask not loaded, or reset() then return false;
				return false;
			if (this.useOnlyFirstFrame && (frameIdx > 0))				// if set then we always test on the first frame's hitmask
				frameIdx = 0; 											
				
			var x = parseInt(xHitOffset/this.scale);
			var y = parseInt(yHitOffset/this.scale);	
			
			if (!this.hitmask ||										// validate that hitmask == hitmask[frameIdx][xScaledDown][yScaledDown]
				this.hitmask.length == 0 ||
				this.hitmask[frameIdx].length == 0 ||
				this.hitmask[frameIdx][0].length == 0)					
				return false;
			//console.log('hittestMask --- x,y:' + x + ',' + y + ' ==> ' + mask[tile][x][y]);
			
			if (x >= 0 && x < this.hitmask[frameIdx].length && y >= 0 && y < this.hitmask[frameIdx][0].length) {
				if (this.hitmask[frameIdx][x][y] === 1) {
					return true;
				}
			}
			return false;
		},
		init: function() {
			
		},
		loadHitmask: function() {
			if (this.isLoaded)											// don't reload if already loaded
				return false;
			if (!this.image)
				return false;
			console.log('loadingHitmask for image: ' + this.image.path + '. Scaling down by ' + this.scale + ' for ' + this.verticalFrames + ' verticalFrames.');
			
			var x, y, idx, w, h;
			var imgData;
			w = this.image.data.width;
			h = this.image.data.height;
			var canvas = ig.$new('canvas');
			var ctx = canvas.getContext('2d');
			canvas.width = w;
			canvas.height = h;

			// load image onto temp canvas
			// we then extract the image data and use its alpha channel to create hitmask
			ctx.drawImage(this.image.data, 0, 0);
			imgData = ctx.getImageData(0, 0, w, h);
			var pixels = imgData.data;
			
			if (!pixels || (pixels.length < w*4*h))
				return false;			
			
			// Sanity check - test if image divisible by specified num vertical frames, else return false
 			var rowsToSamplePerFrame = h / this.verticalFrames;
			if (parseInt(rowsToSamplePerFrame) !== rowsToSamplePerFrame)
				return false;												
			
			// - divide height by verticalFrames (e.g. 4), and scale (e.g. 4)
			// - thus with input sample of 20x100 lines, scale of 4 and 4 frames, we get resultant output mask of 5x7 lines
			// - mask width = ((20-1) / 4) + 1 = 5 pixels
			// - mask height = ((100-1) / 4 / 4) + 1 = 7 pixels
			var frameIdx = 0;
			var scaledFrameWidth = parseInt((w-1) / this.scale) + 1;
			var scaledFrameHeight = parseInt((h-1) / this.verticalFrames / this.scale) + 1;
			
			// pre-create scaled hitmask with blank pixels (i.e. all zeroes == hit 'misses'), then in next step we check if any input pixel in group is a 'hit' and OR them
			this.hitmask = [];
			for (frameIdx = 0; frameIdx < this.verticalFrames; frameIdx++) {
				this.hitmask[frameIdx] = [];
				
				for (x = 0; x < scaledFrameWidth; x++) {
					this.hitmask[frameIdx][x] = [];
					for (y = 0; y < scaledFrameHeight; y++) {
						this.hitmask[frameIdx][x][y] = 0;
					}
				}
				if (this.useOnlyFirstFrame)								// no need to create a larger pixel array - we only need space to store hitmask of first frame
					break;
			}

			
			var xScaledDown;
			var yScaledDown;
			for (y = 0; y < h; y++) {
				frameIdx = parseInt(y/rowsToSamplePerFrame);
				if (this.useOnlyFirstFrame && (frameIdx > 0))			// if we only creating mask for first frame (default) then exit once we switch to next frame
					break;												// note - currently only require single frame mask, but leaving code incase we at some stage need separate masks for each frame
				yScaledDown = parseInt(y/this.scale);
				for (x = 0; x < w; x++) {
					xScaledDown = parseInt(x/this.scale);
					this.hitmask[parseInt(y/rowsToSamplePerFrame)][xScaledDown][yScaledDown] |= pixels[3 + x*4 + (w*4 * y)] == 255 ? 1 : 0;
				}
			}
		
			this.isLoaded = true;				// nb: we need to flag hitMask as loaded before we reload debug image data
			
			if (this.drawHitmask)
				this.createDebugImage();
			return true;
		},
		setImage: function(image) {
			this.reset();
			
			if (!(image instanceof ig.Image)) {
				return;
			}
			this.image = image;
			this.image.loadHitmask = this.loadHitmask.bind(this);
			if (this.image.loaded)					// if image is already loaded, then load hitmask here
				this.loadHitmask();
		},
		reset: function() {
			if (this.image)							// if we have an existing image assigned, then reset image's callback before we unreference the image
				this.image.loadHitmask = null;
			this.image = null;
			this.hitmask = null;
			this.isLoaded = false;
		}
	});	

	
	//
	// extend ig.Image to load hitmask in onload() handler (only if loadHitmask callback set!)
	//
	ig.Image.inject({
		loadHitmask: null,							// if image used to derive hitmask, then this callback will be set by ScaledAlphaHitmask to notify when image loading completed
		
		onload: function(event) {
			this.parent(event);
			
			if (this.loadHitmask)
				this.loadHitmask();
		}
	});
});
