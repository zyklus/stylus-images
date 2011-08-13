var imgHeight = require( './image-height' )
  ,      step = require( 'step' )

module.exports = {
	fn : function( renderer, css, sprite, cb ){
		imgHeight.fn( renderer, css, css.props.sprite, cb );
	}
}