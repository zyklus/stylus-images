var fs = require('fs');

module.exports = function( from, to, cb ){
	fs.readFile( from, 'utf8', function( err, data ){
		if( err ){ throw err; }

		fs.writeFile( to, data, cb );
	} );
};