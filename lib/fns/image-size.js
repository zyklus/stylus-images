var   im = require( 'imagemagick')
  , step = require( 'step' )

module.exports = {
	fn : function( renderer, css, sprite, cb ){
		step(function(){
			im.identify( sprite, this );

		}, function( err, info ){
			cb( null, {
				line : [ 'width: ' + info.width + 'px;', 'height: ' + info.height + 'px;' ]
			} );
		});
	}
}