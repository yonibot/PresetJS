#!/usr/bin/env node
const program = require('commander');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const chalk = require('chalk');

function newConfig(name) {
	init();
	const filename = `config_files/${name || "config_"+Date.now().toString()}.json`
	const json = JSON.stringify(require('./skeleton'));
	fs.writeFile(path.join(__dirname, filename), json, (err) => {
	  if (err) throw err;
	  console.log(`New config created: ${filename}`);
	});
}

function listConfigs() {
	init();
	fs.readdir(path.join(__dirname, 'config_files'), function(err, files) {
		if (files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				console.log(`${i} -> ${files[i]}`);
			}
		} else {
			console.log(chalk.red("No configuration files yet."));
			console.log(chalk.green("Create one with `blitz new [some_project_name]`."));
		}
	});
}

function editConfig(num) {
  exec(`open ${filepath(num)}`)
}

function runConfig(num) {
	let packagesInstalled = 0;
	let packagesFailed = 0;

	const json = require(filepath(num));
	// Run packages
	console.log(chalk.yellow(`Installing ${json.packages.length} packages...`));
	for (let i = 0; i < json.packages.length; i++) {
		const package = json.packages[i];
		console.log(chalk.green(`Installing ${package}...`));
		try {
			execSync(`npm install --save ${package}`, {stdio:[0,1,2]})
			packagesInstalled++
		}
		catch(error) {
			packagesFailed++
			if (i < json.packages.length-1) {
				console.log(chalk.green("Continuing to next package..."));
			}
		}
	}

	// Run dev packages
	for (let i = 0; i < json.devPackages.length; i++) {
		const package = json.devPackages[i];
		console.log(chalk.green(`Installing dev ${package}...`));
		try {
			execSync(`npm install --save-dev ${package}`, {stdio:[0,1,2]})
		}
		catch(error) {
			if (i < json.packages.length-1) {
				console.log(chalk.green("Continuing to next dev package..."));
			}
		}
	}

	// Run shell commands
	console.log(chalk.yellow("Running shell commands..."));
	for (const command of json.shellCommands) {
		try {
			execSync(command, {stdio:[0,1,2]})
		} catch(error) {}
	}
	console.log();
	console.log(chalk.yellow("Summary: "));
	console.log(chalk.green("Packages installed: ", packagesInstalled));
	console.log(chalk.red("Packaged failed: ", packagesFailed));
}

function filepath(index) {
	const fileNames = fs.readdirSync(path.join(__dirname, 'config_files'));
	fileName = fileNames[index];
	return path.join(__dirname, 'config_files', fileName);
}

function init() {
	var dir = path.join(__dirname, 'config_files');
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}
}


program
	.version('0.0.1')
	.command('new [name]')
	.action(newConfig)

program
	.command('list')
	.action(listConfigs)

program
	.command('edit <num>')
	.action(editConfig)

program
	.command('run <num>')
	.action(runConfig)

program.parse(process.argv);


	// [] = optional input
	// <> = required input
