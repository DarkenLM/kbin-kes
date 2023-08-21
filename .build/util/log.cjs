/**
 * Loggers
 * 
 * Provides logging utilities for internal use.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const path = require("path");
const { getCallerFilePathAndPosition } = require("./getCaller.cjs");

/**
 * Console Color Formatter using ANSI Codes
 */
const consoleColors = {
	byNum: (fgNum, bgNum, ...mess) => {
		mess = mess.join(" ");
		fgNum = fgNum === undefined ? 31 : fgNum;
		bgNum = bgNum === undefined ? 1 : bgNum;
		return '\u001b[' + fgNum + 'm' + '\u001b[' + bgNum + 'm' + mess + '\u001b[0m';
	},
	black: (...mess) => consoleColors.byNum(30, undefined, ...mess),
	red: (...mess) => consoleColors.byNum(31, undefined, ...mess),
	green: (...mess) => consoleColors.byNum(32, undefined, ...mess),
	yellow: (...mess) => consoleColors.byNum(33, undefined, ...mess),
	blue: (...mess) => consoleColors.byNum(34, undefined, ...mess),
	magenta: (...mess) => consoleColors.byNum(35, undefined, ...mess),
	cyan: (...mess) => consoleColors.byNum(36, undefined, ...mess),
	white: (...mess) => consoleColors.byNum(37, undefined, ...mess),

	blackf: (fgNum, ...mess) => consoleColors.byNum(30, fgNum, ...mess),
	redf: (fgNum, ...mess) => consoleColors.byNum(31, fgNum, ...mess),
	greenf: (fgNum, ...mess) => consoleColors.byNum(32, fgNum, ...mess),
	yellowf: (fgNum, ...mess) => consoleColors.byNum(33, fgNum, ...mess),
	bluef: (fgNum, ...mess) => consoleColors.byNum(34, fgNum, ...mess),
	magentaf: (fgNum, ...mess) => consoleColors.byNum(35, fgNum, ...mess),
	cyanf: (fgNum, ...mess) => consoleColors.byNum(36, fgNum, ...mess),
	whitef: (fgNum, ...mess) => consoleColors.byNum(37, fgNum, ...mess)
};

global.consoleColors = consoleColors

const LoggerLevel = {
    DEFAULT: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    DEBUG: 4,
    SUCCESS: 5
}

const LoggerLevelMapper = {
    [LoggerLevel.DEFAULT]: " DEFAULT ",
    [LoggerLevel.INFO]:    "   INFO  ",
    [LoggerLevel.WARN]:    "   WARN  ",
    [LoggerLevel.ERROR]:   "  ERROR  ",
    [LoggerLevel.DEBUG]:   "  DEBUG  ",
    [LoggerLevel.SUCCESS]: " SUCCESS "
}

const LoggerColors = {
    [LoggerLevel.DEFAULT]: (...args) => args.join(" "),
    [LoggerLevel.INFO]: consoleColors.blue,
    [LoggerLevel.WARN]: consoleColors.yellow,
    [LoggerLevel.ERROR]: consoleColors.red,
    [LoggerLevel.DEBUG]: consoleColors.magenta,
    [LoggerLevel.SUCCESS]: consoleColors.green
}

const _filePathParent = path.join(__dirname, "..");
const _logger = function (active, level, headered, colored, ...args) {
    if (active) {
        let colorer = colored ? LoggerColors[level] : LoggerColors[LoggerLevel.DEFAULT];

        const printValues = [];
        if (global._buildOptions.debug) printValues.push(`[${getCallerFilePathAndPosition(_filePathParent, 3)}]`);
        if (headered) printValues.push(`[${LoggerLevelMapper[level].toUpperCase()}]`);
        printValues.push(...args);

        const colorable = [], rest = [];
        for (const arg of printValues) {
            if (arg instanceof Object) rest.push(arg);
            else colorable.push(arg);
        }

		return console.log(colorer(...colorable), ...rest);
	} else {
		return;
	}
}

/**
 * Logger used throughout the build system.
 * 
 * Methods prefixed with the letter 's' mean they will be executed even when the debug mode is disabled.
 */
const logger = {
    //#region Log
    log(...args) {
        return _logger(global._buildOptions.debug, LoggerLevel.DEFAULT, false, false, ...args);
    },
    slog(...args) {
        return _logger(true, LoggerLevel.DEFAULT, false, false, ...args);
    },
    //#endregion

    //#region Info
    info(...args) {
        return _logger(global._buildOptions.debug, LoggerLevel.INFO, true, true, ...args);
    },
    sinfo(...args) {
        return _logger(true, LoggerLevel.INFO, true, true, ...args);
    },
    //#endregion

    //#region Warn
    warn(...args) {
        return _logger(global._buildOptions.debug, LoggerLevel.WARN, true, true, ...args);
    },
    swarn(...args) {
        return _logger(true, LoggerLevel.WARN, true, true, ...args);
    },
    //#endregion

    //#region Error
    error(...args) {
        return _logger(global._buildOptions.debug, LoggerLevel.ERROR, true, true, ...args);
    },
    serror(...args) {
        return _logger(true, LoggerLevel.ERROR, true, true, ...args);
    },
    //#endregion

    //#region Debug
    debug(...args) {
        return _logger(global._buildOptions.debug, LoggerLevel.DEBUG, true, true, ...args);
    },
    sdebug(...args) {
        return _logger(true, LoggerLevel.DEBUG, true, true, ...args);
    },
    //#endregion

    //#region Success
    success(...args) {
        return _logger(global._buildOptions.debug, LoggerLevel.SUCCESS, true, true, ...args);
    },
    ssuccess(...args) {
        return _logger(true, LoggerLevel.SUCCESS, true, true, ...args);
    }
    //#endregion
}

module.exports.consoleColors = consoleColors;
module.exports.logger = logger;