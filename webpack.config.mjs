import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path, { resolve as _resolve } from 'path';
import { fileURLToPath } from 'url';
import { GenerateSW } from 'workbox-webpack-plugin';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  entry: ['./src/index.ts', './src/style.scss'],
  output: {
    path: _resolve(dirname, 'dist'),
  },
  devServer: {
    open: true,
    host: 'localhost',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
  },
};

export default () => {
  if (isProduction) {
    config.mode = 'production';
    config.plugins.push(new GenerateSW());
  } else {
    config.mode = 'development';
  }
  return config;
};
