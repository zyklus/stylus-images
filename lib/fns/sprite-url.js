function getSprite( prop ){
	var sprite = /sprite\s*\(\s*['"]([^'"]+)['"]/.exec( prop );

	return (( sprite.length && ( sprite.length > 1 ) )
		? sprite[1]
		: ''
	);
}

module.exports = function(){
	var     bg = this.lookupProperty( 'background' )
	  , sprite = getSprite( bg );

	return ( sprite
		? sprite
		: getSprite( this.lookupProperty( 'background-image' ) )
	);
};