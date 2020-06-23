#!/usr/bin/env node
import yargs from "yargs";
import fs, { writeFileSync } from "fs";
// Parse Command Line Parameters and Handle Errors
const argv = yargs
	.options({
		from: {
			alias: "f",
			demandOption: true,
			description: "Original CSS File",
			type: "string",
		},
		to: {
			alias: "t",
			demandOption: true,
			description: "Modified CSS File",
			type: "string",
		},
		output: {
			alias: "o",
			description: "Difference Output",
			type: "string",
		},
	})
	.check((argv) => {
		if (!fs.existsSync(argv.from)) {
			throw new Error(`--from '${argv.from}' file not found`);
		}
		if (!fs.existsSync(argv.to)) {
			throw new Error(`--to '${argv.to}' file not found`);
		}
		return true;
	}).argv;
// Read and Normalize Input Files
const normalizedFrom = NormalizeCSS(fs.readFileSync(argv.from).toString());
const normalizedTo = NormalizeCSS(fs.readFileSync(argv.to).toString());
// Loop Through and Track All Styles
let styles: [
	{
		key?: string;
		value?: string[];
	}
] = [{}];
let inComment: boolean = false;
let inStyles: boolean = false;
let currentMediaBlock: string = "";
let currentElement: string = "";
let lastLine: string = "";
let lines = normalizedTo.split(/\n/);
lines.forEach((line) => {
	if (line.startsWith("@")) {
		if (!line.endsWith(";")) {
			currentMediaBlock = line.substring(0, line.length);
		} else {
			styles.push({
				key: line + "|",
				value: [],
			});
		}
	} else if (line == "*/") {
		inComment = false;
	} else if (!inComment) {
		switch (line) {
			case "/*":
				inComment = true;
				break;
			case "{":
				if (!lastLine.startsWith("@") || lastLine == "@font-face") {
					inStyles = true;
					if (
						styles.findIndex(
							(item) =>
								item.key ==
								currentMediaBlock + "|" + currentElement
						) == -1
					) {
						styles.push({
							key: currentMediaBlock + "|" + currentElement,
							value: [],
						});
					}
				}
				break;
			case "}":
				if (
					currentElement.trim().length != 0 ||
					currentMediaBlock == "@font-face"
				) {
					inStyles = false;
					currentElement = "";
					if (currentMediaBlock == "@font-face") {
						currentMediaBlock = "";
					}
				} else {
					currentMediaBlock = "";
				}
				break;
			default:
				if (inStyles) {
					const index = styles.findIndex(
						(item) =>
							item.key == currentMediaBlock + "|" + currentElement
					);
					styles[index].value?.push(line.trim());
				} else {
					// Another Selector, Append to currentElement
					currentElement += line;
				}
				break;
		}
	}
	lastLine = line;
});
// Compare Original Objects
inComment = false;
inStyles = false;
currentMediaBlock = "";
currentElement = "";
lastLine = "";
lines = normalizedFrom.split(/\n/);
lines.forEach((line) => {
	if (line.startsWith("@")) {
		if (!line.endsWith(";")) {
			currentMediaBlock = line.substring(0, line.length);
		} else {
			const index = styles.findIndex(
				(item) => item.key?.indexOf(line + "|") != -1
			);
			if (index != -1) {
				styles[index].key = "";
				styles[index].value = [];
			}
		}
	} else if (line == "*/") {
		inComment = false;
	} else if (!inComment) {
		switch (line) {
			case "/*":
				inComment = true;
				break;
			case "{":
				if (!lastLine.startsWith("@") || lastLine == "@font-face") {
					inStyles = true;
					if (
						styles.findIndex(
							(item) =>
								item.key ==
								currentMediaBlock + "|" + currentElement
						) == -1
					) {
						styles.push({
							key: currentMediaBlock + "|" + currentElement,
							value: [],
						});
					}
				}
				break;
			case "}":
				if (
					currentElement.trim().length != 0 ||
					currentMediaBlock == "@font-face"
				) {
					inStyles = false;
					currentElement = "";
					if (currentMediaBlock == "@font-face") {
						currentMediaBlock = "";
					}
				} else {
					currentMediaBlock = "";
				}
				break;
			default:
				if (inStyles) {
					const normalizedLine = line.trim();
					const keyFilter = styles.filter(
						(item) =>
							item.key == currentMediaBlock + "|" + currentElement
					);
					if (keyFilter.length != 0) {
						keyFilter[0].value = keyFilter[0].value?.filter(
							(item) => item != normalizedLine
						);
					} else {
						styles.push({
							key: currentMediaBlock + "|" + currentElement,
							value: [],
						});
					}
				} else {
					// Another selector, append to currentElement
					currentElement += line;
				}
				break;
		}
	}
	lastLine = line;
});
// Print or Write Remaining Objects
// @TODO: Resolve @font-face Issue
let output: string[] = [];
let lastMediaBlock = "";
styles
	.filter((item) => item.value?.length != 0 && item.key != undefined)
	.forEach((item) => {
		let extraIndentation = "";
		let mediaBlock = item.key?.substring(0, item.key.indexOf("|"));
		if (mediaBlock != undefined && mediaBlock.length > 0) {
			if (mediaBlock != lastMediaBlock) {
				if (lastMediaBlock.trim().length != 0) {
					output.push("}");
				}
				output.push(`${mediaBlock} {`);
			}
			// @PLACEHOLDER: extraIndentation = mediaBlock.indexOf("@font-face") == -1 ? "\t" : "";
			extraIndentation = "\t";
		} else {
			if (lastMediaBlock.trim().length != 0) {
				output.push("}");
			}
			extraIndentation = "";
		}
		let element = item.key?.substring(item.key.indexOf("|") + 1);
		// Split selectors and place one on a line
		let selectors: string[] | undefined = element?.split(",");
		if (selectors != undefined) {
			for (let i = 0; i < selectors.length; i++) {
				let selectorLine: string = extraIndentation + selectors[i];
				// @PLACEHOLDER: if (mediaBlock?.indexOf("@font-face") == -1) {}
				if (i == selectors.length - 1) {
					selectorLine += " {";
				} else {
					selectorLine += ",";
				}
				output.push(
					selectorLine.replace(
						/(\s{1,})?([>|+|~|])(\s{1,})?/g,
						" $2 "
					)
				);
			}
		}
		item.value?.forEach((value) => {
			if (value != undefined) {
				output.push(
					`${extraIndentation}\t${value.replace(
						/(.+?)\:(.+)/,
						"$1: $2"
					)};`
				);
			}
		});
		output.push(`${extraIndentation}}\n`);
		if (mediaBlock != undefined) {
			lastMediaBlock = mediaBlock;
		}
	});
if (lastMediaBlock.trim().length != 0) {
	output.push("}\n");
}
if (output.length != 0) {
	if (
		argv.output != undefined &&
		argv.output.endsWith(".css") &&
		argv.output.trim().length !== 4
	) {
		writeFileSync(argv.output.trim(), output.join("\n"));
		log(`file written to ${argv.output}`);
	} else {
		console.log(output.join("\n"));
	}
} else {
	log("identical files");
}
/**
 * Standardize CSS file spacing and other formatting
 * @param input raw string to be normalized
 * @returns normalized output, with whitespace minimized
 */
function NormalizeCSS(input: string): string {
	let output: string[] = [];
	// Collapse Whitespace
	const lines = input
		.replace(/\r?\n/gm, "\n")
		.replace(/\t/gm, "")
		.replace(/\s{2,}/gm, " ")
		.split(/\n/);
	// Iterate Through and Normalize Each Line
	lines.forEach((line) => {
		// Eliminate Trailing and Leading Whitespace
		line = line.trim();
		if (line.length != 0) {
			output = AddNormalizedLine(line, output);
		}
	});
	return output.join("\n");
}
/**
 * Standardize CSS line spacing and other formatting
 * @param line raw string to be normalized
 * @returns normalized lines
 */
function AddNormalizedLine(line: string, output: string[]): string[] {
	// Eliminate Trailing and Leading Whitespace
	line = line.trim();
	// Move Each of the Following Characters to New Normalized Line
	const specialCharacters: string[] = ["{", "}", "/*", "*/"];
	specialCharacters.forEach((specialCharacter) => {
		let openCharacter = line.indexOf(specialCharacter);
		while (openCharacter != -1 && line.length > 0) {
			if (openCharacter == 0) {
				output.push(specialCharacter);
			} else {
				output = AddNormalizedLine(
					line.substr(0, openCharacter),
					output
				);
				output.push(specialCharacter);
			}
			line = line.substr(openCharacter + specialCharacter.length);
			openCharacter = line.indexOf(specialCharacter);
		}
	});
	// Break Individual Styles Into Their Own Lines
	let semicolon = line.indexOf(";");
	while (semicolon != -1 && line.length > 0) {
		// Handle Empty Lines
		if (semicolon == 0) {
			if (line.length > 1) {
				line = line.substring(1);
			} else {
				break;
			}
		}
		if (semicolon < line.length - 1) {
			output = AddNormalizedLine(line.substr(0, semicolon + 1), output);
			line = line.substring(semicolon + 1);
			break;
		} else {
			// Remove Trailing Semicolon
			if (!line.startsWith("@")) {
				line = line.substring(0, line.length - 1);
			} else {
				break;
			}
		}
		semicolon = line.indexOf(";");
	}
	// Append Newlines
	line = line.trim();
	if (line.length != 0) {
		line.replace(/\s?:\s?/g, ":")
			.split(";")
			.forEach((line) => {
				line = line.trim();
				if (line.length != 0) {
					output.push(line);
				}
			});
	}
	return output;
}
/**
 * Log line formatting based on process output
 * @param line raw string to log
 */
function log(line: string): void {
	if (Boolean(process.stdout.isTTY)) {
		console.log(line);
	} else {
		console.log(`/* css-delta: ${line} */`);
	}
}
