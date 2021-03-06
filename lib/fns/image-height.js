var   im = require( 'imagemagick')
  , step = require( 'step' )

var FN = module.exports = function imageHeight(){};

FN.prototype = {
	render : function render( renderer, css, sprite, cb ){
		step(function(){
			im.identify( sprite, this );

		}, function( err, info ){
			cb( null, {
				property : [ info.height + 'px' ]
			} );
		});
	}
}