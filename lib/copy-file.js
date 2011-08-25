var fs = require('fs');

module.exports = function( from, to ){
	var data = fs.readFileSync( from, 'utf8' );
	fs.writeFileSync( to, data );
};