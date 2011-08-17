var imgSize = require( './image-size' )
  ,    step = require( 'step' )

var FN = module.exports = function spriteSize(){};

FN.prototype = {
	render : function render( renderer, css, sprite, cb ){
		(new imgSize).render( renderer, css, css.props.sprite, cb );
	}
}