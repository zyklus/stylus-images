var     im = require( 'imagemagick' )
  ,     fs = require( 'fs' )
  ,    box = require( './../box-packing' )
  , factor = require( './../prime-factor' )
  ,   step = require( 'step' )
  ,   path = require( 'path' )
  ,  cache = {}
  , images = {}
  ,     ix = 0
  ,  imgIx = 0;

im.convert.path = path.normalize( __dirname + '/../im-convert-proxy.sh' );
path.relative = require( './../relative-path' );

function storeAndGetImagePos( renderer, css, sprite, cb ){
	if( cache[ sprite ] ){
		cb( null, cache[ sprite ] );
		return;
	}

	if( !renderer.get( 'filename' ) ){ throw new Error( 'Renderer.filename is required' ); }

	step(function(){
		// get image dimensions
		im.identify( sprite, this );

	}, function( err, info ){
		var repeat = 'no-repeat',
		      bgRx = /^background(-repeat)?$/,
		     repRx = /(no-)?repeat(-[xy])?/;

		for( var i=0, l=css.length, param; i<l; i++ ){
			param = css[i];

			// determine the background-repeat
			if( bgRx.test( param.prop.name ) && repRx.test( param.val ) ){
				repeat = repRx.exec( param.val )[0];
			}
		}

		var key = info.format + '-' + repeat,
		    pos, image;

		// determine the image and position by background-repeat
		switch( repeat ){
			case 'no-repeat': // sprite
				image = images[ key ] || ( images[ key ] = { box : new box() } );

				pos = image.box.add( info.width, info.height );
				break;

			case 'repeat-x' : // horizontal sprite
				image = images[ key ] || ( images[ key ] = { size: 0, repeat: 'x', factors: [] } );
				images[ key ].factors = factor.merge( image.factors, factor.factor( info.width ) );

				pos = { x: 0, y: image.size };
				image.size += info.height;

				break;

			case 'repeat-y' : // vertical sprite
				image = images[ key ] || ( images[ key ] = { size: 0, repeat: 'y', factors: [] } );
				images[ key ].factors = factor.merge( image.factors, factor.factor( info.height ) );

				pos = { x: info.size, y: 0 };
				image.size += info.width;
				break;

			case 'repeat'   : // no sprite!  Danger, Will Robinson!
				image = images[ 'new-' + (ix++) ] = {};
				
				pos = { x: 0, y: 0 };
				break;

			default:
				// no-repeat-x, no-repeat-y
				throw new Error( 'Invalid background-position: ' + repeat );
		}

		var cssDir = path.dirname( renderer.get( 'filename' ) + 'a' )
		  , imgDir = renderer.get( 'imgPath' ) == '-first-image-dir'
		       ? path.dirname( sprite )
		       : path.dirname( ( renderer.get( 'imgPath' ) || renderer.get( 'filename' ) ) + 'a' );

		( image.images || ( image.images = [] ) ).push( { src : sprite, pos : pos } );
		image.src  || ( image.src  = path.relative( cssDir, imgDir ) + 'sprite-' + (imgIx++) + '.' + info.format.toLowerCase() );
		image.path || ( image.path = path.resolve( cssDir + '/' + image.src ) );

		cache[ sprite ] = {
			src  : image.src,
			pos  : pos
		};

		cb( null, cache[ sprite ] );
	});
}

module.exports = {
	reset : function reset(){
		 cache = {};
		images = {};
	},

	styl : function styl( url ){
		var sprite;

		return {
			        args : sprite = fs.realpathSync( path.dirname( this.options.filename) + '/' + url.val )
			, properties : { sprite : sprite }
		};
	},

	fn : function fn( renderer, css, sprite, cb ){
		step(function(){
			storeAndGetImagePos( renderer, css, sprite, this );

		}, function( err, img ){
			if(err){ throw err; }

			cb( null, {
				property : 'url("' + img.src + '")',
				append   : 'background-position: ' + ( img.pos.x ? -img.pos.x + 'px' : 0 ) + ' ' + ( img.pos.y ? -img.pos.y + 'px' : 0 ) + ';'
			});
		});
	},

	finalize : function finalize( cb ){
		step(function(){
			// tell IM to generate the sprites!
			for( var n in images ){
				var img = images[ n ];

				if( img.box ){      // sprites
					var cmd
					im.convert(cmd = [
						  '-size'
						, img.box.width + 'x' + img.box.height
						, 'xc:transparent'
						, '-draw'
						, "'" + img.images.map(function( val ){
							return 'image over ' + val.pos.x + ',' + val.pos.y + ' 0,0 "' + val.src + '"';
						}).join(' ') + "'"
						, img.path
					], function( err ){
						if( err ){ throw err; }
					});
				}else if( img.size ){ // repeating sprites
				}else{                // single image
				}
			}
		});
		cb();
	}
};