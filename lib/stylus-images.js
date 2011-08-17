var        path = require( 'path' )
  ,          fs = require('fs')
  ,        step = require( 'step' )
  , includePath = __dirname + '/fns/';

module.exports = function(){
	var   blocks = []
	  ,    stack = []
	  ,      ops = []
	  ,  opNames = {}
	  ,      idx = 0
	  ,      sRx = /\/\*STYLUS-IMAGE-(\d+)\*\//g
	  , includes = []
	  ,  helpers = []
	  , outputDirectory, block, properties, obj, called, renderer;

	// include each file in includePath
	fs.readdirSync( includePath )
		.forEach( function( file ){
			if( !/\.js$/.test( file ) ){ return ; }

			includes.push( includePath + file );
		} )

	function getId(){
		return '/*STYLUS-IMAGE-' + (idx++) + '*/';
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

	function stylHandler( name, fn ){
		if( !fn ){
			fn = function(){ return []; };
		}

		return function(){
			var res = fn.apply( this, arguments );
			res.name = name;

			ops.push(res);

			return getId();
		};
	}

	return obj = {
		include : function(){
			for(var i=0, l=arguments.length; i<l; i++){
				includes.push( arguments[i] );
			}

			return this;
		},

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

			// require each file in includes
			includes.forEach( function includes( path ){
				try {
					var fn = require( path );
					if( !fn ){ throw 'foo'; }

				}catch(err){ return; }

				helpers.push( fn );

				var name = fn.name || /([^\/\\]+)\.[^\/\/\\]+$/.exec( path )[1];
				opNames[ name ] = fn;

				styl.define(
					  name
					, stylHandler( name, fn.styl )
				);
			} );

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
					helpers.forEach( function helpers( helper ){
						helper.reset && helper.reset();
					} );

					blocks.sort( function( a, b ){
						return a[0] - b[0];
					} );

					// attach properties passed from ops to block
					for( var i=0, l=ops.length; i<l; i++ ){
						var add = ops[i].properties || [];

						for( var n in add ){
							( blocks[i][1].props || ( blocks[i][1].props = {} ) )[ n ] = add[ n ];
						}
					}

					// parse any operations
					var op, block;
					while( (op=ops.shift()) && (block=blocks.shift()) ){
						opNames[ op.name ].fn(
							  renderer
							, block[1]
							, op.args
							, this.parallel()
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
					var    n = 0
					  , self = this;

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
					helpers.forEach( function helpers( helper ){
						helper.finalize && helper.finalize( self.parallel() );
					} );

					// just in case no helpers have a finalize, this pushes to next step
					process.nextTick( this.parallel() );

				}, function(err ){
					if( err ){ throw err; }

					cb( css );
				});
			}
		}
	};
};