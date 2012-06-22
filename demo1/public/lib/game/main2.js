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
		size: {x: 128, y: 128},

		init: function(x, y, settings) {
			// Add the animations
        	this.animSheet = new ig.AnimationSheet( 'media/3dball_2frames.png', 128, 128 ),		
			this.addAnim( 'frame1', 1, [0] );
			this.addAnim( 'frame2', 1, [1] );
			this.currentAnim = this.anims.frame1;

			this.hitmask = new ig.ScaledAlphaHitmask();
			// this.hitmask.drawHitmask = false;		// don't draw debug mask over image
			this.hitmask.scale = 4;
			this.hitmask.setImage(this.animSheet.image);

	  
			this.parent(x, y, settings);
		},
		update: function() {
			this.parent();
			if (ig.input.pressed('click')) {
				console.log('mouse clicked');
				if (this.hitmask.entityHittest(this)) {
					console.log('mouse clicked inside entity (and hit opaque pixel)');
					if (this.currentAnim == this.anims.frame1)
						this.currentAnim = this.anims.frame2;
					else
						this.currentAnim = this.anims.frame1;
				}
			}
		}
});


MyGame = ig.Game.extend({
	
	myentity: null,
	
	init: function() {
		// Initialize your game here; bind keys etc.
		ig.input.bind(ig.KEY.MOUSE1, 'click');

		this.myentity = this.spawnEntity(MyEntity, 10, 10); 
	},
});


// Start the Game with 60fps, a resolution of 160x160, scaled up by a factor of 2
ig.main( '#canvas', MyGame, 60, 160, 160, 2 );

});
