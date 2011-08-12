var       path = require( 'path' )
  ,         fs = require('fs')
  ,       step = require( 'step' )
  ,     sprite = require( './fns/sprite' )
  , spriteSize = require( './fns/sprite-size' )

module.exports = function(){
	var blocks = [],
	     stack = [],
	       ops = [],
	       idx = 0,
	       sRx = /\/\*STYLUS-IMAGE-(\d+)\*\//g,
	    outputDirectory, block, properties, obj, called, renderer;

	function getId(){
		return '/*STYLUS-IMAGE-' + (idx++) + '*/';
	}

	function fn_sprite( url ){
		var sprite;

		ops.push( [
			'sprite',
			sprite = fs.realpathSync( path.dirname( renderer.options.filename) + '/' + url.val ),
			{ sprite : sprite }
		] );

		return getId();
	}

	function fn_spriteSize(){
		ops.push( [ 'spriteSize' ] );

		return getId();
	}

	function replaceVisitBlock( Compiler ){
		var oldFn = Compiler.prototype.visitBlock;

		Compiler.prototype.visitBlock = function( prop ){
			stack.push({
				block : []
			});

			var buf       = this.buf;
			this.buf      = '';
			var ret       = oldFn.apply( this, arguments );
			var blockCode = this.buf;
			this.buf      = buf + this.buf;

			blockCode += '{'; /*}*/
			blockCode = blockCode.substr( 0, blockCode.indexOf( '{'/*}*/, blockCode.indexOf( '{' /*}*/ ) + 1 ) );

			var item = stack.pop(),
			    res;

			// if we have anything in this block handled by this library,
			//   store the parsed block for later analysis
			while( res = sRx.exec( blockCode ) ){
				blocks.push( [ res[1], item.block ] );
			}

			return ret;
		}
	}

	function replaceVisitProperty( Compiler ){
		var oldFn = Compiler.prototype.visitProperty;

		Compiler.prototype.visitProperty = function( prop ){
			var val = oldFn.apply( this, arguments );

			// push the current parsed & generated data into the block
			stack[ stack.length-1 ].block.push({
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
				.define( 'sprite'    , fn_sprite     )
				.define( 'spriteSize', fn_spriteSize );

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

					blocks.sort( function( a, b ){
						return a[0] - b[0];
					} );

					// attach properties passed from ops to block
					for( var i=0, l=ops.length; i<l; i++ ){
						var add = ops[i][2] || [];

						for( var n in add ){
							( blocks[i][1].props || ( blocks[i][1].props = {} ) )[ n ] = add[ n ];
						}
					}

					// parse any operations
					var op, block;
					while( (op=ops.shift()) && (block=blocks.shift()) ){
						({
							      'sprite' : sprite
							, 'spriteSize' : spriteSize
						})[ op[0] ].fn(
							renderer ,
							block[1] ,
							op[1]    ,
							this.parallel()
						);
					}

					// just in case no replacements were made, this pushes to the next step
					process.nextTick( this.parallel() );

				}, function( err ){
					if( err ){ throw err; }

					/* Any callback to here should return one of:
					 * - line     : replace entire line
					 * - property : replacement property value
					 * - append   : CSS to add to end of block
					 */
					var n = 0;

					for( var i=1, l=arguments.length; i<l; i++ ){

						// skip blank arguments
						if( !arguments[i] ){
							n++;
							continue;
						}
						var    val = arguments[i]
						 , comment = '/*STYLUS-IMAGE-' + ( n++ ) + '*/';

						// Append any new CSS to the entire selector
						if( val.append ){
							var  rx = new RegExp( '(' /*)*/ + comment.replace( /[#-\/]|[?[\]\\^|{}]/g, '\\$&' ) + /*{(*/ '(.|\\n)+?)}' )
							  , res = rx.exec( css );

							// TODO: only add whitespace if compression is on
							css = css.replace( res[1], res[1] + '  ' + ( [].concat( val.append ) ).join( '\n  ' ) + '\n' );
						}

						// replace the property
						if( val.property ){
							css = css.replace( comment, val.property || '' );

						// replace the line
						} else if( val.line ){
							var lines = [].concat( val.line );

							var rx = new RegExp( '.*' + comment.replace( /[#-\/]|[?[\]\\^|{}]/g, '\\$&' ) + '.*' ),
							   res = rx.exec( css );

							// TODO: only add whitespace if compression is on
							css = css.replace( res[0], '  ' + lines.join( '\n  ' ) );
						}
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