module.exports = function config(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		shunt: {
			build: {
				"dist/hello.js": [
					"src/hello.polyfill.js",
					"src/hello.js",
					"src/hello.amd.js",
					"src/hello.commonjs.js"
				],
				"dist/hello.all.js": [
					"src/hello.polyfill.js",
					"src/hello.js",
					"src/modules/facebook.js",
					"src/modules/google.js",
					"src/modules/instagram.js",
					"src/modules/linkedin.js",
					"src/modules/twitter.js",
					"src/modules/youtube.js",
					"src/modules/gAnalytics.js",
					"src/hello.amd.js",
					"src/hello.commonjs.js"
				]
			}
		},
		uglify: {
			minify: {
				files: {
					"dist/hello.min.js": ["dist/hello.js"],
					"dist/hello.all.min.js": ["dist/hello.all.js"]
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-uglify");

	grunt.loadNpmTasks("shunt");

	grunt.registerTask("default", ["shunt:build", "uglify:minify"]);
};
