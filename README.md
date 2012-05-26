
# ScaledAlphaHitmask - Hitmask plugin for ImpactJS game engine

`ScaledAlphaHitmask` is a plugin for the ImpactJS game engine and facilitates hit detection on transparent images.
It is intended to be used to detect mouse clicks on partially transparent buttons. The hitmask is derived from the alpha channel of the button image. A scaling factor can be set to reduce the size of the hitmask. After initial creation of the hitmask we can call the ``hittest(...)`` function in our button's `update()` handler, passing in the *relative* x,y coordinates of the mouse. 


## GameButton example

* The sample code below demonstrates how to create a simple button that uses the `ScaledAlphaHitmask` plugin.
	To reduce the amount of code we also utilize the [ButtonStateMachine][] plugin to handle button state changes.

* To run the demo code
	* place the `ScaledAlphaHitmask.js` plugin into your `[Project]/lib/plugins` directory.
	* place the `DemoGamebtn.js` file into your `[Project]/lib/game/entities` directory.
	* place a `samplebtn.png` image into your `[Project]/media/btns` directory.
		(Note: to test the `ScaledAlphaHitmask` this image needs to have an alpha channel with transparent and non-transparent pixels)
	* copy relevant code from `main.js` snippet into your own `main.js` code.
	* download [ButtonStateMachine][] plugin and place plugin into your `[Project]/lib/plugins` directory.
			(Note: this plugin is not required to use `ScaledAlphaHitmask`, but it is required to run the demo code.)

<pre>
// -------------------------------------------------------------------------------------------------------------
// main.js
// -------------------------------------------------------------------------------------------------------------
ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	// ...
	// ...
	'game.entities.demogamebtn'
)
.defines(function(){

MyGame = ig.Game.extend({
	
	// ...
	// ...
	
	init: function() {
		// ...
		// ...

		// Capture Mouse Down events ... 
		ig.input.bind(ig.KEY.MOUSE1, 'click');		// note: we check for 'click' to determine if mouse down (see IsMouseDown() in DemoGameBtn.js)
	  
	  
		// Test DemoGameBtn
		var demoGamebtn = ig.game.spawnEntity(EntityDemoGamebtn, 100, 100, { image: '5RV3_EG_Gamble.00000320.png', width: 106, height: 120});
		
		window.focus();
		ig.system.canvas.onclick = function() {
			window.focus();
		};
	}
});

</pre>


<pre>
// -------------------------------------------------------------------------------------------------------------
// DemoGamebtn.js
// -------------------------------------------------------------------------------------------------------------
ig.module(
	'game.entities.demogamebtn'
)
.requires(
	'plugins.scaled-alpha-hitmask',
	'plugins.button-state-machine',
	'impact.entity'
)
.defines(function() {
	EntityDemoGamebtn = ig.Entity.extend({
		size: {x: 16, y: 16},
		
		btnStateMachine: null,
		hitmask: null,
		
		// -------------------------------------------------------------------------------------------------------------
		// Button States
		// -------------------------------------------------------------------------------------------------------------
		endClick: function() { this.currentAnim = this.anims.btnNormal;	},
		endClickIgnore: function() { this.currentAnim = this.anims.btnNormal; },
		endHover: function() { this.currentAnim = this.anims.btnNormal;	},
		startClick: function() { this.currentAnim = this.anims.btnDown;	},
		startHover: function() { this.currentAnim = this.anims.btnHover; },
		
		// -------------------------------------------------------------------------------------------------------------
		// Alpha Hit Detection
		// -------------------------------------------------------------------------------------------------------------
		// hittest - returns true if mouse cursor within bounds, else false
		hittest: function() {
			if ((ig.input.mouse.x > this.pos.x && ig.input.mouse.x < (this.pos.x + this.size.x)) &&
				(ig.input.mouse.y > this.pos.y && ig.input.mouse.y < (this.pos.y + this.size.y)))
			{
				// if we have hitmask defined then check if we inside or outside of hitmask,
				// if no hitmask then we already inside and return true
				if (this.hitmask) {
					return this.hitmask.hittest(ig.input.mouse.x - this.pos.x, ig.input.mouse.y - this.pos.y, 0 /* we only interested in frame 0 so no need to pass any other*/);
				} else {
					return true;
				}
			}
			return false;						// hittest failed - mouse outside of entity
		},
		init: function(x, y, settings) {
			
			this.animSheet = new ig.AnimationSheet('media/btns/' + settings.image , settings.width, settings.height);
			this.addAnim('btnNormal', 1, [0]);
			this.addAnim('btnHover', 2, [1]);
			this.addAnim('btnDown', 3, [2]);
			this.addAnim('btnDisabled', 4, [3]);
			this.currentAnim = this.anims.btnNormal;
			this.size.x = settings.width;
			this.size.y = settings.height;
			
			// ...
			// ...
			this.btnStateMachine = new ig.ButtonStateMachine();
			this.btnStateMachine.isMouseInside = this.hittest.bind(this);
			this.btnStateMachine.isMouseDown = function() { return ig.input.state('click'); };
			this.btnStateMachine.startClick = this.startClick.bind(this);
			this.btnStateMachine.endClick = this.endClick.bind(this);
			this.btnStateMachine.startHover = this.startHover.bind(this);
			this.btnStateMachine.endHover = this.endHover.bind(this);
			this.btnStateMachine.endClickIgnore = this.endClickIgnore.bind(this);
			
			this.hitmask = new ig.ScaledAlphaHitmask();
			this.hitmask.scale = 8;
			this.hitmask.verticalFrames = 4;				// normal | hover | down | disabled
			this.hitmask.drawHitmask = true;				// set to 'false' to disable drawing of hitmask over btn image
			this.hitmask.setImage(this.animSheet.image);
			
			this.parent(x, y, settings);
		},
		update: function() {
			this.parent();
			
			this.btnStateMachine.updateState();
		}
	});
});

</pre>


## Methods

* `createDebugImage()`
	- Creates an image of the hitmask created and saves it to the original image used to derive the hitmask.
	- This function is only intended for debugging purposes to show what the hitmask created looks like.
		The *white* parts of the image will result in hit *'misses'* and the *black* parts of the image will result in *'hits'* .
	- To enable drawing of the debug image set `drawHitmask` to `true`.
* `hittest(xHitOffset, yHitOffset, frameIdx)`
	- Test pixel at `xHitOffset, yHitOffset` for currently active image frame (`frameIdx`)
	- Recommend passing in '0' for `frameIdx` to always test on the first (default) frame (i.e. button state: normal)
	- See `useOnlyFirstFrame` property.
* `loadHitmask()`
	- Once the hitmask image is assigned (using `setImage()`) `loadHitmask()` gets called to create the hitmask.
	- If the hitmask image is already loaded, `loadHitmask()` will be called immediately, 
		else `loadHitmask()` will be called from the image's `onload()` handler.
* `setImage(image)`
	- Call `setImage(...)` to assign the image to be used to derive hitmask.
	- Make sure that you have set the required hitmask creation properties *before* calling `setImage(...)`. 
* `reset()`
	- Reset the hitmask. If an image reference is set, then clear that image's `loadHitmask()` callback before dereferencing the image.
	- Reset `isLoaded` flag to indicate that no hitmask is loaded.

## Properties

* `scale`
	- Value to downscale the hitmask by. A value of 1 implies no scaling. A value of 4 will scale down the hitmask by a factor of 4.
		- e.g. with a 20x100 pixel image with 4 vertical frames and a scaledown factor of 4 
			the resulting hitmask will be 5x7. 
		- Hitmask Width = (w-1)/scale + 1 = (20-1)/4 + 1 = 5. 
		- Hitmask Height = (h-1)/frames/scale + 1 = (100-1)/4/4 + 1 = 7.
* `verticalFrames`
	- Specify how many vertical frames the input image has. If no frames, then specify 1.
	- *Horizontal frames, or a combination of vertical and horizontal frames is not supported.*
* `drawHitmask`
	- Default to `false`. If `true` then the hitmask created will be drawn into the original input image used to create mask.
	- Only meant for debugging purposes.
	- See `createDebugImage()`
* `useOnlyFirstFrame`
	- If true, then we only use the first frame of the input image to create hitmask. (for button hitmasks this is all we require)
	- Defaults to `true`. (recommended setting)
	- Note: *code was initially written to support multiframe hitmasks, but this code has not been tested thoroughly as it is 
		not required for button hitmasks.*


## Still Todo, and Bugs to be fixed (if required or requested)

* Test changing hitmask by changing the hitmask input image. (Currently not required to change hitmask once loaded, but should hopefully work) 
* What happens if the whole system is scaled by a factor (`ig.system.scale`) ?
	- We will probably have to add ig.system.scale into our calculations.
* *Feedback welcome here ...*

## Future Improvements

* *Any thoughts welcome here ...*



[ButtonStateMachine]: https://github.com/HeikoR/Impact-ButtonStateMachine









