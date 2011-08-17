var   im = require( 'imagemagick')
  , step = require( 'step' )

module.exports = {
	name : 'imageWidth',

	fn : function( renderer, css, sprite, cb ){
		step(function(){
			im.identify( sprite, this );

		}, function( err, info ){
			cb( null, {
				property : [ info.width ]
			} );
		});
	}
}