var canvas = require('canvas');

module.exports = function(){
	var blocks = {},
	    outputDirectory, block, properties, imageCalled, obj;

	function sprite( url ){
		return '';
	}

	function replaceVisitBlock( Compiler ){
		var oldFn = Compiler.prototype.visitBlock;

		Compiler.prototype.visitBlock = function( prop ){
			block = {};
			var buf = this.buf;
			this.buf = '';
			var ret = oldFn.apply( this, arguments );
			this.buf = buf + this.buf;
			return ret;
		}
	}

	function replaceVisitProperty( Compiler ){
		var oldFn = Compiler.prototype.visitProperty;

		Compiler.prototype.visitProperty = function( prop ){
			return oldFn.apply( this, arguments );
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
				.define( 'sprite', sprite );
		},

		setOutputDirectory : function( dir ){
			outputDirectory = dir;
		},

		render : function( cb ){
			return function( err, css ){
				if( err ){ throw err; }

				cb( css );
			}
		}
	};
};