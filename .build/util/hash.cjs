/**
 * File / Directory hash generator.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const fs = require('fs');
const path = require("path");
const crypto = require('crypto');

function processFile(hash, filePath, ignoreList, callback) {
	if (ignoreList.includes(path.normalize(filePath))) return callback();

	const input = fs.createReadStream(filePath);

	input.on('data', (data) => { hash.update(data) });

	input.on('end', () => { callback() });

	input.on('error', (err) => { callback(err) });
}

function processDirectory(hash, directoryPath, ignoreList, callback) {
	fs.readdir(directoryPath, (err, files) => {
		if (err) return callback(err);

		files.sort();

		function processNextFile(index) {
			if (index === files.length) return callback();

			const filePath = directoryPath + '/' + files[index];

			fs.stat(filePath, (err, stats) => {
				if (err) return callback(err);

				if (stats.isDirectory()) {
					processDirectory(hash, filePath, ignoreList, (err) => {
						if (err) return callback(err);
						processNextFile(index + 1);
					});
				} else {
					processFile(hash, filePath, ignoreList, (err) => {
						if (err) return callback(err);
						processNextFile(index + 1);
					});
				}
			});
		}

		processNextFile(0);
	});
}

/**
 * Generates a file hash for a given directory.
 *
 * @param {string} directoryPath
 * @param {string[]} ignoreList
 * @return {Promise<string>} 
 */
function getDirectoryHash(directoryPath, ignoreList = []) {
	ignoreList = ignoreList.map(f => path.normalize(f));

	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('sha256');

		processDirectory(hash, directoryPath, ignoreList, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve(hash.digest('hex'));
			}
		});
	});
}

if (require.main === module) {
	let dirPath;
	if (process.argv.length > 2) {
		if (path.isAbsolute(process.argv[2])) dirPath = process.argv[2];
		else dirPath = path.join(process.cwd(), (process.argv[2]));
	} else dirPath = process.cwd();

	const ignoredFiles = process.argv.slice(3).map(f => path.join(dirPath, f));

	getDirectoryHash(dirPath, ignoredFiles)
		.then((hash) => {
			console.log(`Directory SHA256 hash:\n - Directory: ${dirPath}\n - Hash: ${hash}`);
		})
		.catch((err) => {
			console.error('Error calculating directory hash:', err);
		});
} else {
    module.exports.getDirectoryHash = getDirectoryHash
}