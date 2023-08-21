/**
 * Formats a millisecond interval into Hh Mm Ss MSs.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 * 
 * @param {number} milliseconds 
 * @returns {string}
 */
function formatTime(milliseconds) {
    const ms = milliseconds % 1000;
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  
    const formattedTime = `${hours}h ${minutes}m ${seconds}s ${Math.round(ms)}ms`;
    return formattedTime;
}

module.exports.formatTime = formatTime;