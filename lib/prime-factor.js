module.exports.factor = function factor( num ){
	var primes = [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97 ], // factor any number up to 10,000
	   factors = [];

	for( var i=0, l=primes.length; i<l; i++ ){
		if( num < primes[i] ){ break; }

		while( (num > 1) && !( num % primes[i] ) ){
			factors.push( primes[ i ] );
			num /= primes[ i ];
		}
	}

	if( num > 1 ){ factors.push( num ); }

	return factors;
};

module.exports.merge = function merge( f1, f2 ){
	var p1 = 0,
	    p2 = 0,
	    l1 = f1.length,
	    l2 = f2.length,
	   out = [],
	    diff;

	while(
		   ( p1 < l1 )
		|| ( p2 < l2 )
	){
		diff = f1[p1] - f2[p2];

		if( p1 == l1){ // p1 is exhausted
			out.push.apply( out, f2.splice( p2 ) );
			p2 = l2;

		}else if( p2 == l2 ){ // p2 is exhausted
			out.push.apply( out, f1.splice( p1 ) );
			p1 = l1;

		}else if( !diff ){ // numbers are the same
			out.push( f1[p1] );
			p1++;
			p2++;

		}else if( diff < 0 ){ // p1 is smaller, push it
			out.push( f1[p1] );
			p1++;
	
		}else if( diff > 0 ){ // p2 is smaller, push it
			out.push( f2[p2] );
			p2++;
		}
	}

	return out;
};

module.exports.reduce = function multiply( f ){
	return f.reduce( function( prev, cur ){ return prev * cur; }, 1 );
};