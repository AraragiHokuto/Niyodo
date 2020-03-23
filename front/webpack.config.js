module.exports = {
    devtool: "source-map",
    target: "web",
    resolve: {
	extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    devServer: {
	port: 8080,
	historyApiFallback: true,
	publicPath: "/dist/",
	proxy: {
	    '/api': {
		target: 'http://localhost:8000',
		pathRewrite: {'^/api' : ''}
	    }
	}
    },
    module: {
	rules: [
	    {
		test: /\.ts(x?)$/,
		exclude: /node_modules/,
		use: [
		    {
			loader: "ts-loader"
		    }
		]
	    },
	    {
		enforce: "pre",
		test: /\.js$/,
		loader: "source-map-loader"
	    }
	]
    },
    externals: {
	"react": "React",
	"react-dom": "ReactDOM",
	"react-router": "ReactRouter",
	"react-router-dom": "ReactRouterDOM",
	"react-day-picekr": "DayPicker",
	"@blueprintjs/core": "Blueprint.Core"
    }
};
