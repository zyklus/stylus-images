var path = require( 'path' ),
fs = require('fs'),
    step = require( 'step' ),
  sprite = require( './fns/sprite' );

module.exports = function(){
	var blocks = [],
	       ops = [],
	       idx = 0,
	       sRx = /\/\*STYLUS-IMAGE-(\d+)\*\//g,
	    outputDirectory, block, properties, obj, called, renderer;

	function getId(){
		return '/*STYLUS-IMAGE-' + (idx++) + '*/';
	}

	function fn_sprite( url ){
		ops.push( [ 'sprite', fs.realpathSync( path.dirname( renderer.options.filename) + '/' + url.val ) ] );

		return getId();
	}

	function replaceVisitBlock( Compiler ){
		var oldFn = Compiler.prototype.visitBlock;

		Compiler.prototype.visitBlock = function( prop ){
			block = [];

			var buf       = this.buf;
			this.buf      = '';
			var ret       = oldFn.apply( this, arguments );
			var blockCode = this.buf;
			this.buf      = buf + this.buf;

			var res;
			// if we have anything in this block handled by this library,
			//   store the parsed block for later analysis
			while( res = sRx.exec( blockCode ) ){
				blocks.push( block );
			}

			return ret;
		}
	}

	function replaceVisitProperty( Compiler ){
		var oldFn = Compiler.prototype.visitProperty;

		Compiler.prototype.visitProperty = function( prop ){
			var val = oldFn.apply( this, arguments );

			// push the current parsed & generated data into the block
			block.push({
				prop : prop,
				 val : val
			});

			return val;
		};
	}

	return obj = {
		use : function( styl ){
			/**
			 * THIS IS A HACK.  AN UGLY, HORRILE HACK!
			 *
			 * Get a reference to the compiler so that we can intercept calls to visitProperty
			 */
			var Compiler = require( styl.options.imports[0].replace(/\/[^\/]+$/, '') + '/visitor/compiler' );

			replaceVisitBlock   ( Compiler );
			replaceVisitProperty( Compiler );

			var self = this;

			styl
				.define( 'sprite', fn_sprite );

			renderer = styl;
		},

		setOutputDirectory : function( dir ){
			outputDirectory = dir;
		},

		render : function( cb ){
			return function( err, css ){
				if( err ){ throw err; }

				if( ops.length !== blocks.length ){
					throw new Error( 'Length mis-match between operations & blocks -- This should not be possible!  I am a bug.' );
				}

				step(function(){
					// reset the state of any helpers
					sprite.reset();

					// parse any operations
					var op, block;
					while( (op=ops.shift()) && (block=blocks.shift()) ){
						({
							'sprite' : sprite
						})[ op[0] ].fn(
							renderer ,
							block    ,
							op[1]    ,
							this.parallel()
						);
					}

					// just in case no replacements were made, this pushes to the next step
					process.nextTick( this.parallel() );

				}, function( err ){
					if( err ){ throw err; }

					/* Any callback to here should return one of:
					 * - replacement value
					 * - [ replacement value, CSS to add to end of block ]
					 */
					var n = 0;
					for( var i=1, l=arguments.length; i<l; i++ ){

						// skip blank arguments
						if( !arguments[i] ){ continue; }

						var    val = [].concat( arguments[i] )
						 , comment = '/*STYLUS-IMAGE-' + ( n++ ) + '*/';

						if( val.length >= 2 ){
							var  rx = new RegExp( '(' + comment.replace( /[#-\/]|[?[\]\\^|{}]/g, '\\$&' ) + '(.|\\n)+?)}' )
							  , res = rx.exec( css );

							css = css.replace( res[1], res[1] + '  ' + ( [].concat( val[1] ) ).join( '\n  ' ) + '\n' );
						}

						css = css.replace( comment, val[0] || '' );
					}

					// wipe out any un-caught css mutations
					var res;
					while( res = sRx.exec( css ) ){
						css = css.replace( res[0], '' );
					}

					// finalize all of the helpers
					sprite.finalize( this.parallel() );

				}, function(err ){
					if( err ){ throw err; }

					cb( css );
				});
			}
		}
	};
};