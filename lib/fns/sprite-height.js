var imgHeight = require( './image-height' )
  ,      step = require( 'step' )

var FN = module.exports = function spriteHeight(){};

FN.prototype = {
	render : function render( renderer, css, sprite, cb ){
		(new imgHeight).render( renderer, css, css.props.sprite, cb );
	}
}