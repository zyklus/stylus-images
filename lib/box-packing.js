module.exports = Box = function Box(){
	this.boxes  = [];
	this.width  = 0;
	this.height = 0;
};

Box.prototype = {
	add : function( w, h ){
		var minSize = Infinity,
		    minDims = Infinity,
		     minBox = { x1: 0, x2: w, y1: 0, y2: h },
		    box1, box2, size, dims;

		/* loop all boxes
		 * - try to put a new box at top-right and bottom-left of existing box
		 * - determine if there is an intersect issue
		 * - if no intersect, minimize this position
		 */
		for( var i=0, l=this.boxes.length; i<l; i++ ){
			box1 = this.boxes[i];

			// attempt to place new box at top-right of current box
			if(
				   ( ( size = Math.max( box1.x2 + w, box1.y1 + h ) ) <= minSize )
				&& ( ( dims = Math.max( box1.x2 + w, this.width ) + Math.max( box1.y1 + h, this.height ) ) < minDims )
				&& ( !this._hasOverlaps( box2 = { x1: box1.x2, x2: box1.x2 + w, y1: box1.y1, y2: box1.y1 + h } ) )
			){
				 minBox = box2;
				minSize = size;
				minDims = dims;
			}

			// attempt to place new box at bottom-left of current box
			if(
				   ( ( size = Math.max( box1.x1 + w, box1.y2 + h ) ) <= minSize )
				&& ( ( dims = Math.max( box1.x1 + w, this.width ) + Math.max( box1.y2 + h, this.height ) ) < minDims )
				&& ( !this._hasOverlaps( box2 = { x1: box1.x1, x2: box1.x1 + w, y1: box1.y2, y2: box1.y2 + h } ) )
			){
				 minBox = box2;
				minSize = size;
				minDims = dims;
			}
		}

		this.boxes.push( minBox );

		this.width  = Math.max( this.width , minBox.x2 );
		this.height = Math.max( this.height, minBox.y2 );

		return {
			  x : minBox.x1
			, y : minBox.y1
		};
	},

	_hasOverlaps : function( box ){
		for( var i=0, l=this.boxes.length; i<l; i++){
			if( boxesOverlap( box, this.boxes[i] ) ){
				return true;
			}
		}

		return false;
	}
};

function boxesOverlap( box1, box2 ){
	return (
		   (box1.x1 < box2.x2)
		&& (box1.x2 > box2.x1)
		&& (box1.y1 < box2.y2)
		&& (box1.y2 > box2.y1)
	);
}