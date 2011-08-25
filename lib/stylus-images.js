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
	  , outputDirectory, block, properties, obj, called, renderer;

	// include each file in includePath
	fs.readdirSync( includePath )
		.forEach( function( file ){
			if( !/\.js$/.test( file ) ){ return ; }

			includes.push( includePath + file );
		} )

	return obj = {
		include : function(){
			for(var i=0, l=arguments.length; i<l; i++){
				includes.push( arguments[i] );
			}

			return this;
		},

		use : function( styl ){

			var self = this;

			// import each styl
			fs.readdirSync( __dirname + '/stylus' )
				.forEach( function( file ){
					if( file[0] === '_' ){ return; }

					var path = __dirname + '/stylus/' + file;
					if( !fs.statSync( path ).isFile() ){ return; }

					styl.import( path );
				});

			// require each file in includes
			includes.forEach( function includes( path ){
				try {
					var fn = require( path );
					if( !fn || ( fn.constructor.name != 'Function' ) ){ throw 'Not a function'; }

				}catch(err){ return; }

				// get file name without extension
				var    name = fn.name || /([^\/\\]+)\.[^\/\/\\]+$/.exec( path )[1]
				  , handler = new fn();

				opNames[ name ] = handler;
				handler.name || ( handler.name = name );

				styl.define(
					  name
					, stylHandler( name, handler )
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

				step(function(){
					// finalize all of the helpers
					for( var op in opNames ){
						var helper = opNames[ op ];
						helper.finalize && helper.finalize( self.parallel() );
					}

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