// 
// This demo shows uses pre-loading of hitmask for MyEntity, and normal/delayed loading of hitmask for MyEntity2
//
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
		hitmask: new ig.ScaledAlphaHitmask('media/3dball_2frames.png', { scale: 4, verticalFrames: 2} ),	// PRE-LOAD hitmask !

		init: function(x, y, settings) {
			// Add the animations
        	this.animSheet = new ig.AnimationSheet( 'media/3dball_2frames.png', 128, 128 );		
			this.addAnim( 'frame1', 1, [0] );
			this.addAnim( 'frame2', 1, [1] );
			this.currentAnim = this.anims.frame1;
	  
			this.parent(x, y, settings);
		},
		update: function() {
			this.parent();
			if (ig.input.pressed('click')) {
				console.log('mouse clicked');
				if (this.hitmask && this.hitmask.entityHittest(this)) {
					console.log('mouse clicked inside entity (and hit opaque pixel)');
					if (this.currentAnim == this.anims.frame1)
						this.currentAnim = this.anims.frame2;
					else
						this.currentAnim = this.anims.frame1;
				}
			}
		}
});

MyEntity2 = ig.Entity.extend({
		hitmask: null,
		size: {x: 128, y: 128},
		hitmask: null,

		init: function(x, y, settings) {
			// Add the animations
        	this.animSheet = new ig.AnimationSheet( 'media/3dball_2frames.png', 128, 128 );		
			this.addAnim( 'frame1', 1, [0] );
			this.addAnim( 'frame2', 1, [1] );
			this.currentAnim = this.anims.frame1;

			// MyEntity uses pre-loaded hitmask. Here we only load hitmask once game has started
			this.hitmask = new ig.ScaledAlphaHitmask('media/3dball_2frames.png', { scale: 4, verticalFrames: 2} ),
	  
			this.parent(x, y, settings);
		},
		update: function() {
			this.parent();
			if (ig.input.pressed('click')) {
				console.log('mouse clicked');
				if (this.hitmask && this.hitmask.entityHittest(this)) {
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
		this.myentity2 = this.spawnEntity(MyEntity2, 200, 10); 
	},
});


// Start the Game with 60fps, a resolution of 160x160, scaled up by a factor of 2
ig.main( '#canvas', MyGame, 60, 320, 160, 2 );

});
