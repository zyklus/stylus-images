var imgWidth = require( './image-width' )
  ,     step = require( 'step' )

module.exports = {
	fn : function( renderer, css, sprite, cb ){
		imgWidth.fn( renderer, css, css.props.sprite, cb );
	}
}