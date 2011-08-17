var imgSize = require( './image-size' )
  ,    step = require( 'step' )

module.exports = {
	name : 'spriteSize',

	fn : function fn( renderer, css, sprite, cb ){
		imgSize.fn( renderer, css, css.props.sprite, cb );
	}
}