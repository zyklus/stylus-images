var imgWidth = require( './image-width' )
  ,     step = require( 'step' )

var FN = module.exports = function spriteWidth(){};

FN.prototype = {
	render : function render( renderer, css, sprite, cb ){
		(new imgWidth).render( renderer, css, css.props.sprite, cb );
	}
}