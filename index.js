/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Setup global JS error handlers to surface errors to logs
import { LogBox } from 'react-native';
import logger from './src/utils/logger';

LogBox.ignoreAllLogs(false);

if (global.ErrorUtils) {
	const defaultHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
	global.ErrorUtils.setGlobalHandler((error, isFatal) => {
		logger.error('Global JS error', { error, isFatal });
		if (typeof defaultHandler === 'function') defaultHandler(error, isFatal);
	});
}

AppRegistry.registerComponent(appName, () => App);
