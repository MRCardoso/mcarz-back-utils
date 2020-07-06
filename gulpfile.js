const gulp = require('gulp')
const series = gulp.series
const ts = require('gulp-typescript')
const tsProject = ts.createProject('tsconfig.json')

const transformTS =  () => {
    return tsProject
            .src()
            .pipe(tsProject())
            .pipe(gulp.dest('lib'))
}

exports.default = series(transformTS)