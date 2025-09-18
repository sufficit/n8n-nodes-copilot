const { src, dest } = require('gulp');

function buildIcons() {
	// Copy only shared icons - all nodes use the centralized icon
	return src('shared/icons/*.svg').pipe(dest('dist/shared/icons'));
}

exports['build:icons'] = buildIcons;