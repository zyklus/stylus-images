var imgSize = require( './image-size' )
  ,    step = require( 'step' )

module.exports = {
	fn : function( renderer, css, sprite, cb ){
		imgSize.fn( renderer, css, css.props.sprite, cb );
	}
}