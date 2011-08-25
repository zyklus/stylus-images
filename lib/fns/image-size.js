var im = require( 'imagemagick');

module.exports = function( path ){
	var size = im.identify( path );
	return [ size.width, size.height ];
};

module.exports._name = 'image-size';