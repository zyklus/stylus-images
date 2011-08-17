var path = require( 'path' );

module.exports = function relative( from, to ){
	// trailing 'a' is to ensure that current dirname is preserved
	var from = path.dirname( from + '/a' ).split( '/' ),
	      to = path.dirname( to   + '/a' ).split( '/' );

	// remove common roots
	while( from.length && ( from[0] === to[0] ) ){
		from.shift();
		to  .shift();
	}

	var outPath = new Array( from.length + 1 ).join( '../' ) + to.join( '/' );
	return outPath ? outPath + '/' : outPath;
}