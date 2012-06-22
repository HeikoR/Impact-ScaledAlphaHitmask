ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'plugins.scaled-alpha-hitmask'
)
.defines(function(){

MyEntity = ig.Entity.extend({
		hitmask: null,
		image: null,
		size: {x: 128, y: 128},
		frame: 0,						// which frame of image to draw (0 or 1)

		init: function(x, y, settings) {
			this.image = new ig.Image('media/3dball_2frames.png');

			this.hitmask = new ig.ScaledAlphaHitmask();
			// this.hitmask.drawHitmask = false;		// don't draw debug mask over image
			this.hitmask.scale = 4;
			this.hitmask.setImage(this.image);

			this.parent(x, y, settings);
		},
		update: function() {
			this.parent();
			if (ig.input.pressed('click')) {
				console.log('mouse clicked @ ' + ig.input.mouse.x + ',' + ig.input.mouse.y);
				if (this.hitmask.entityHittest(this)) {
					console.log('mouse clicked inside entity !!! (and hit opaque pixel)');
					this.frame = this.frame ? 0 : 1;
				}
			}
		},

		draw: function() {
			this.parent();

			if (this.image)
				this.image.drawTile(this.pos.x, this.pos.y, this.frame, this.image.width);	
		}
});


MyGame = ig.Game.extend({
	myentity: null,
	
	init: function() {
		// Initialize your game here; bind keys etc.
		ig.input.bind(ig.KEY.MOUSE1, 'click');					// bind left mouse click

		this.myentity = this.spawnEntity(MyEntity, 20, 20); 	// create instance of MyEntity
	},
});


ig.main( '#canvas', MyGame, 60, 240, 240, 2 );

});
