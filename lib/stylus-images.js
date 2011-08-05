module.exports.use   = use;
module.exports.build = build;

function use( styl ){
	styl
		.define( 'image' , require( __dirname + '/fns/image'  ) )
		.define( 'noise' , require( __dirname + '/fns/noise'  ) )
		.define( 'sprite', require( __dirname + '/fns/sprite' ) )
}

function build( css, cb ){
}