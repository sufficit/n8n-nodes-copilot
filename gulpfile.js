const { src, dest } = require('gulp');

function buildIcons() {
	// Copy shared icons - all nodes use the centralized icon via relative path
	return src('shared/icons/*.svg').pipe(dest('dist/shared/icons'));
}

exports['build:icons'] = buildIcons;